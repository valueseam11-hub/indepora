from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import httpx

from .errors import IndeporaAPIError, IndeporaResponseError, IndeporaTransportError

DEFAULT_BASE_URL = "https://indepora-production.up.railway.app"


class IndeporaClient:
    """Small async client for the public, request-scoped Stemcheck endpoint."""

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout_seconds: float = 5.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        if timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive")
        self._http = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=httpx.Timeout(timeout_seconds),
            headers={
                "User-Agent": "indepora-shadow/0.1.0",
                "X-Indepora-Mode": "shadow",
            },
            transport=transport,
        )

    async def analyze(
        self,
        *,
        evidence: Sequence[Mapping[str, Any]],
        claim: str | None = None,
        answer: str | None = None,
        policy: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Submit a transient analysis and return the complete API report in memory.

        The returned report may contain submitted claim and evidence text. Do not
        log or persist it unless the caller has its own explicit, lawful basis.
        This client does not call any save or owner-workspace route.
        """
        if not ((claim and claim.strip()) or (answer and answer.strip())):
            raise ValueError("Provide a non-empty claim or answer.")
        if not evidence:
            raise ValueError("Provide at least one evidence item.")

        payload: dict[str, Any] = {"evidence": [dict(item) for item in evidence]}
        if claim and claim.strip():
            payload["claim"] = claim
        if answer and answer.strip():
            payload["answer"] = answer
        if policy is not None:
            payload["policy"] = dict(policy)

        try:
            response = await self._http.post("/v1/stemcheck", json=payload)
        except httpx.RequestError as exc:
            raise IndeporaTransportError("Stemcheck request failed.") from exc

        if response.status_code != 200:
            raise IndeporaAPIError(response.status_code)

        try:
            report = response.json()
        except ValueError as exc:
            raise IndeporaResponseError("Stemcheck returned invalid JSON.") from exc

        if not isinstance(report, dict) or not isinstance(report.get("summary"), dict):
            raise IndeporaResponseError("Stemcheck returned an unexpected report shape.")
        return report

    async def aclose(self) -> None:
        await self._http.aclose()

    async def __aenter__(self) -> "IndeporaClient":
        return self

    async def __aexit__(self, exc_type: Any, exc: Any, traceback: Any) -> None:
        await self.aclose()
