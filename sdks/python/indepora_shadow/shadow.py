from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from .client import IndeporaClient
from .errors import IndeporaError


@dataclass(frozen=True, slots=True)
class ShadowObservation:
    """Result of an informational check; it cannot authorize or block a decision."""

    status: Literal["analyzed", "unavailable"]
    report: dict[str, Any] | None = None
    error_type: str | None = None

    @property
    def action_taken(self) -> Literal[False]:
        return False

    def to_public_dict(self) -> dict[str, Any]:
        """Return summary-only fields suitable for a caller response.

        The full report remains available in ``report`` for an explicit caller
        workflow, but can include claim and evidence text and should not be logged.
        """
        base: dict[str, Any] = {
            "mode": "shadow",
            "status": self.status,
            "action_taken": False,
        }
        if self.report is None:
            base["error_type"] = self.error_type
            return base

        policy_result = self.report.get("policy_result")
        veiled = self.report.get("veiled")
        policy_outcome = (
            policy_result.get("outcome") if isinstance(policy_result, dict) else None
        )
        base.update({
            "summary": self.report.get("summary"),
            "standing": self.report.get("standing"),
            "would_charter_have_allowed_reliance": {
                "outcome": policy_outcome,
                "counterfactual": True,
            },
            "veiled_state": veiled.get("state") if isinstance(veiled, dict) else None,
            "disclaimer": "Observation only; no answer was changed, blocked, or saved.",
        })
        return base


class ShadowGate:
    """Call Stemcheck alongside an answer without enforcing its outcome."""

    def __init__(self, client: IndeporaClient) -> None:
        self._client = client

    async def inspect(
        self,
        *,
        evidence: list[dict[str, Any]],
        claim: str | None = None,
        answer: str | None = None,
        policy: dict[str, Any] | None = None,
    ) -> ShadowObservation:
        try:
            report = await self._client.analyze(
                evidence=evidence,
                claim=claim,
                answer=answer,
                policy=policy,
            )
        except (IndeporaError, ValueError) as exc:
            return ShadowObservation(status="unavailable", error_type=type(exc).__name__)
        return ShadowObservation(status="analyzed", report=report)
