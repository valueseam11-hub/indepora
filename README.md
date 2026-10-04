# Indepora Reliance Fabric v0.1

A focused first slice of the architecture: map claim/evidence relationships, trace supplied derivations, surface exact repeated text, and make unknown lineage visible. It does not determine truth or infer independence from different URLs.

## Architecture in this build

`Reliance Ingress → Claim Forge → Origin Mesh → Thread Builder → Reliance Map → Separation Engine → Conflict/Freshness/Authority assessment → optional Reliance Policy/Gate → Reliance Witness → Reliance Seal`

Each stage is implemented as a separate Python module under `apps/api/indepora`. The web console is Next.js/React/TypeScript and the API is FastAPI.

## Run locally

Requirements: Docker with Compose, or Python 3.12 and Node.js 22.

```bash
docker compose up --build
```

Open `http://localhost:8000`. OpenAPI docs are at `http://localhost:8000/docs`; health is at `/healthz`.

For separate development servers, run the API on port 8000 and the web app on 3000:

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn indepora.main:app --reload --port 8000
```

In another terminal:

```bash
cd apps/web
npm ci
npm run dev
```

The API allows local Next.js origins on port 3000. The client uses the same-origin API when served through the container.

## Input format

Each non-empty evidence line in the console follows:

```text
ID | title | URL | supports/contradicts/unknown | optional excerpt | optional upstream evidence ID
```

Use `derived_from` only when the relationship is known or attested. Exact normalized text matches are marked as observed duplicates. Same-URL items with missing/different text are possible links. Other relations remain unknown.

## API

- `POST /v1/reliance/inspect`
- `POST /v1/reliance/collapse`
- `POST /v1/reliance/evaluate`
- `POST /v1/reliance/witness`
- `POST /v1/reliance/seal`

See `docs/API.md` and FastAPI's `/docs` for schemas. `benchmarks/fixtures/reliance-v0.1.json` contains a deterministic sample.

## Important prototype limitations

There is no authentication, tenant isolation, database persistence, or customer data retention policy in v0.1. Do not enter confidential, personal, regulated, or customer evidence in a public deployment. Inputs are analyzed in memory by the app; hosting-platform infrastructure logs and retention are outside the app's control. No external LLM, crawler, or search service is called. Source authority is not scored; conflicts rely on supplied labels; freshness needs timestamps and a policy. See `docs/SAFETY_AND_SCOPE.md`.

The SHA-256 digest is unsigned and verifies only byte-level integrity of the serialized report. It does not prove claim truth, source authenticity, or lineage correctness.

## Next architecture milestones

1. Build the benchmark and compare with URL, exact-text, similarity, and human-reviewed baselines.
2. Add a versioned OTLP/OpenInference adapter that documents field loss and never assumes missing lineage.
3. Add Postgres persistence and migrations only after defining tenant, retention, deletion, and secret-handling controls.
4. Implement MCP and SDKs against stable versioned API schemas.
5. Add customer policy gates only after a customer-specific use case and evaluation criteria are agreed.
