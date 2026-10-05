# Indepora API v0.2

Interactive OpenAPI documentation is available at `/docs`. The public product site is served from `/`; `/workspace/` is the private single-owner UI. The app accepts a maximum 2 MiB API request body when `Content-Length` is supplied and up to 100 evidence items per analysis.

## Public transient Stemcheck

`POST /v1/stemcheck` is the only anonymous analysis endpoint. It accepts the same analysis input used by the owner workspace, runs the deterministic pipeline in request scope, and returns that request's report to its caller. It has no database dependency and never creates a saved record. The response is marked `no-store`.

The endpoint uses an in-memory limit of 1,200 requests per client per 60-second window per app process. This is prototype abuse control, not a distributed rate limiter or denial-of-service defense; the bucket is not stored or logged. Do not send regulated or highly sensitive material to the public preview.

Example with fictional data:

```json
{
  "claim": "A fictional event occurred.",
  "evidence": [
    {"id": "origin", "title": "Synthetic origin", "url": "https://a.example/report", "text": "Synthetic text", "origin_id": "fixture-a"},
    {"id": "copy", "title": "Synthetic copy", "url": "https://b.example/report", "text": "Synthetic text", "origin_id": "fixture-a", "derived_from": ["origin"]},
    {"id": "unknown", "title": "Synthetic unknown", "url": "https://c.example/report", "text": "Unlinked synthetic text"}
  ],
  "policy": {"minimum_documents": 0, "unknown_lineage_action": "qualify", "require_conflict_review": true}
}
```

## Authentication lifecycle

Private application APIs require the single owner session. `GET /v1/auth/csrf` returns a CSRF token and sets a host-only cookie. Include the returned value in the `X-CSRF-Token` header for state-changing requests. The backend also checks a supplied `Origin` against the request host. A successful login or first-owner bootstrap sets an opaque HttpOnly session cookie and rotates the CSRF token. Production cookies are Secure, SameSite=Strict, and host-only.

| Method and path | Access | Purpose |
|---|---|---|
| `GET /v1/auth/csrf` | Public | Issue/read the CSRF token used for login and mutations. |
| `GET /v1/auth/bootstrap/status` | Public | Report only whether first-owner setup is still required. |
| `POST /v1/auth/bootstrap` | One-time | Create the first owner with the deployment bootstrap secret; disabled once an owner exists. |
| `POST /v1/auth/login` | Public + CSRF | Authenticate the existing owner; no signup route exists. |
| `GET /v1/auth/me` | Owner | Return authenticated owner metadata only. |
| `POST /v1/auth/logout` | Owner + CSRF | Revoke the current server-side session. |
| `POST /v1/auth/password` | Owner + CSRF | Verify the current password, rotate the password, and revoke previous sessions. |
| `POST /v1/stemcheck` | Public, transient | Analyze one request without saving; in-memory rate limit applies. |
| `POST /v1/reliance/inspect` | Owner | Analyze the request in memory; does not save it. |
| `POST /v1/reliance/collapse` | Owner | Compatibility alias for non-persistent inspection. |
| `POST /v1/reliance/evaluate` | Owner | Return the supplied Charter's operational outcome. |
| `POST /v1/reliance/witness` | Owner | Return the human-readable Witness. |
| `POST /v1/reliance/seal` | Owner | Return an unsigned SHA-256 digest of the analysis report. |
| `POST /v1/records` | Owner + CSRF | Recompute and persist a full Reliance Record only after explicit Save. |
| `GET /v1/records` | Owner | List records belonging to the authenticated owner; supports `limit` 1–100 and nonnegative `offset`. |
| `GET /v1/records/{record_id}` | Owner | Retrieve the stored full snapshot, without recalculating historical Standing. |
| `DELETE /v1/records/{record_id}` | Owner + CSRF | Permanently delete one owner's saved record. |
| `GET /healthz` | Public | Return service status and engine version only. |

## Owner analysis request example

The authenticated owner sends the following JSON to `/v1/reliance/inspect` (the same analysis shape is accepted by public `/v1/stemcheck`):

```json
{
  "claim": "A fictional event occurred.",
  "answer": "The fictional event occurred.",
  "evidence": [
    {
      "id": "report-a",
      "title": "Synthetic original report",
      "url": "https://example.org/report",
      "text": "Synthetic text describing the event.",
      "stance": "supports"
    },
    {
      "id": "copy-b",
      "title": "Synthetic republication",
      "url": "https://example.net/story",
      "text": "Synthetic text describing the event.",
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

`derived_from` is caller-supplied and should be set only when the relationship is known or attested. Different URLs without a lineage signal remain unknown. Exact normalized-text matches are marked observed; matching URLs with different or absent content are only possible links.

## Reliance Record snapshot

Only owner-authenticated `POST /v1/records` makes the complete input durable. The saved JSON contains the claim and evidence/citations, Stemma, candidate Founts, Strands, Kin relationships and methods, Fount Count, Echo Mass, Veiled lineage, conflicts, Charter/configuration, Standing/decision, engine/model/configuration versions, timestamp, record ID, Witness, and analysis snapshot. List responses show a short owner-only index; record detail returns the full private snapshot.

The API does not echo request data in validation errors. Application logs omit request bodies and do not log IDs from the raw URL path; Uvicorn access logs are disabled in the deployment container. The SHA-256 seal is unsigned and does not establish truth, source authenticity, or lineage correctness.
