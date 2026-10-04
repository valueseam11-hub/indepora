from typing import Any


def create_witness(report: dict[str, Any]) -> dict[str, Any]:
    summary = report["summary"]
    groups = report["relationships"]["candidate_groups"]
    policy = report["policy_result"]
    return {
        "title": "RELIANCE WITNESS",
        "claim": report["claim"]["text"],
        "evidence_appearances": summary["evidence_appearances"],
        "candidate_groups": len(groups),
        "observed_or_attested_links": summary["observed_or_attested_links"],
        "possible_links": summary["possible_links"],
        "unknown_relationship_pairs": summary["unknown_relationship_pairs"],
        "conflicts": report["conflicts"],
        "freshness": report["freshness"],
        "authority": {"state": "NOT_ASSESSED", "note": "No source authority ranking was applied."},
        "policy_outcome": policy["outcome"],
        "policy_reasons": policy["reasons"],
        "limitations": [
            "Different sources or candidate groups are not proof of independence.",
            "This report analyzes the supplied evidence and metadata; it does not verify the truth of the claim.",
            "Conflicts are detected only from user-supplied support/contradiction labels in this version.",
        ],
    }
