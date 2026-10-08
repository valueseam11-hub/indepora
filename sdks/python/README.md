# Indepora Shadow Python SDK (experimental)

This source-only preview calls Indepora's public, request-scoped `POST /v1/stemcheck` endpoint. It is intended for early feedback from RAG and AI evaluation teams.

**Status:** experimental; not published to PyPI, not a maintained production SDK, and not an enforcement integration. No authentication token, automatic retry, database save, or owner-workspace route is used.

## Install from a clone

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ./sdks/python
```

## Observe an existing answer

```python
import asyncio
from indepora_shadow import IndeporaClient, ShadowGate

async def main() -> None:
    answer = "A fictional event occurred."
    evidence = [
        {
            "id": "source-a",
            "title": "Synthetic source",
            "url": "https://source.example/report",
            "text": "Fictional evidence for a local demo.",
            "origin_id": "demo-origin",
        }
    ]
    policy = {
        "minimum_documents": 0,
        "unknown_lineage_action": "qualify",
        "require_conflict_review": True,
    }

    async with IndeporaClient() as client:
        observation = await ShadowGate(client).inspect(
            answer=answer,
            evidence=evidence,
            policy=policy,
        )

    # This is an informational side result. It never blocks or rewrites `answer`.
    print(observation.to_public_dict())

asyncio.run(main())
```

Set `INDEPORA_URL` in your own application if you need a non-default base URL. The client uses a bounded timeout and does not retry. Expected service and transport failures become an `unavailable` shadow observation; input/programming errors remain visible to the caller.

## Shadow-mode and privacy guarantees

- The SDK only calls `/v1/stemcheck`; it never calls save, records, authentication, or owner-workspace routes.
- An observation always has `action_taken: false`. The caller keeps the original answer and decides independently what to do next.
- Candidate Fount References are not verified independent sources. `veiled_state` preserves unknown lineage as unknown; it is not recast as dependence.
- `to_public_dict()` exposes summary-only fields and does not include submitted claim or evidence text. The full report remains available in memory as `observation.report` for an explicit caller workflow; **do not log or persist it by default**, because it can contain the claim and evidence text.
- Use only fictional, synthetic, or redacted examples during this prototype. The public endpoint is transient, but data is still transmitted to the hosted service for processing.
- This preview has no SLA, security review, package provenance attestation, or guarantee for regulated workloads.

## FastAPI example

See [`examples/fastapi-shadow`](../../examples/fastapi-shadow) for a minimal route that returns the caller's answer unchanged alongside a summary-only shadow observation. See [`docs/SHADOW_GATE_PILOT.md`](../../docs/SHADOW_GATE_PILOT.md) for tester recruitment and session notes.

## Decision flow

```text
AI DECISION
      ↓
SHADOW GATE
      ↓
Standing
      ↓
Would Charter have allowed reliance?
      ↓
Human/team decision
      ↓
Eventually: actual outcome
```

The `would_charter_have_allowed_reliance` value is a categorical **counterfactual** (`ALLOW`, `QUALIFY`, `ESCALATE`, `BLOCK`, or `NOT_CONFIGURED`), not a yes/no authorization. The caller or a human/authorized owner/operator makes the actual reliance decision. Team accounts are not part of this single-owner MVP. Indepora does not currently capture the downstream actual outcome; that is future work.
