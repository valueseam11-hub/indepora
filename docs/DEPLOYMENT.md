# Deployment Notes

## Current v0.1 container

The repository has a root `Dockerfile` that builds the static Next.js app and serves it with FastAPI. The server listens on Railway's injected `PORT` (default 8000) and exposes `/healthz` for a readiness check. No database, volume, credentials, or user account are required for this stateless demo. It is not ready for confidential or production customer workloads because authentication, tenant isolation, persistence, and deletion/retention controls are not implemented.

## Railway

Railway documents its CLI deployment flow and Dockerfile-based service deployment in its [CLI guide](https://docs.railway.com/cli). Its public API is GraphQL at `https://backboard.railway.com/graphql/v2`; Railway distinguishes account, workspace, and project tokens, and project tokens are scoped to one project environment ([API authentication guide](https://docs.railway.com/integrations/api)). Do not put a Railway token in source, a Docker build argument, or a checked-in `.env` file.

The v0.1 service is deployed at [indepora-production.up.railway.app](https://indepora-production.up.railway.app). It is one stateless service built from this repository's root Dockerfile; no database or volume is attached. Verify usage and limits in Railway because compute can incur usage-based charges.

## GitHub

The canonical public repository is [valueseam11-hub/indepora](https://github.com/valueseam11-hub/indepora). Publish updates through the approved GitHub integration; do not fall back to a raw CLI token.

## Prototype preview

The temporary sandbox preview is for functional review only. It may stop with the sandbox lifecycle and is not the Railway deployment. Do not use it for customer or sensitive data.
