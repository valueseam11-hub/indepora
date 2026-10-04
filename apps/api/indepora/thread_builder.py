from typing import Any


def build_threads(evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ids = {item["id"] for item in evidence}
    edges: list[dict[str, Any]] = []
    for item in evidence:
        for parent_id in item.get("derived_from", []):
            if parent_id in ids and parent_id != item["id"]:
                edges.append(
                    {
                        "from": parent_id,
                        "to": item["id"],
                        "type": "DERIVED_FROM",
                        "basis": "user_attested_input",
                        "certainty": "ATTESTED",
                    }
                )
    return edges
