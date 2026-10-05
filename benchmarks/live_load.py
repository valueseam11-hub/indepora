#!/usr/bin/env python3
"""Bounded synthetic load check for the approved live Indepora preview.

Hard limits: 900 synthetic analysis calls + one health check, 60 seconds total,
concurrency phases of 1/5/10, and stop-on-instability thresholds. This script
intentionally has no arguments that can expand those limits or change hosts.
"""
from __future__ import annotations

import asyncio
import json
import time
from collections import Counter
from typing import Any

import httpx

BASE_URL = "https://indepora-production.up.railway.app"
MAX_DURATION_SECONDS = 60.0
MAX_ANALYSIS_REQUESTS = 900
MAX_NON_200_RATE = 0.01
MAX_P95_SECONDS = 5.0
PHASES = ((1, 100), (5, 300), (10, 500))

PAYLOAD: dict[str, Any] = {
    "claim": "Synthetic bounded-load fixture; no real claim.",
    "evidence": [
        {
            "id": "origin",
            "title": "Synthetic origin",
            "url": "https://a.example/load-test",
            "text": "Synthetic load-test text; not a factual source.",
            "origin_id": "load-fixture-a",
        },
        {
            "id": "copy",
            "title": "Synthetic attested copy",
            "url": "https://b.example/load-test",
            "text": "Synthetic load-test text; not a factual source.",
            "origin_id": "load-fixture-a",
            "derived_from": ["origin"],
        },
        {
            "id": "unknown",
            "title": "Synthetic unknown lineage",
            "url": "https://c.example/load-test",
            "text": "Synthetic item with no asserted upstream lineage.",
        },
    ],
    "policy": {
        "minimum_documents": 0,
        "unknown_lineage_action": "qualify",
        "require_conflict_review": True,
    },
}


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * quantile))]


async def send_one(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    sent: dict[str, int],
) -> dict[str, Any]:
    async with semaphore:
        started = time.monotonic()
        sent["analysis"] += 1
        try:
            response = await client.post("/v1/stemcheck", json=PAYLOAD)
            elapsed = time.monotonic() - started
            valid_payload = False
            if response.status_code == 200:
                try:
                    body = response.json()
                    valid_payload = isinstance(body, dict) and isinstance(body.get("summary"), dict)
                except (ValueError, json.JSONDecodeError):
                    valid_payload = False
            return {
                "status": response.status_code,
                "seconds": elapsed,
                "valid_payload": valid_payload,
                "error_type": None,
            }
        except httpx.RequestError as exc:
            return {
                "status": 0,
                "seconds": time.monotonic() - started,
                "valid_payload": False,
                "error_type": type(exc).__name__,
            }


async def run_phase(
    client: httpx.AsyncClient,
    concurrency: int,
    count: int,
    sent: dict[str, int],
) -> list[dict[str, Any]]:
    semaphore = asyncio.Semaphore(concurrency)
    tasks = [asyncio.create_task(send_one(client, semaphore, sent)) for _ in range(count)]
    return await asyncio.gather(*tasks)


def summarize_phase(concurrency: int, count: int, results: list[dict[str, Any]]) -> dict[str, Any]:
    statuses = Counter(str(result["status"]) for result in results)
    latencies = [float(result["seconds"]) for result in results]
    errors = sum(
        result["status"] != 200 or not result["valid_payload"]
        for result in results
    )
    return {
        "concurrency": concurrency,
        "requests": count,
        "status_counts": dict(sorted(statuses.items())),
        "errors": errors,
        "error_rate": errors / count if count else 0.0,
        "latency_ms": {
            "p50": round(percentile(latencies, 0.50) * 1000, 2),
            "p95": round(percentile(latencies, 0.95) * 1000, 2),
            "max": round(max(latencies, default=0.0) * 1000, 2),
        },
        "network_error_types": dict(sorted(Counter(
            str(result["error_type"]) for result in results if result["error_type"]
        ).items())),
    }


async def run_suite() -> tuple[dict[str, Any], int]:
    started = time.monotonic()
    deadline = started + MAX_DURATION_SECONDS
    phases: list[dict[str, Any]] = []
    total_analysis = 0
    health_ok = False
    health_requests = 0
    sent = {"analysis": 0}
    stop_reason: str | None = None

    limits = httpx.Limits(max_connections=10, max_keepalive_connections=10)
    timeout = httpx.Timeout(8.0, connect=5.0)
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=timeout, limits=limits) as client:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                stop_reason = "global_60_second_deadline"
            else:
                health_requests = 1
                health_response = await asyncio.wait_for(client.get("/healthz"), timeout=remaining)
                health_ok = health_response.status_code == 200
                if not health_ok:
                    stop_reason = f"health_check_status_{health_response.status_code}"
            if health_ok:
                for concurrency, count in PHASES:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        stop_reason = "global_60_second_deadline"
                        break
                    results = await asyncio.wait_for(
                        run_phase(client, concurrency, count, sent),
                        timeout=remaining,
                    )
                    phase = summarize_phase(concurrency, count, results)
                    phases.append(phase)
                    total_analysis = sent["analysis"]
                    statuses = [result["status"] for result in results]
                    if any(status == 429 for status in statuses):
                        stop_reason = "rate_limit_429"
                    elif any(status >= 500 for status in statuses):
                        stop_reason = "server_error_5xx"
                    elif phase["error_rate"] > MAX_NON_200_RATE:
                        stop_reason = "error_rate_above_1_percent"
                    elif phase["latency_ms"]["p95"] > MAX_P95_SECONDS * 1000:
                        stop_reason = "phase_p95_above_5_seconds"
                    if stop_reason:
                        break
    except asyncio.TimeoutError:
        stop_reason = "global_60_second_deadline"
    except httpx.RequestError as exc:
        stop_reason = f"health_or_connection_error_{type(exc).__name__}"

    planned_total = sum(count for _, count in PHASES)
    within_limits = (
        time.monotonic() - started <= MAX_DURATION_SECONDS
        and sent["analysis"] <= MAX_ANALYSIS_REQUESTS
        and sent["analysis"] <= planned_total
    )
    total_analysis = sent["analysis"]
    passed = health_ok and stop_reason is None and total_analysis == planned_total and within_limits
    report = {
        "target": BASE_URL,
        "health_check_status": 200 if health_ok else "failed",
        "phase_plan": [{"concurrency": c, "requests": n} for c, n in PHASES],
        "phase_results": phases,
        "analysis_requests_sent": total_analysis,
        "health_requests_sent": health_requests,
        "total_http_requests_sent": total_analysis + health_requests,
        "max_analysis_requests": MAX_ANALYSIS_REQUESTS,
        "max_duration_seconds": MAX_DURATION_SECONDS,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "within_owner_limits": within_limits,
        "stop_reason": stop_reason,
        "passed": passed,
    }
    return report, 0 if passed else 2


def main() -> None:
    report, exit_code = asyncio.run(run_suite())
    print(json.dumps(report, indent=2, sort_keys=True))
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
