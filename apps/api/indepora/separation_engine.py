from collections import defaultdict
from typing import Any


class DisjointSet:
    def __init__(self, items: list[str]) -> None:
        self.parent = {item: item for item in items}

    def find(self, item: str) -> str:
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, left: str, right: str) -> None:
        a, b = self.find(left), self.find(right)
        if a != b:
            self.parent[max(a, b)] = min(a, b)


def analyze_relationships(items: list[dict[str, Any]], derivations: list[dict[str, Any]]) -> dict[str, Any]:
    ids = [item["id"] for item in items]
    by_id = {item["id"]: item for item in items}
    sets = DisjointSet(ids)
    edges: list[dict[str, Any]] = []
    exact_groups: dict[str, list[str]] = defaultdict(list)
    url_groups: dict[str, list[str]] = defaultdict(list)

    for item in items:
        if item.get("content_fingerprint"):
            exact_groups[item["content_fingerprint"]].append(item["id"])
        if item.get("canonical_url"):
            url_groups[item["canonical_url"]].append(item["id"])

    # Exact normalized-text matches are observable duplicates, not independent confirmations.
    for members in exact_groups.values():
        if len(members) > 1:
            for member in members[1:]:
                sets.union(members[0], member)
                edges.append({
                    "from": members[0], "to": member,
                    "type": "SAME_NORMALIZED_CONTENT", "basis": "exact_fingerprint",
                    "certainty": "OBSERVED",
                })

    # Direct supplied derivations are retained as attested relationships.
    for edge in derivations:
        sets.union(edge["from"], edge["to"])
        edges.append(edge)

    possible_links: list[dict[str, Any]] = []
    for members in url_groups.values():
        if len(members) > 1:
            for member in members[1:]:
                left_fp = by_id[members[0]].get("content_fingerprint")
                right_fp = by_id[member].get("content_fingerprint")
                if not left_fp or not right_fp or left_fp != right_fp:
                    possible_links.append({
                        "from": members[0], "to": member,
                        "type": "SAME_CANONICAL_URL", "basis": "url_normalization",
                        "certainty": "POSSIBLE",
                        "note": "The same locator may point to different versions; supplied content did not establish a match.",
                    })

    components: dict[str, list[str]] = defaultdict(list)
    for item_id in ids:
        components[sets.find(item_id)].append(item_id)
    groups = [
        {"id": f"grp_{index + 1:03d}", "members": members, "basis": "observed_or_attested_links"}
        for index, members in enumerate(sorted(components.values(), key=lambda group: min(group)))
    ]
    membership = {member: group["id"] for group in groups for member in group["members"]}

    known_pairs = {frozenset((edge["from"], edge["to"])) for edge in edges}
    possible_pairs = {frozenset((edge["from"], edge["to"])) for edge in possible_links}
    unknown_pairs: list[dict[str, str]] = []
    for index, left in enumerate(ids):
        for right in ids[index + 1:]:
            pair = frozenset((left, right))
            if pair not in known_pairs and pair not in possible_pairs:
                unknown_pairs.append({"left": left, "right": right, "state": "UNKNOWN"})

    for item in items:
        item["candidate_group_id"] = membership[item["id"]]
        component_size = len(components[sets.find(item["id"])])
        item["lineage_state"] = "OBSERVED_OR_ATTESTED" if component_size > 1 else "UNKNOWN"

    return {
        "edges": edges,
        "possible_links": possible_links,
        "candidate_groups": groups,
        "unknown_relationship_pairs": unknown_pairs,
        "independence_assessment": "NOT_ESTABLISHED",
        "disclaimer": "Different URLs or groups are not proof of independent evidence.",
    }
