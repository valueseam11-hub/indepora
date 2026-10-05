#!/usr/bin/env python3
"""Bounded synthetic load check for the approved live Indepora preview.

Hard limits: 250 synthetic analysis calls plus one health check, 60 seconds
maximum, concurrency phases of 1/5/10, and immediate stop-on-instability. The
host, payload, and limits are fixed; no argument can expand or redirect the run.
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
MAX_ANALYSIS_REQUESTS = 250
MAX_NON_200_RATE = 0.01
MAX_P95_SECONDS = 5.0
PHASES = ((1, 25), (5, 75), (10, 150))

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


def phase_error_count(results: list[dict[str, Any]]) -> int:
    return sum(result["status"] != 200 or not result["valid_payload"] for result in results)


async def send_one(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    global_sent: dict[str, int],
    phase: dict[str, Any],
    deadline: float,
) -> dict[str, Any] | None:
    async with semaphore:
        if phase["stop_event"].is_set():
            return None
        if time.monotonic() >= deadline:
            phase["stop_reason"] = "global_60_second_deadline"
            phase["stop_event"].set()
            return None

        started = time.monotonic()
        global_sent["analysis"] += 1
        phase["requests_started"] += 1
        try:
            response = await client.post("/v1/stemcheck", json=PAYLOAD)
            valid_payload = False
            if response.status_code == 200:
                try:
                    body = response.json()
                    valid_payload = isinstance(body, dict) and isinstance(body.get("summary"), dict)
                except ValueError:
                    valid_payload = False
            result = {
                "status": response.status_code,
                "seconds": time.monotonic() - started,
                "valid_payload": valid_payload,
                "error_type": None,
            }
        except httpx.RequestError as exc:
            result = {
                "status": 0,
                "seconds": time.monotonic() - started,
                "valid_payload": False,
                "error_type": type(exc).__name__,
            }

        phase["results"].append(result)
        statuses = [item["status"] for item in phase["results"]]
        latencies = [float(item["seconds"]) for item in phase["results"]]
        errors = phase_error_count(phase["results"])
        if result["status"] == 429:
            phase["stop_reason"] = "rate_limit_429"
        elif result["status"] >= 500:
            phase["stop_reason"] = "server_error_5xx"
        elif errors / len(phase["results"]) > MAX_NON_200_RATE:
            phase["stop_reason"] = "error_rate_above_1_percent"
        elif len(latencies) >= 20 and percentile(latencies, 0.95) > MAX_P95_SECONDS:
            phase["stop_reason"] = "phase_p95_above_5_seconds"
        if phase["stop_reason"]:
            phase["stop_event"].set()
        return result


def summarize_phase(phase: dict[str, Any]) -> dict[str, Any]:
    results = phase["results"]
    statuses = Counter(str(result["status"]) for result in results)
    latencies = [float(result["seconds"]) for result in results]
    errors = phase_error_count(results)
    completed = len(results)
    return {
        "concurrency": phase["concurrency"],
        "planned_requests": phase["planned_requests"],
        "requests_started": phase["requests_started"],
        "responses_completed": completed,
        "status_counts": dict(sorted(statuses.items())),
        "errors": errors,
        "error_rate": round(errors / completed, 5) if completed else 0.0,
        "latency_ms": {
            "p50": round(percentile(latencies, 0.50) * 1000, 2),
            "p95": round(percentile(latencies, 0.95) * 1000, 2),
            "max": round(max(latencies, default=0.0) * 1000, 2),
        },
        "network_error_types": dict(sorted(Counter(
            str(result["error_type"]) for result in results if result["error_type"]
        ).items())),
        "stop_reason": phase["stop_reason"],
    }


async def run_suite() -> tuple[dict[str, Any], int]:
    started = time.monotonic()
    deadline = started + MAX_DURATION_SECONDS
    phases: list[dict[str, Any]] = []
    global_sent = {"analysis": 0}
    health_requests = 0
    health_status: int | str = "not_run"
    health_ok = False
    stop_reason: str | None = None
    active_phase: dict[str, Any] | None = None

    limits = httpx.Limits(max_connections=10, max_keepalive_connections=10)
    timeout = httpx.Timeout(8.0, connect=5.0)
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=timeout, limits=limits) as client:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                stop_reason = "global_60_second_deadline"
            else:
                health_requests = 1
                try:
                    health_response = await asyncio.wait_for(client.get("/healthz"), timeout=remaining)
                    health_status = health_response.status_code
                    health_ok = health_status == 200
                    if not health_ok:
                        stop_reason = f"health_check_status_{health_status}"
                except httpx.RequestError as exc:
                    health_status = "connection_error"
                    stop_reason = f"health_or_connection_error_{type(exc).__name__}"
            if health_ok:
                for concurrency, count in PHASES:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        stop_reason = "global_60_second_deadline"
                        break
                    active_phase = {
                        "concurrency": concurrency,
                        "planned_requests": count,
                        "requests_started": 0,
                        "results": [],
                        "stop_reason": None,
                        "stop_event": asyncio.Event(),
                    }
                    # Run the existing state directly so partial phase results remain reportable.
                    semaphore = asyncio.Semaphore(concurrency)
                    tasks = [
                        asyncio.create_task(send_one(client, semaphore, global_sent, active_phase, deadline))
                        for _ in range(count)
                    ]
                    await asyncio.wait_for(asyncio.gather(*tasks), timeout=remaining)
                    summary = summarize_phase(active_phase)
                    phases.append(summary)
                    phase_stop = active_phase["stop_reason"]
                    active_phase = None
                    if phase_stop:
                        stop_reason = phase_stop
                        break
    except asyncio.TimeoutError:
        stop_reason = "global_60_second_deadline"
        if active_phase is not None:
            phases.append(summarize_phase(active_phase))
            active_phase = None
    except httpx.RequestError as exc:
        stop_reason = f"health_or_connection_error_{type(exc).__name__}"
        if active_phase is not None:
            phases.append(summarize_phase(active_phase))
            active_phase = None

    elapsed = time.monotonic() - started
    planned_total = sum(count for _, count in PHASES)
    within_limits = (
        elapsed <= MAX_DURATION_SECONDS
        and global_sent["analysis"] <= MAX_ANALYSIS_REQUESTS
        and global_sent["analysis"] <= planned_total
    )
    analysis_sent = global_sent["analysis"]
    passed = health_ok and stop_reason is None and analysis_sent == planned_total and within_limits
    report = {
        "target": BASE_URL,
        "health_check_status": health_status,
        "phase_plan": [{"concurrency": c, "requests": n} for c, n in PHASES],
        "phase_results": phases,
        "analysis_requests_sent": analysis_sent,
        "health_requests_sent": health_requests,
        "total_http_requests_sent": analysis_sent + health_requests,
        "max_analysis_requests": MAX_ANALYSIS_REQUESTS,
        "max_duration_seconds": MAX_DURATION_SECONDS,
        "elapsed_seconds": round(elapsed, 3),
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
