<p align="center">
  <img src="https://raw.githubusercontent.com/valueseam11-hub/indepora/main/apps/web/public/brand/indepora-mark-animated.svg" alt="INDEPORA live evidence-lineage mark" width="96" />
</p>

<h1 align="center">INDEPORA</h1>
<p align="center"><strong>Evidence Assurance Infrastructure for AI</strong><br />Agent count is not evidence count.</p>

**Indepora** is a single-owner evidence-assurance prototype for mapping claim-to-evidence lineage, surfacing dependent echoes, and keeping unknown relationships explicitly unknown. It does not determine claim truth or prove that sources are independent.

## Product surfaces

The live application is hosted at [indepora-production.up.railway.app](https://indepora-production.up.railway.app). The same animated SVG mark is used in the public website header, hero, footer, browser icon, and this repository.

- `/` — public product site and synthetic, transient Stemcheck demo. Journey: see the problem → run Stemcheck → inspect computed Stemma and Standing → read limitations → review the internal evaluation → open API docs → design-partner status.
- `/product/`, `/developers/`, `/research/`, `/design-partners/`, `/trust/` — product scope, API status, internal evaluation and research limits, pilot boundaries, and privacy notes.
- `/workspace/` — private single-owner login and console; no public sign-up or team access.
- `/docs` — interactive OpenAPI documentation; `/healthz` — service status.
- `POST /v1/stemcheck` — anonymous request-scoped analysis; no database writes or saved-record URLs.
- `/v1/records*` and other workspace operations — server-side owner-authenticated.

The public site intentionally distinguishes computed output, internal evaluation, illustrative examples, planned work, and roadmap items. The REST API remains the production contract. An experimental, source-only Python Shadow Gate client and local FastAPI example are included under [`sdks/python`](sdks/python/README.md) and [`examples/fastapi-shadow`](examples/fastapi-shadow/README.md); neither is published to PyPI or production-installed. The pilot observes an existing answer without blocking or changing it. The Charter result is counterfactual, and actual-outcome tracking is future work. MCP, agent-framework plugins, telemetry ingestion, retrieval connectors, GRC export, a public benchmark leaderboard, and external action bridges are not included.

The requested decision sequence and early-tester protocol are documented in [`docs/SHADOW_GATE_PILOT.md`](docs/SHADOW_GATE_PILOT.md).

## What this release does

The application follows the architecture pipeline `Reliance Ingress → Claim Forge → Origin Mesh → Thread Builder → Reliance Map → Separation Engine → Conflict/Freshness/Authority assessment → optional Charter/Gate → Reliance Witness → Reliance Seal`. The FastAPI engines are separated into modules under `apps/api/indepora`; the React/Next.js interface is statically exported and served same-origin.

The workspace has **one owner account, no public sign-up, no teams, and no automatic data retention**. Public Stemcheck and owner inspect requests are request-scoped and are not written to the database. Only the explicit **Save Reliance Record** action stores the submitted claim, answer, evidence, citations, lineage, decision configuration, and result snapshot in Postgres. Every saved-record read, write, and delete is protected server-side and filtered by owner ID.

## Internal evaluation summary

A small team-authored evaluation is shown on the [Research page](https://indepora-production.up.railway.app/research/). Reported results:

| Case set / system | Reported result |
|---|---:|
| Indepora · development set | 9 / 12 |
| Indepora · held-out set | 9 / 11 |
| Indepora · clean held-out result | 8 / 10 |
| Text-similarity baseline · held-out set | 5 / 11 |
| URL-deduplication baseline · held-out set | 2 / 11 |

> These cases were authored by the Indepora team. The held-out set was written and evaluated before the engine was changed. One cited-URL case was added after observing the failure and is excluded from the clean held-out result.

This is an **internal evaluation**, not an independent benchmark, calibrated score, or general-performance claim. The case-level dataset and annotation protocol are not published with this prototype, so the summary is not independently reproducible from this repository. Embedding and LLM-judge baselines are not yet complete. Known failure modes include shared boilerplate, translation, undeclared news-to-filing lineage, semantic/entity-level relationships, and unknown provenance.

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

Each non-empty line in the owner console uses:

```text
ID | title | URL | supports/contradicts/unknown | optional excerpt | optional upstream evidence ID
```

Only submit `derived_from` when the relationship is known or attested. Exact normalized-text matches are observable duplicates. A same-URL match without confirming content is merely possible. Other relationships remain unknown; different URLs never mean independent evidence.

## Versioned Reliance Records

A saved snapshot includes the original submitted input, analysis output, Stemma graph, **Candidate Fount References**, Strands, Kin relationships and methods, Fount Count, an explicitly defined Echo Mass count, Veiled/unknown lineage, conflicts, Charter, Standing/decision, engine and configuration versions, model versions, timestamp, and record ID. Historical retrieval returns the stored snapshot; it does not rerun a newer engine against the old input.

The displayed metrics are operational descriptions of the submitted dataset. Candidate Fount References are not independent-source counts. Echo Mass includes only excess appearances in components formed by observed or attested links; possible and unknown links are excluded. Veiled evidence is not automatically treated as dependent; the caller-supplied Charter controls whether unresolved lineage qualifies or blocks a workflow.

## API, privacy, and validation

Authenticated and public API routes are described in [`docs/API.md`](docs/API.md). Storage and first-owner setup are described in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Privacy boundaries and remaining limitations are in [`docs/SAFETY_AND_SCOPE.md`](docs/SAFETY_AND_SCOPE.md). Primary-source security references are in [`docs/SECURITY_REFERENCES.md`](docs/SECURITY_REFERENCES.md).

Sessions are stored server-side as token digests and use HttpOnly, Secure, SameSite cookies in production, CSRF defenses, Argon2id password hashes, idle/absolute expiry, and password-change session rotation. Request logs contain request ID, route template, method, status, and timing; request bodies and evidence are not logged by application code. The app does not call an external LLM, crawler, analytics, or search service. The public Stemcheck limit is in-memory per process and is not a distributed security boundary.

Run the deterministic local fixture with:

```bash
apps/api/.venv/bin/python benchmarks/smoke.py
```

The bounded live-load suite is documented in [`docs/LIVE_LOAD_TEST_REPORT.md`](docs/LIVE_LOAD_TEST_REPORT.md); the revised fixed plan is 250 analysis requests plus one health check and a 60-second maximum. The owner-approved 1/5/10-client follow-up completed all 250 requests in 50.8 seconds. The suite is bounded validation, not capacity certification, security audit, or SLA measurement.

This MVP is not a compliance certification or multi-tenant SaaS system. It has no email-based password recovery, invitation/role model, managed retention schedule, external security audit, or deployment-level backup guarantee. Lost-password recovery is an operator-only Railway SSH command that prompts for the new password without echoing it and revokes all sessions. Do not treat the prototype as certified for regulated workloads.
