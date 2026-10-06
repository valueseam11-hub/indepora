# Deployment Notes — v0.2

## Current services

The application is served at [indepora-production.up.railway.app](https://indepora-production.up.railway.app) from the public repository [valueseam11-hub/indepora](https://github.com/valueseam11-hub/indepora). The application Dockerfile builds the static Next.js interface, runs FastAPI, and applies Alembic migrations before starting. The Railway project already contains an existing PostgreSQL service named `Postgres`; use it. Do not create a second database or turn on public database networking.

The public site routes are `/`, `/product/`, `/developers/`, `/research/`, `/design-partners/`, and `/trust/`. `/workspace/` is the private owner UI. `/docs` is the API schema and `/healthz` is the non-sensitive health check. `POST /v1/stemcheck` is an anonymous transient demo route; saved-record APIs remain owner-authenticated.

## Required service variables

On the `indepora` application service in production, set `DATABASE_URL` as a Railway reference to the existing database:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Railway's documented cross-service syntax is `${{SERVICE_NAME.VAR}}`. `INDEPORA_COOKIE_SECURE` should be `true` in production. First-owner setup also requires a randomly generated `INDEPORA_BOOTSTRAP_SECRET` with at least 32 characters. Set it as a sealed/secret service variable if the Railway interface supports sealing. Never commit either secret or the database URL to GitHub.

Railway stages variable changes until a deployment applies them. Confirm the project diff contains only the intended database reference and app bootstrap/cookie variables before deploying. The CLI command for the non-secret reference is:

```bash
railway variable set --service indepora --environment production 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
```

Set the bootstrap secret through a secret input or stdin, not as a literal visible shell argument. Do not print the values returned by variable listings; use name-only inspection. PostgreSQL credentials must remain on the private project network.

## First owner setup

1. Deploy the app with the `DATABASE_URL` reference and a strong temporary bootstrap secret. The container runs `alembic upgrade head`; deployment should not be considered ready unless migration and `/healthz` succeed.
2. Open `/workspace/`. The one-time setup form asks for the bootstrap code, the owner's email, and a password of at least 14 characters. Enter the password directly in the browser, never in chat or source control.
3. After successful account creation, remove `INDEPORA_BOOTSTRAP_SECRET` from the app service and deploy the removal. The owner setup endpoint is also closed in the database after creation, but removing the secret eliminates the remaining deployment credential.
4. The owner may rotate the password from the app's account controls; existing sessions are revoked.

There is no public sign-up or email password reset. If the owner loses the password, an operator with Railway project SSH access can run this command from the repository's API deployment context:

```bash
railway ssh --service indepora --environment production -- python -m indepora.admin reset-owner-password
```

The command prompts for the new password with terminal echo disabled, updates only the existing owner hash, and revokes all active sessions. It does not create an owner or expose a public reset endpoint. Never re-enable first-owner setup as a recovery mechanism.

## Safe deployment checks

After deployment, verify `/healthz` returns `status: ok` and version `0.2.0`; confirm unauthenticated `/v1/records` returns `401`; verify each public static route responds with `200`; and test that analysis does not add a record until Save is explicitly clicked. Confirm the `Postgres` service itself remains private. The app uses route templates and no-body logging; Uvicorn access logs are disabled.

## Bounded live load test

`python3 benchmarks/live_load.py` is the only approved live suite for this MVP; the target host and limits are fixed in the script. It sends one health check and at most 250 synthetic `POST /v1/stemcheck` requests in three phases: 25 at concurrency 1, 75 at concurrency 5, and 150 at concurrency 10. It has a strict 60-second global deadline and stops issuing queued requests on any 5xx/429, more than 1% non-200 responses, or phase p95 above 5 seconds. It reports counts and latency percentiles only—never request inputs. It does not touch authentication, saved records, or Postgres data. An initial 100/300/500 attempt stopped safely at the time limit; the approved revised pass completed all three phases in 50.8 seconds. See [`LIVE_LOAD_TEST_REPORT.md`](LIVE_LOAD_TEST_REPORT.md). Do not raise the request, concurrency, or duration limits without owner approval.

The endpoint's 1,200-request/minute limiter is in-memory per app process and per client; the load run stays below it. This test is a bounded application smoke/load check, not a capacity certification, security audit, or SLA measurement.

## Source and container

The canonical public GitHub repository is [valueseam11-hub/indepora](https://github.com/valueseam11-hub/indepora). Build/deploy from the repository root so the root Dockerfile can include both `apps/api` and `apps/web`. Never put Railway CLI tokens, database URLs, owner passwords, session cookies, or bootstrap secrets in commits, build arguments, or checked-in `.env` files.
