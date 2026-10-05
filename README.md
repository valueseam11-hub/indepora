# Indepora Reliance Fabric v0.2.0

**Indepora** is a private, single-owner evidence-assurance prototype for mapping claim-to-evidence lineage, surfacing dependent echoes, and keeping unknown relationships explicitly unknown. It does not determine claim truth or prove that sources are independent.

## What this release does

The application follows the architecture pipeline `Reliance Ingress → Claim Forge → Origin Mesh → Thread Builder → Reliance Map → Separation Engine → Conflict/Freshness/Authority assessment → optional Charter/Gate → Reliance Witness → Reliance Seal`. The FastAPI engines are separated into modules under `apps/api/indepora`; the React/Next.js interface is statically exported and served same-origin.

The workspace has **one owner account, no public sign-up, no teams, and no automatic data retention**. Inspect requests are request-scoped and are not written to the database. Only the explicit **Save Reliance Record** action stores the submitted claim, answer, evidence, citations, lineage, decision configuration, and result snapshot in Postgres. Every saved-record read, write, and delete is protected server-side and filtered by owner ID.

## Run locally

Requirements: Docker Compose, Node.js 22 for frontend development, and Python 3.12 for backend development.

```bash
docker compose up --build
```

Open `http://localhost:8000`. The local Compose stack has a development-only Postgres database and bootstrap code in `docker-compose.yml`; this code is strictly for a local workstation and must never be used on a public server. Initial owner setup is shown once, after which the setup route closes. API documentation is at `/docs`, health is at `/healthz`.

For backend tests:

```bash
cd apps/api
python -m pip install -r requirements-dev.txt
cd ../..
PYTHONPATH=apps/api python -m pytest -q apps/api/tests
```

For frontend checks:

```bash
cd apps/web
npm ci
npm run lint
npm run build
```

## Evidence input format

Each non-empty line in the console uses:

```text
ID | title | URL | supports/contradicts/unknown | optional excerpt | optional upstream evidence ID
```

Only submit `derived_from` when the relationship is known or attested. Exact normalized-text matches are observable duplicates. A same-URL match without confirming content is merely possible. Other relationships remain unknown; different URLs never mean independent evidence.

## Versioned Reliance Records

A saved snapshot includes the original submitted input, analysis output, Stemma graph, candidate Fount references, Strands, Kin relationships and methods, Fount Count, an explicitly defined Echo Mass count, Veiled/unknown lineage, conflicts, Charter, Standing/decision, engine and configuration versions, model versions, timestamp, and record ID. Historical retrieval returns the stored snapshot; it does not rerun a newer engine against the old input.

The displayed metrics are operational descriptions of the submitted dataset. Fount references are not independent-source counts. Echo Mass includes only excess appearances in components formed by observed or attested links; possible and unknown links are excluded. Veiled evidence is not automatically treated as dependent; the caller-supplied Charter controls whether unresolved lineage qualifies or blocks a workflow.

## API and privacy

Authenticated endpoints are described in [`docs/API.md`](docs/API.md). Storage and first-owner setup are described in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Privacy boundaries and remaining limitations are in [`docs/SAFETY_AND_SCOPE.md`](docs/SAFETY_AND_SCOPE.md). Primary-source security references are in [`docs/SECURITY_REFERENCES.md`](docs/SECURITY_REFERENCES.md).

Sessions are stored server-side as token digests and use HttpOnly, Secure, SameSite cookies in production, CSRF defenses, Argon2id password hashes, idle/absolute expiry, and password-change session rotation. Request logs contain only request ID, route template, method, status, and timing; request bodies and evidence are not logged by application code. The app does not call an external LLM, crawler, analytics service, or search service.

This MVP is not a compliance certification or multi-tenant SaaS system. It has no email-based password recovery, invitation/role model, managed retention schedule, external security audit, or deployment-level backup guarantee. Lost-password recovery is an operator-only Railway SSH command that prompts for the new password without echoing it and revokes all sessions. Do not treat the prototype as certified for regulated workloads.
