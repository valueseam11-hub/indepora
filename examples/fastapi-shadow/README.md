# FastAPI shadow-mode example

A local demonstration of the requested flow:

```text
AI DECISION → SHADOW GATE → Standing → counterfactual Charter outcome → human decision → (future) actual outcome
```

The example accepts an answer that has already been produced by a caller, runs one request-scoped Stemcheck analysis alongside it, and returns the original answer unchanged with a summary-only observation. It does not include an AI model, block or rewrite answers, save records, or track downstream outcomes.

## Run locally

From this directory:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

The example calls the public Stemcheck API. It uses no token and makes no automatic retry. For tests without the hosted service, use the SDK's mocked unit tests from the repository root.

## Send a fictional request

```bash
curl -sS http://127.0.0.1:8000/answer \
  -H 'Content-Type: application/json' \
  --data '{
    "answer": "A fictional event occurred.",
    "evidence": [
      {
        "id": "origin",
        "title": "Synthetic origin",
        "url": "https://source.example/report",
        "text": "Fictional demo text.",
        "origin_id": "demo-root",
        "stance": "supports"
      },
      {
        "id": "copy",
        "title": "Synthetic attested copy",
        "url": "https://copy.example/report",
        "text": "Fictional copy text.",
        "derived_from": ["origin"],
        "stance": "supports"
      },
      {
        "id": "unknown",
        "title": "Unknown-lineage item",
        "url": "https://unknown.example/report",
        "text": "Fictional item with no asserted lineage.",
        "stance": "unknown"
      }
    ],
    "policy": {
      "minimum_documents": 0,
      "unknown_lineage_action": "qualify",
      "require_conflict_review": true
    }
  }'
```

The result's `standing` and `would_charter_have_allowed_reliance` are computed/counterfactual outputs only. `action_taken` remains `false`; a human or authorized owner/operator makes the actual reliance decision. No actual outcome is captured by this example.

Use synthetic or redacted inputs only. Although public Stemcheck does not persist submitted data, the request is transmitted to the hosted service for processing. Do not log or persist the full SDK report by default; it can contain submitted answer and evidence text.

For the complete counterfactual Charter and human-decision boundary, see [the early tester pilot guide](../../docs/SHADOW_GATE_PILOT.md).
