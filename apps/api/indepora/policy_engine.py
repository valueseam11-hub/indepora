from datetime import datetime, timezone
from typing import Any


def assess_freshness(items: list[dict[str, Any]], max_age_days: int | None) -> dict[str, Any]:
    if max_age_days is None:
        return {"state": "NOT_CONFIGURED", "max_age_days": None, "stale_evidence_ids": []}
    now = datetime.now(timezone.utc)
    stale: list[str] = []
    assessed = 0
    for item in items:
        published_at = item.get("published_at")
        if not published_at:
            continue
        assessed += 1
        if published_at.tzinfo is None:
            published_at = published_at.replace(tzinfo=timezone.utc)
        age = (now - published_at.astimezone(timezone.utc)).total_seconds() / 86400
        if age > max_age_days:
            stale.append(item["id"])
    return {
        "state": "ASSESSED" if assessed else "INSUFFICIENT_METADATA",
        "max_age_days": max_age_days,
        "assessed_items": assessed,
        "stale_evidence_ids": stale,
    }


def evaluate_policy(
    evidence: list[dict[str, Any]], relations: dict[str, Any], conflicts: list[dict[str, Any]],
    freshness: dict[str, Any], policy: dict[str, Any] | None,
) -> dict[str, Any]:
    if policy is None:
        return {
            "outcome": "NOT_CONFIGURED",
            "reasons": ["No customer policy was supplied; no decision gate was applied."],
            "interpretation": "This is not a truth or reliability judgment.",
        }

    document_keys = {
        item.get("canonical_url") or item.get("content_fingerprint") or item["id"]
        for item in evidence
    }
    reasons: list[str] = []
    outcome = "ALLOW"
    if len(document_keys) < policy.get("minimum_documents", 0):
        outcome = "BLOCK"
        reasons.append("The configured minimum document count was not met.")

    has_unknowns = bool(relations.get("unknown_relationship_pairs")) or any(
        item.get("lineage_state") == "UNKNOWN" for item in evidence
    )
    unknown_action = policy.get("unknown_lineage_action", "qualify")
    if has_unknowns and unknown_action == "block":
        outcome = "BLOCK"
        reasons.append("The configured policy blocks unresolved lineage.")
    elif has_unknowns and unknown_action == "qualify" and outcome == "ALLOW":
        outcome = "QUALIFY"
        reasons.append("Some evidence relationships remain unknown.")

    if conflicts and policy.get("require_conflict_review", True):
        outcome = "ESCALATE" if outcome != "BLOCK" else outcome
        reasons.append("Conflicting support and contradiction labels require review.")

    stale = freshness.get("stale_evidence_ids", [])
    if stale and outcome == "ALLOW":
        outcome = "QUALIFY"
        reasons.append("Some evidence exceeds the configured freshness window.")

    if not reasons:
        reasons.append("All configured workflow checks passed.")
    return {
        "outcome": outcome,
        "reasons": reasons,
        "interpretation": "Customer-configured workflow result only; it does not establish that a claim is true or sufficiently supported.",
        "policy": policy,
    }
