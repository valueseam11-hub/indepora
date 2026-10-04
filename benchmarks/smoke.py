import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from indepora.analysis_engine import inspect_reliance  # noqa: E402
from indepora.models import InspectRequest  # noqa: E402

fixture = json.loads((ROOT / "benchmarks" / "fixtures" / "reliance-v0.1.json").read_text())
report = inspect_reliance(InspectRequest(**fixture["request"]))
expected = fixture["expected_invariants"]
assert report["summary"]["independence_assessment"] == expected["independence_assessment"]
assert report["authority"]["state"] == expected["authority"]
assert len(report["conflicts"]) == expected["conflict_count"]
assert report["relationships"]["independence_assessment"] == "NOT_ESTABLISHED"

print(json.dumps({
    "fixture": fixture["fixture_id"],
    "evidence_appearances": report["summary"]["evidence_appearances"],
    "candidate_groups": report["summary"]["candidate_groups"],
    "observed_or_attested_links": report["summary"]["observed_or_attested_links"],
    "unknown_relationship_pairs": report["summary"]["unknown_relationship_pairs"],
    "conflicts": len(report["conflicts"]),
    "status": "PASS",
}, indent=2))
