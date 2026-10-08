from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field

from indepora_shadow import DEFAULT_BASE_URL, IndeporaClient, ShadowGate


class CallerAnswer(BaseModel):
    """An already-produced caller answer and its supplied evidence."""

    answer: str = Field(min_length=1, max_length=20_000)
    evidence: list[dict[str, Any]] = Field(min_length=1, max_length=100)
    policy: dict[str, Any] | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with IndeporaClient(
        base_url=os.getenv("INDEPORA_URL", DEFAULT_BASE_URL),
        timeout_seconds=5.0,
    ) as client:
        app.state.shadow_gate = ShadowGate(client)
        yield


app = FastAPI(
    title="Indepora Shadow-Mode Example",
    description=(
        "Local example only. The caller's answer is returned unchanged; Indepora is "
        "an informational side check and never blocks or saves it."
    ),
    lifespan=lifespan,
)


@app.post("/answer")
async def return_answer_with_shadow_observation(
    body: CallerAnswer,
    request: Request,
) -> dict[str, Any]:
    observation = await request.app.state.shadow_gate.inspect(
        answer=body.answer,
        evidence=body.evidence,
        policy=body.policy,
    )
    return {
        "answer": body.answer,
        "indepora_shadow": observation.to_public_dict(),
    }
