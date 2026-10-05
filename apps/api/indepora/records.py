from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from . import __version__
from .models import InspectRequest
from .seal_engine import create_seal

RECORD_SCHEMA_VERSION = "indepora-reliance-record/v1"
MODEL_VERSIONS = {
    "claim_extraction": "deterministic-claim-forge/v1",
    "external_llm": None,
    "origin_resolution": "origin-mesh/v1",
    "relationship_analysis": "separation-engine/v1",
}


def _canonical_hash(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


def configuration_version(request: InspectRequest) -> str:
    charter = request.policy.model_dump(mode="json") if request.policy else None
    configuration = {
        "record_schema_version": RECORD_SCHEMA_VERSION,
        "engine_version": __version__,
        "charter": charter,
        "model_versions": MODEL_VERSIONS,
    }
    return _canonical_hash(configuration)


def enrich_report(report: dict[str, Any], request: InspectRequest) -> dict[str, Any]:
    """Attach explicit, versioned vocabulary without upgrading unknowns to dependence."""
    evidence = report["evidence"]
    relations = report["relationships"]
    origin_members: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in evidence:
        key = item.get("origin_key")
        if key:
            origin_members[key].append(item)

    founts: list[dict[str, Any]] = []
    evidence_to_fount: dict[str, str | None] = {item["id"]: None for item in evidence}
    for key, members in sorted(origin_members.items()):
        fount_id = "fount_" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
        explicit = key.startswith("origin:")
        founts.append({
            "fount_id": fount_id,
            "basis": "user_supplied_origin_id" if explicit else "normalized_host_locator",
            "certainty": "ATTESTED_IDENTITY" if explicit else "CANDIDATE_ORIGIN_REFERENCE",
            "evidence_ids": sorted(item["id"] for item in members),
            "note": "A Fount reference is not proof of independent or authoritative origin.",
        })
        for item in members:
            evidence_to_fount[item["id"]] = fount_id

    strands = []
    for item in evidence:
        strands.append({
            "strand_id": "strand_" + item["id"],
            "evidence_id": item["id"],
            "fount_id": evidence_to_fount[item["id"]],
            "derived_from": list(item.get("derived_from") or []),
            "lineage_state": item.get("lineage_state", "UNKNOWN"),
            "certainty": "ATTESTED" if item.get("derived_from") else "UNKNOWN",
        })

    observed_edges = [
        edge for edge in relations.get("edges", [])
        if edge.get("certainty") in {"OBSERVED", "ATTESTED"}
    ]
    echo_mass_count = sum(max(0, len(group.get("members", [])) - 1) for group in relations.get("candidate_groups", []))
    kin = []
    for edge in relations.get("edges", []):
        kin.append({**edge, "method": edge.get("basis", "unspecified_input_or_engine_rule")})
    for edge in relations.get("possible_links", []):
        kin.append({**edge, "method": edge.get("basis", "unspecified_input_or_engine_rule")})
    for pair in relations.get("unknown_relationship_pairs", []):
        kin.append({
            "from": pair["left"],
            "to": pair["right"],
            "type": "UNKNOWN_RELATION",
            "method": "no_observed_or_attested_link_in_submitted_evidence",
            "certainty": "UNKNOWN",
        })

    unknown_evidence_ids = sorted(
        item["id"] for item in evidence if item.get("lineage_state") == "UNKNOWN"
    )
    charter = request.policy.model_dump(mode="json") if request.policy else None
    timestamp = datetime.now(timezone.utc).isoformat()
    report.update({
        "record_schema_version": RECORD_SCHEMA_VERSION,
        "engine_version": __version__,
        "analysis_timestamp": timestamp,
        "configuration_version": configuration_version(request),
        "model_versions": MODEL_VERSIONS,
        "stemma": {
            "threads": report.get("threads", []),
            "relationship_graph": relations,
            "disclaimer": "Only supplied or observed relations are represented; absent lineage stays unknown.",
        },
        "founts": founts,
        "strands": strands,
        "kin_relationships": kin,
        "fount_count": {
            "candidate_fount_references": len(founts),
            "evidence_without_resolved_fount_reference": sum(1 for item in evidence if evidence_to_fount[item["id"]] is None),
            "interpretation": "Locator/origin-reference count only; not a count of independent sources.",
        },
        "echo_mass": {
            "observed_or_attested_excess_appearances": echo_mass_count,
            "observed_or_attested_relationship_count": len(observed_edges),
            "possible_relationship_count": len(relations.get("possible_links", [])),
            "veiled_relationship_count": len(relations.get("unknown_relationship_pairs", [])),
            "method": "Extra evidence appearances in connected components formed only by observed or attested edges; possible and unknown links are excluded.",
        },
        "veiled": {
            "state": "UNKNOWN_NOT_ASSUMED_DEPENDENT",
            "evidence_ids": unknown_evidence_ids,
            "relationships": relations.get("unknown_relationship_pairs", []),
            "charter_action": (charter or {}).get("unknown_lineage_action", "no_charter_supplied"),
        },
        "charter": {
            "configuration": charter,
            "version": configuration_version(request),
            "source": "caller_supplied" if charter is not None else "none_supplied",
        },
        "standing": report.get("policy_result", {}).get("outcome", "NOT_CONFIGURED"),
        "decision": report.get("policy_result", {}),
    })
    return report


def build_saved_record(report: dict[str, Any], request: InspectRequest) -> dict[str, Any]:
    """Make the immutable snapshot persisted by explicit Save, never by Inspect."""
    record_id = "rec_" + uuid4().hex
    payload = {
        "record_id": record_id,
        "record_schema_version": report["record_schema_version"],
        "reliance_id": report["reliance_id"],
        "analysis_timestamp": report["analysis_timestamp"],
        "engine_version": report["engine_version"],
        "configuration_version": report["configuration_version"],
        "model_versions": report["model_versions"],
        "charter": report["charter"],
        "standing": report["standing"],
        "decision": report["decision"],
        "claim": report["claim"],
        "submitted_input": request.model_dump(mode="json"),
        "stemma": report["stemma"],
        "founts": report["founts"],
        "strands": report["strands"],
        "kin_relationships": report["kin_relationships"],
        "fount_count": report["fount_count"],
        "echo_mass": report["echo_mass"],
        "veiled": report["veiled"],
        "conflicts": report["conflicts"],
        "freshness": report["freshness"],
        "authority": report["authority"],
        "reliance_witness": report["witness"],
        "analysis": report,
    }
    payload["reliance_seal"] = create_seal(payload)
    return payload
