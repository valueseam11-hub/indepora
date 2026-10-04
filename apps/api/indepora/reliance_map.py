from hashlib import sha256
from typing import Any


def build_reliance_map(claim: dict[str, str], evidence: list[dict[str, Any]], relations: dict[str, Any]) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = [{"id": claim["id"], "type": "CLAIM", "label": claim["text"]}]
    edges: list[dict[str, Any]] = []
    seen_origins: set[str] = set()

    for item in evidence:
        nodes.append({"id": item["id"], "type": "EVIDENCE", "label": item["title"]})
        edges.append({
            "from": item["id"], "to": claim["id"],
            "type": "SUPPORTS" if item.get("stance") == "supports" else (
                "CONTRADICTS" if item.get("stance") == "contradicts" else "STANCE_UNASSESSED"
            ),
            "basis": "user_supplied_stance",
        })
        origin = item.get("origin_key")
        if origin:
            # Stable pseudonymous node ID for deterministic records; not an anonymization claim.
            origin_id = "org_" + sha256(origin.encode("utf-8")).hexdigest()[:12]
            if origin_id not in seen_origins:
                nodes.append({"id": origin_id, "type": "ORIGIN_REFERENCE", "label": origin})
                seen_origins.add(origin_id)
            edges.append({"from": item["id"], "to": origin_id, "type": "LOCATED_AT", "basis": "source_metadata"})

    edges.extend(relations["edges"])
    edges.extend(relations["possible_links"])
    return {"nodes": nodes, "edges": edges}
