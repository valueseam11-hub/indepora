# Indepora Reliance Fabric v0.2 — Architecture

## Purpose and scope

This release implements a private, single-owner vertical slice of the supplied architecture: `Reliance Ingress → Claim Forge → Origin Mesh → Thread Builder → Reliance Map → Separation Engine → Conflict/Freshness/Authority assessment → optional Charter/Gate → Reliance Witness → Reliance Seal`. It accepts a claim or answer and up to 100 evidence objects, normalizes locators, computes exact normalized-text fingerprints, preserves caller-attested derivations, and builds an inspectable relationship map. It does not decide truth, rank authority, or infer independence from different URLs.

## Data lifecycle and access

Before an explicit Save action, claim/evidence payloads exist only in the browser's in-memory form state and in request-scoped API processing. Analysis routes do not write them to Postgres. `POST /v1/records` is the only create path for durable evidence snapshots; reads, deletion, analysis, login, and records are server-side owner-authenticated. The MVP has one fixed owner identity, no public registration, and no multi-user/team authorization. The record table has an owner key and the code filters by it so a future workspace-membership model can be added without making current access public.

The application uses a private Railway Postgres connection reference, SQLAlchemy models, and Alembic migrations. The container applies migrations before Uvicorn starts. The user database is the existing Railway Postgres service; the app must not provision a second database or expose Postgres publicly.

## Engine vocabulary and interpretation

- **Stemma** is the stored graph of the evidence items and their supplied/observed relationship edges.
- **Founts** are candidate origin references grouped by caller-provided origin ID or normalized host locator. They are references, not proof of an authoritative or independent source.
- **Strands** preserve one submitted evidence item and its supplied upstream IDs plus its current lineage state.
- **Kin relationships** are the engine's observed, attested, possible, or unknown pairwise relationships, with a method/basis for each.
- **Fount Count** reports candidate Fount references and unresolved origin references; it is deliberately not labeled an independent-source count.
- **Echo Mass** is a versioned count of excess evidence appearances inside connected components formed only by observed or attested links. Possible and unknown relationships do not contribute.
- **Veiled** records unresolved evidence and relationships as `UNKNOWN_NOT_ASSUMED_DEPENDENT`. A configured Charter can permit, qualify, or block unresolved lineage; the engine itself does not convert the unknown into a dependent edge.
- **Charter** is the caller-supplied operational policy. **Standing** is the stored policy outcome (`ALLOW`, `QUALIFY`, `BLOCK`, `ESCALATE`, or `NOT_CONFIGURED`); it is not a truth or reliability score.

The first engine has deterministic claim selection, exact-text fingerprinting, URL normalization, caller-attested derivation links, user-labeled conflict detection, and optional timestamp-based freshness. External model version is recorded as `null` because no external LLM is used.

## Saved record contract

`indepora-reliance-record/v1` stores the original input and the complete analysis snapshot, along with record ID, analysis timestamp, engine version, configuration version, model-version map, Charter, Standing/decision, graph vocabulary, conflicts, freshness, authority state, witness, and available seal. Retrieved historical records are served directly from the stored JSON snapshot. The read path does not recalculate or silently update historical Standings after a future engine upgrade.

## Security boundaries

The owner has a one-time deployment-secret bootstrap, Argon2id password hash, server-side session with a hashed random token, HttpOnly/Secure/SameSite production cookie, CSRF cookie/header and Origin check for mutations, 30-minute idle expiry, eight-hour absolute expiry, and password-rotation revocation. Login failures are rate-limited per runtime instance. Request-body size is capped at 2 MiB. Application logs intentionally exclude raw request bodies, claim/evidence text, password values, session tokens, and query values; access logging is disabled in the container.

## Repository layout

```text
apps/api/indepora/       FastAPI, auth, data models, and core engines
apps/api/migrations/     versioned Alembic schema
apps/api/tests/          auth, privacy, engine, and saved-record tests
apps/web/                Next.js/React/TypeScript single-page console
benchmarks/               synthetic fixtures and deterministic checks
docs/                     API, deployment, safety, and source references
Dockerfile                static frontend, API, and startup migrations
docker-compose.yml        local-only app and private Postgres service
```

## Next milestones

1. Validate the lineage and Echo Mass definitions against a reviewed evaluation set before positioning them as calibrated assurance metrics.
2. Add a versioned OTLP/OpenInference adapter without treating omitted fields as evidence of independence.
3. Design deletion, export, backup/restore, and metadata-only retention before adding team accounts.
4. Add SDK/MCP interfaces after stabilizing request and record schemas.
5. Add organization membership and invitation policy only for a concrete team use case.
