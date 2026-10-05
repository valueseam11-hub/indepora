# Privacy, Security, and Scope — v0.2

## Data lifecycle

The public web shell contains no customer records. The owner's claim, AI answer, evidence, and citations are held in browser memory while the page is active and are submitted only to the authenticated API. `/v1/reliance/*` endpoints compute in request scope and do not write records. The database receives a complete Reliance Record only when the authenticated owner sends `POST /v1/records` through the explicit Save action. The owner can list, open, or permanently delete saved records. The API does not maintain a raw-input event log or analytics sink.

The submitted data is necessarily processed by the app server and database when a Save is requested. Hosting-provider infrastructure may have its own operational logs/backups; these are outside the application's log redaction controls. Do not treat the deployment as a certified environment for regulated data until platform, backup, access, deletion, retention, and incident controls are independently reviewed.

## Authentication and privacy controls

There is one fixed owner account. Public registration and team access are not implemented. First-owner creation requires a one-time service secret and is disabled once the owner exists. Passwords are hashed using Argon2id; raw session tokens are never stored in Postgres. Production uses host-only Secure, HttpOnly, SameSite=Strict session cookies, CSRF cookie/header validation, Origin checks on mutations, an eight-hour absolute session lifetime, a 30-minute idle timeout, login throttling per running app instance, and password-change session revocation. All saved-record API queries are authenticated and filtered by owner ID.

Request-body validation errors use generic messages; application logging records request IDs, route templates, method, status, and duration, not raw inputs. Uvicorn access logging is disabled so request paths, query parameters, and record IDs are not copied into platform access logs by the container process. The app does not call external LLM, search, crawling, or analytics services. A 2 MiB request-body cap is applied when Content-Length is supplied; upstream ingress limits should also be configured.

## Analysis interpretation

The system cannot verify claim truth. Conflict detection uses caller-supplied stance labels. Source authority is not ranked. Freshness is assessed only when timestamps and a policy are provided. An absent lineage signal means unknown, not independent. Candidate groups are not independence units. Fount references are locator/origin references, not proofs of source authority or independence. Echo Mass counts only excess appearances connected through observed or attested relationships; possible and unknown links are excluded. Veiled relationships remain unknown and do not become dependencies unless an explicit caller-supplied Charter applies an operational action to unknown lineage.

A saved record freezes its engine version, configuration version, model-version map, timestamp, Charter, and Standing in the persisted snapshot. Retrieval serves that snapshot; a future engine upgrade does not silently rewrite historical outcomes. The seal is an unsigned SHA-256 content digest, not a digital signature or external timestamp.

## Known limitations

This is a single-owner MVP, not a multi-tenant product. The login throttle is in-memory per process and should be replaced with shared rate limiting before horizontal scaling. There is no email-based password reset, team invitation, metadata-only retention mode, automated retention job, customer export workflow, independent penetration test, SOC 2/ISO claim, or guaranteed database backup policy. Password loss can be recovered only by an operator with Railway SSH access using the hidden-prompt admin command; it is not recoverable through a public endpoint. The database and app rely on Railway's private service reference and platform access controls; this repository does not itself configure backup retention or account-level access policy.

See [`SECURITY_REFERENCES.md`](SECURITY_REFERENCES.md) for the source guidance used to choose session, password, CSRF, and Railway variable practices.
