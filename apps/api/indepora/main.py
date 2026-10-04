from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .analysis_engine import inspect_reliance
from .models import InspectRequest
from .seal_engine import create_seal

MAX_API_BODY_BYTES = 2 * 1024 * 1024

app = FastAPI(
    title="Indepora Reliance Fabric API",
    version="0.1.0",
    description=(
        "Prototype API for claim-to-evidence lineage and dependence analysis. "
        "It does not determine truth or prove independence."
    ),
    openapi_url="/openapi.json",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if request.url.path.startswith("/v1/") and content_length:
        try:
            if int(content_length) > MAX_API_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request exceeds the 2 MiB prototype limit."})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header."})
    return await call_next(request)


@app.get("/healthz", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.post("/v1/reliance/inspect", tags=["reliance"])
def inspect(request: InspectRequest) -> dict[str, Any]:
    return inspect_reliance(request)


@app.post("/v1/reliance/collapse", tags=["reliance"])
def collapse(request: InspectRequest) -> dict[str, Any]:
    return inspect_reliance(request)


@app.post("/v1/reliance/evaluate", tags=["reliance"])
def evaluate(request: InspectRequest) -> dict[str, Any]:
    return inspect_reliance(request)["policy_result"]


@app.post("/v1/reliance/witness", tags=["reliance"])
def witness(request: InspectRequest) -> dict[str, Any]:
    return inspect_reliance(request)["witness"]


@app.post("/v1/reliance/seal", tags=["reliance"])
def seal(request: InspectRequest) -> dict[str, Any]:
    report = inspect_reliance(request)
    return {"reliance_id": report["reliance_id"], "seal": create_seal(report)}


static_dir = Path(os.getenv("INDEPORA_STATIC_DIR", "/app/web"))
if static_dir.is_dir() and (static_dir / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="web")
else:
    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"service": "Indepora Reliance Fabric", "version": "0.1.0", "docs": "/docs"}
