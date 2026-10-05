from __future__ import annotations

import hashlib
import json
from typing import Any

from . import __version__
from .claim_forge import resolve_claim
from .models import InspectRequest
from .origin_mesh import canonicalize_url, content_fingerprint, origin_key
from .policy_engine import assess_freshness, evaluate_policy
from .records import enrich_report
from .reliance_map import build_reliance_map
from .separation_engine import analyze_relationships
from .thread_builder import build_threads
from .witness_engine import create_witness


def inspect_reliance(request: InspectRequest) -> dict[str, Any]:
    claim = resolve_claim(request.claim, request.answer)
    evidence: list[dict[str, Any]] = []
    for item in request.evidence:
        row = item.model_dump(mode="python")
        row["canonical_url"] = canonicalize_url(row.get("url"))
        row["content_fingerprint"] = content_fingerprint(row.get("text"))
        row["origin_key"] = origin_key(row.get("url"), row.get("origin_id"))
        row["transformation_ids"] = []
        evidence.append(row)

    derivations = build_threads(evidence)
    relations = analyze_relationships(evidence, derivations)

    supporting = [item["id"] for item in evidence if item.get("stance") == "supports"]
    contradicting = [item["id"] for item in evidence if item.get("stance") == "contradicts"]
    conflicts: list[dict[str, Any]] = []
    if supporting and contradicting:
        conflicts.append({
            "type": "MIXED_USER_LABELS",
            "supporting_evidence_ids": supporting,
            "contradicting_evidence_ids": contradicting,
            "basis": "user_supplied_stance_labels",
            "certainty": "OBSERVED_LABEL_CONFLICT",
            "note": "The system did not semantically verify these stances.",
        })

    charter = request.policy.model_dump(mode="json") if request.policy else None
    freshness = assess_freshness(evidence, charter.get("max_age_days") if charter else None)
    mapped = build_reliance_map(claim, evidence, relations)
    document_keys = {
        item.get("canonical_url") or item.get("content_fingerprint") or item["id"]
        for item in evidence
    }
    policy_result = evaluate_policy(evidence, relations, conflicts, freshness, charter)

    id_material = {
        "claim_id": claim["id"],
        "evidence": [
            {
                "id": item["id"],
                "title": item["title"],
                "canonical_url": item["canonical_url"],
                "content_fingerprint": item["content_fingerprint"],
                "origin_id": item.get("origin_id"),
                "derived_from": item.get("derived_from", []),
                "stance": item.get("stance"),
                "published_at": item["published_at"].isoformat() if item.get("published_at") else None,
            }
            for item in evidence
        ],
        "charter": charter,
    }
    id_bytes = json.dumps(id_material, sort_keys=True, separators=(",", ":")).encode("utf-8")
    reliance_id = "rel_" + hashlib.sha256(id_bytes).hexdigest()[:16]

    report: dict[str, Any] = {
        "schema_version": "0.2.0",
        "reliance_id": reliance_id,
        "claim": claim,
        "summary": {
            "evidence_appearances": len(evidence),
            "normalized_documents": len(document_keys),
            "candidate_groups": len(relations["candidate_groups"]),
            "observed_or_attested_links": len(relations["edges"]),
            "possible_links": len(relations["possible_links"]),
            "unknown_relationship_pairs": len(relations["unknown_relationship_pairs"]),
            "independence_assessment": "NOT_ESTABLISHED",
        },
        "evidence": evidence,
        "threads": derivations,
        "relationships": relations,
        "reliance_map": mapped,
        "conflicts": conflicts,
        "freshness": freshness,
        "authority": {"state": "NOT_ASSESSED", "note": "Source authority is not ranked in this engine version."},
        "policy_result": policy_result,
        "engine_version": __version__,
    }
    report["witness"] = create_witness(report)
    return enrich_report(report, request)
