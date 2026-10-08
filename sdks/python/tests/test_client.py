from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from indepora_shadow import IndeporaAPIError, IndeporaClient, ShadowGate


REPORT = {
    "summary": {
        "evidence_appearances": 3,
        "normalized_documents": 3,
        "candidate_groups": 2,
        "unknown_relationship_pairs": 2,
        "independence_assessment": "NOT_ESTABLISHED",
    },
    "standing": "QUALIFY",
    "policy_result": {"outcome": "QUALIFY"},
    "veiled": {"state": "UNKNOWN_NOT_ASSUMED_DEPENDENT"},
    "claim": "synthetic secret claim",
    "evidence": [{"id": "one", "text": "synthetic secret evidence"}],
}


PAYLOAD = {
    "claim": "A fictional event occurred.",
    "evidence": [
        {
            "id": "origin",
            "title": "Synthetic origin",
            "url": "https://source.example/report",
            "text": "Synthetic fixture text.",
            "origin_id": "synthetic-root",
        }
    ],
    "policy": {
        "minimum_documents": 0,
        "unknown_lineage_action": "qualify",
        "require_conflict_review": True,
    },
}


def test_analyze_sends_contract_and_returns_report() -> None:
    async def scenario() -> None:
        observed: dict[str, object] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            observed["method"] = request.method
            observed["url"] = str(request.url)
            observed["user_agent"] = request.headers.get("user-agent")
            observed["mode"] = request.headers.get("x-indepora-mode")
            observed["json"] = json.loads(request.content)
            return httpx.Response(200, json=REPORT)

        transport = httpx.MockTransport(handler)
        async with IndeporaClient(
            base_url="https://api.example/",
            transport=transport,
        ) as client:
            report = await client.analyze(
                claim=PAYLOAD["claim"],
                evidence=PAYLOAD["evidence"],
                policy=PAYLOAD["policy"],
            )

        assert observed["method"] == "POST"
        assert observed["url"] == "https://api.example/v1/stemcheck"
        assert observed["user_agent"] == "indepora-shadow/0.1.0"
        assert observed["mode"] == "shadow"
        assert observed["json"] == PAYLOAD
        assert report["summary"] == REPORT["summary"]

    asyncio.run(scenario())


def test_shadow_public_summary_omits_claim_and_evidence_text() -> None:
    async def scenario() -> None:
        transport = httpx.MockTransport(lambda _: httpx.Response(200, json=REPORT))
        async with IndeporaClient(transport=transport) as client:
            observation = await ShadowGate(client).inspect(
                claim=PAYLOAD["claim"],
                evidence=PAYLOAD["evidence"],
                policy=PAYLOAD["policy"],
            )

        summary = observation.to_public_dict()
        serialized = json.dumps(summary)
        assert observation.status == "analyzed"
        assert observation.action_taken is False
        assert summary["mode"] == "shadow"
        assert summary["veiled_state"] == "UNKNOWN_NOT_ASSUMED_DEPENDENT"
        assert summary["would_charter_have_allowed_reliance"] == {
            "outcome": "QUALIFY",
            "counterfactual": True,
        }
        assert summary["action_taken"] is False
        assert "synthetic secret claim" not in serialized
        assert "synthetic secret evidence" not in serialized

    asyncio.run(scenario())


def test_api_error_does_not_include_response_body() -> None:
    async def scenario() -> None:
        transport = httpx.MockTransport(
            lambda _: httpx.Response(503, text="sensitive upstream diagnostic")
        )
        async with IndeporaClient(transport=transport) as client:
            with pytest.raises(IndeporaAPIError) as raised:
                await client.analyze(evidence=PAYLOAD["evidence"], answer="Synthetic answer")
        assert raised.value.status_code == 503
        assert "sensitive upstream diagnostic" not in str(raised.value)

    asyncio.run(scenario())


def test_transport_failure_is_unavailable_but_non_blocking() -> None:
    async def scenario() -> None:
        def fail(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("private connection detail", request=request)

        async with IndeporaClient(transport=httpx.MockTransport(fail)) as client:
            observation = await ShadowGate(client).inspect(
                answer="The caller's original answer remains unchanged.",
                evidence=PAYLOAD["evidence"],
            )

        result = observation.to_public_dict()
        assert result["status"] == "unavailable"
        assert result["action_taken"] is False
        assert result["error_type"] == "IndeporaTransportError"
        assert "private connection detail" not in json.dumps(result)

    asyncio.run(scenario())


def test_client_rejects_empty_input_before_network_call() -> None:
    async def scenario() -> None:
        async with IndeporaClient(
            transport=httpx.MockTransport(lambda _: pytest.fail("network must not be called"))
        ) as client:
            with pytest.raises(ValueError):
                await client.analyze(evidence=PAYLOAD["evidence"])

    asyncio.run(scenario())
