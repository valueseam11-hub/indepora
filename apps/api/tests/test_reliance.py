from fastapi.testclient import TestClient

from indepora.main import app
from indepora.origin_mesh import canonicalize_url
from indepora.seal_engine import create_seal

client = TestClient(app)


def test_exact_duplicate_content_is_observed_but_not_independence():
    response = client.post("/v1/reliance/inspect", json={
        "claim": "A regulator issued a fine.",
        "evidence": [
            {"id": "a", "title": "Original", "url": "https://a.example/report", "text": "Regulator issued a fine."},
            {"id": "b", "title": "Copy", "url": "https://b.example/copy", "text": "Regulator issued a fine."},
        ],
    })
    assert response.status_code == 200
    report = response.json()
    assert report["summary"]["candidate_groups"] == 1
    assert report["summary"]["observed_or_attested_links"] == 1
    assert report["summary"]["independence_assessment"] == "NOT_ESTABLISHED"


def test_different_urls_are_unknown_not_independent():
    response = client.post("/v1/reliance/inspect", json={
        "claim": "The event occurred.",
        "evidence": [
            {"id": "a", "title": "Source A", "url": "https://a.example/one", "text": "A report."},
            {"id": "b", "title": "Source B", "url": "https://b.example/two", "text": "Another report."},
        ],
    })
    report = response.json()
    assert report["summary"]["candidate_groups"] == 2
    assert report["summary"]["unknown_relationship_pairs"] == 1
    assert report["relationships"]["independence_assessment"] == "NOT_ESTABLISHED"


def test_attested_derivation_creates_thread_and_candidate_group():
    response = client.post("/v1/reliance/inspect", json={
        "claim": "A fine was issued.",
        "evidence": [
            {"id": "origin", "title": "Primary", "url": "https://regulator.example/a", "text": "Primary statement."},
            {"id": "copy", "title": "Secondary", "url": "https://news.example/b", "text": "Secondary report.", "derived_from": ["origin"]},
        ],
    })
    report = response.json()
    assert report["summary"]["candidate_groups"] == 1
    assert report["threads"][0]["certainty"] == "ATTESTED"
    assert report["relationships"]["edges"][0]["type"] == "DERIVED_FROM"


def test_user_labeled_conflict_is_visible_and_can_escalate():
    response = client.post("/v1/reliance/inspect", json={
        "claim": "The policy is active.",
        "evidence": [
            {"id": "yes", "title": "Affirmative", "url": "https://a.example", "stance": "supports"},
            {"id": "no", "title": "Contrary", "url": "https://b.example", "stance": "contradicts"},
        ],
        "policy": {"minimum_documents": 1, "require_conflict_review": True},
    })
    report = response.json()
    assert len(report["conflicts"]) == 1
    assert report["policy_result"]["outcome"] == "ESCALATE"


def test_url_normalization_removes_tracking_but_preserves_content_query():
    assert canonicalize_url("HTTPS://Example.org/story/?utm_source=x&id=7#part") == "https://example.org/story?id=7"


def test_url_normalization_removes_userinfo_and_sensitive_query_values():
    assert canonicalize_url("https://alice:secret@example.org/story?token=abc&id=7") == "https://example.org/story?id=7"


def test_seal_is_deterministic_and_warns_about_scope():
    payload = {"b": 2, "a": 1}
    assert create_seal(payload)["digest"] == create_seal({"a": 1, "b": 2})["digest"]
    assert "does not prove" in create_seal(payload)["warning"]


def test_reliance_id_changes_when_the_evidence_set_changes():
    base = {"claim": "Same claim", "evidence": [{"id": "a", "title": "A", "url": "https://a.example"}]}
    changed = {"claim": "Same claim", "evidence": [{"id": "b", "title": "B", "url": "https://b.example"}]}
    first = client.post("/v1/reliance/inspect", json=base).json()["reliance_id"]
    second = client.post("/v1/reliance/inspect", json=changed).json()["reliance_id"]
    assert first != second
