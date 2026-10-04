# API v0.1

Interactive OpenAPI documentation is available at `/docs` when the API is running.

## Endpoints

- `GET /healthz` — process health.
- `POST /v1/reliance/inspect` — run the complete evidence-lineage pipeline.
- `POST /v1/reliance/collapse` — compatibility alias for inspect.
- `POST /v1/reliance/evaluate` — return the supplied policy outcome only.
- `POST /v1/reliance/witness` — return the human-readable explanation.
- `POST /v1/reliance/seal` — return an unsigned SHA-256 digest of the report.

## Request example

```json
{
  "claim": "The regulator issued a $12M fine.",
  "answer": "The company received a $12M fine.",
  "evidence": [
    {
      "id": "report-a",
      "title": "Original report",
      "url": "https://example.org/report",
      "text": "The regulator issued a $12M fine.",
      "stance": "supports"
    },
    {
      "id": "copy-b",
      "title": "Republished report",
      "url": "https://example.net/story",
      "text": "The regulator issued a $12M fine.",
      "derived_from": ["report-a"],
      "stance": "supports"
    }
  ],
  "policy": {
    "minimum_documents": 2,
    "unknown_lineage_action": "qualify",
    "require_conflict_review": true
  }
}
```

`derived_from` should only be supplied when the relationship is known/attested by the caller. Different URLs without a lineage signal remain unknown. See `/docs` for full field definitions.
