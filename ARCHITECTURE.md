# Indepora Reliance Fabric v0.1 — Architecture

## Goal

Build the first inspectable slice of the supplied architecture: Reliance Ingress → Claim Forge → Origin Mesh → Thread Builder → Reliance Map → Separation Engine → Conflict/Freshness/Authority assessment → optional Reliance Policy/Gate → Reliance Witness → Reliance Seal.

## v0.1 scope

- Accept one claim or answer plus up to 100 supplied evidence objects.
- Normalize URLs, compute exact normalized-text fingerprints, and preserve explicit `derived_from` links.
- Build a claim/evidence/origin relationship graph.
- Detect exact content repetition and explicit derivations; flag same-URL links as possible when supplied content does not establish a match.
- Leave unobserved relationships unknown; never label different sources independent solely because their URLs differ.
- Detect mixed support/contradiction only from user-supplied stance labels.
- Assess freshness only when a customer supplies an age policy and evidence timestamps.
- Leave source authority unassessed.
- Apply only a caller-supplied workflow policy; mark its result as operational, not truth verification.
- Generate a readable Witness and optional SHA-256 report digest.

## Project structure

```text
apps/api/indepora/       FastAPI and separated architecture modules
apps/api/tests/          deterministic API and engine tests
apps/web/                Next.js + TypeScript static single-page client
benchmarks/fixtures/      reproducible synthetic dependency examples
docs/                    local run, API, privacy, and deployment notes
Dockerfile               static frontend + API runtime image
docker-compose.yml        local app service; optional Postgres profile for later persistence
```

## Technical choices

- Python/FastAPI for the API and core engines.
- Next.js + React + TypeScript for the UI, statically exported and served same-origin by FastAPI.
- No LLM call, crawler, tenant account, or persistence in the initial version. This keeps the first public demo low-risk and reproducible. A Postgres persistence layer is intentionally a next milestone and must be added before accepting customer data or promising durable storage.
- No graph database or microservice split. The v0.1 in-memory graph remains small; use migrations and PostgreSQL relational tables when evaluation persistence is implemented.
- Railway deployment is a prototype deployment only. No API key or confidential evidence should be entered; the initial app has no authentication.

## External integrations

The OpenTelemetry adapter and MCP server remain follow-on modules. The first API can accept normalized trace/evidence JSON; adapter mappings will be versioned and document fields unavailable in an input trace.
