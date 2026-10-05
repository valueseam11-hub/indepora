from __future__ import annotations

import logging

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

import indepora.main as main_module
from indepora.db import Base
from indepora.main import create_app
from indepora.origin_mesh import canonicalize_url
from indepora.seal_engine import create_seal

BOOTSTRAP_SECRET = "test-bootstrap-secret-0123456789abcdef"
OWNER_EMAIL = "owner@example.test"
OWNER_PASSWORD = "test-password-that-is-long-enough-123"


@pytest.fixture
def authed():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    app = create_app(engine=engine, bootstrap_secret=BOOTSTRAP_SECRET, secure_cookies=False, static_dir="/nonexistent")
    with TestClient(app) as client:
        csrf = client.get("/v1/auth/csrf").json()["csrf_token"]
        boot = client.post(
            "/v1/auth/bootstrap",
            headers={"X-CSRF-Token": csrf},
            json={"bootstrap_secret": BOOTSTRAP_SECRET, "email": OWNER_EMAIL, "password": OWNER_PASSWORD},
        )
        assert boot.status_code == 200, boot.text
        yield client, boot.json()["csrf_token"]
    engine.dispose()


def example_payload(**extra):
    payload = {
        "claim": "A regulator issued a fine.",
        "evidence": [
            {"id": "a", "title": "Original", "url": "https://a.example/report", "text": "Regulator issued a fine."},
            {"id": "b", "title": "Copy", "url": "https://b.example/copy", "text": "Regulator issued a fine."},
        ],
    }
    payload.update(extra)
    return payload


def test_private_routes_require_owner_authentication():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    app = create_app(engine=engine, bootstrap_secret=BOOTSTRAP_SECRET, secure_cookies=False, static_dir="/nonexistent")
    with TestClient(app) as client:
        assert client.post("/v1/reliance/inspect", json=example_payload()).status_code == 401
        public = client.post("/v1/stemcheck", json=example_payload())
        assert public.status_code == 200
        assert public.json()["summary"]["evidence_appearances"] == 2
        assert client.get("/v1/records").status_code == 401
        assert client.get("/v1/auth/bootstrap/status").json() == {"owner_setup_required": True}
        assert client.get("/v1/auth/me").status_code == 401
    engine.dispose()


def test_bootstrap_is_one_time_and_there_is_no_public_signup(authed):
    client, csrf = authed
    response = client.post(
        "/v1/auth/bootstrap",
        headers={"X-CSRF-Token": csrf},
        json={"bootstrap_secret": BOOTSTRAP_SECRET, "email": "second@example.test", "password": OWNER_PASSWORD},
    )
    assert response.status_code == 409
    assert client.post("/v1/auth/register", json={"email": "x@example.test"}).status_code == 404
    assert client.get("/v1/auth/bootstrap/status").json() == {"owner_setup_required": False}


def test_csrf_is_required_for_explicit_save(authed):
    client, _ = authed
    response = client.post("/v1/records", json=example_payload())
    assert response.status_code == 403
    assert client.get("/v1/records").json()["items"] == []


def test_exact_duplicate_content_is_observed_but_not_independence(authed):
    client, _ = authed
    response = client.post("/v1/reliance/inspect", json=example_payload())
    assert response.status_code == 200
    report = response.json()
    assert report["summary"]["candidate_groups"] == 1
    assert report["summary"]["observed_or_attested_links"] == 1
    assert report["summary"]["independence_assessment"] == "NOT_ESTABLISHED"
    assert report["echo_mass"]["observed_or_attested_excess_appearances"] == 1
    assert report["engine_version"] == "0.2.0"


def test_different_urls_remain_unknown_and_charter_controls_standing(authed):
    client, _ = authed
    response = client.post("/v1/reliance/inspect", json={
        "claim": "The event occurred.",
        "evidence": [
            {"id": "a", "title": "Source A", "url": "https://a.example/one", "text": "A report."},
            {"id": "b", "title": "Source B", "url": "https://b.example/two", "text": "Another report."},
        ],
        "policy": {"unknown_lineage_action": "allow", "require_conflict_review": False},
    })
    report = response.json()
    assert report["summary"]["candidate_groups"] == 2
    assert report["summary"]["unknown_relationship_pairs"] == 1
    assert report["relationships"]["independence_assessment"] == "NOT_ESTABLISHED"
    assert report["veiled"]["state"] == "UNKNOWN_NOT_ASSUMED_DEPENDENT"
    assert report["veiled"]["relationships"] == [{"left": "a", "right": "b", "state": "UNKNOWN"}]
    assert report["standing"] == "ALLOW"
    assert report["kin_relationships"][-1]["certainty"] == "UNKNOWN"


def test_attested_derivation_creates_stemma_strand_and_kin_method(authed):
    client, _ = authed
    response = client.post("/v1/reliance/inspect", json={
        "claim": "A fine was issued.",
        "evidence": [
            {"id": "origin", "title": "Primary", "url": "https://regulator.example/a", "text": "Primary statement."},
            {"id": "copy", "title": "Secondary", "url": "https://news.example/b", "text": "Secondary report.", "derived_from": ["origin"]},
        ],
    })
    report = response.json()
    assert report["summary"]["candidate_groups"] == 1
    assert report["stemma"]["threads"][0]["certainty"] == "ATTESTED"
    assert report["strands"][1]["derived_from"] == ["origin"]
    assert report["kin_relationships"][0]["method"] == "user_attested_input"
    assert report["fount_count"]["candidate_fount_references"] == 2


def test_user_labeled_conflict_is_visible_and_escalates(authed):
    client, _ = authed
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
    assert report["standing"] == "ESCALATE"
    assert report["decision"]["outcome"] == "ESCALATE"


def test_inspection_is_transient_and_save_persists_only_on_explicit_post(authed, monkeypatch):
    client, csrf = authed
    source = example_payload()
    inspected = client.post("/v1/reliance/inspect", json=source)
    assert inspected.status_code == 200
    assert client.get("/v1/records").json()["items"] == []

    saved = client.post("/v1/records", headers={"X-CSRF-Token": csrf}, json=source)
    assert saved.status_code == 201, saved.text
    record = saved.json()
    record_id = record["record_id"]
    assert record["submitted_input"]["evidence"][0]["text"] == "Regulator issued a fine."
    assert record["analysis"]["evidence"][0]["text"] == "Regulator issued a fine."
    assert record["standing"] == "NOT_CONFIGURED"
    assert record["record_schema_version"] == "indepora-reliance-record/v1"
    assert record["model_versions"]["external_llm"] is None
    assert record["reliance_seal"]["algorithm"] == "sha256"
    assert len(record["reliance_seal"]["digest"]) == 64

    # Retrieval is the stored snapshot and does not invoke the current engine.
    def forbidden_recompute(_request):
        raise AssertionError("historical records must not be recomputed")

    monkeypatch.setattr(main_module, "inspect_reliance", forbidden_recompute)
    retrieved = client.get(f"/v1/records/{record_id}")
    assert retrieved.status_code == 200
    assert retrieved.json()["standing"] == record["standing"]
    assert retrieved.json()["engine_version"] == record["engine_version"]
    listed = client.get("/v1/records").json()["items"]
    assert len(listed) == 1
    assert listed[0]["record_id"] == record_id


def test_public_stemcheck_is_transient_and_does_not_log_claim_or_evidence(authed, caplog):
    client, _ = authed
    secret_text = "PUBLIC-TRANSIENT-CLAIM-DO-NOT-LOG-67021"
    payload = {
        "claim": secret_text,
        "evidence": [
            {"id": "private", "title": "Sensitive citation", "url": "https://private.example/ref", "text": secret_text}
        ],
    }
    caplog.set_level(logging.INFO, logger="indepora.request")
    response = client.post("/v1/stemcheck", json=payload)
    assert response.status_code == 200
    assert response.json()["claim"]["text"] == secret_text
    assert secret_text not in caplog.text
    assert client.get("/v1/records").json()["items"] == []


def test_public_stemcheck_rate_limit_is_bounded_and_does_not_reveal_client_data(authed):
    client, _ = authed
    client.app.state.stemcheck_rate_limit = 1
    first = client.post("/v1/stemcheck", json=example_payload())
    second = client.post("/v1/stemcheck", json=example_payload())
    assert first.status_code == 200
    assert second.status_code == 429
    assert second.headers.get("retry-after")
    assert "127.0.0.1" not in second.text


def test_records_are_owner_scoped_and_delete_is_explicit(authed):
    client, csrf = authed
    saved = client.post("/v1/records", headers={"X-CSRF-Token": csrf}, json=example_payload())
    record_id = saved.json()["record_id"]
    assert client.get("/v1/records/not-a-record").status_code == 404
    deleted = client.delete(f"/v1/records/{record_id}", headers={"X-CSRF-Token": csrf})
    assert deleted.status_code == 204
    assert client.get(f"/v1/records/{record_id}").status_code == 404


def test_csrf_rejects_missing_token_and_cross_origin(authed):
    client, csrf = authed
    missing = client.post("/v1/records", json=example_payload())
    assert missing.status_code == 403
    foreign = client.post(
        "/v1/records",
        headers={"X-CSRF-Token": csrf, "Origin": "https://attacker.example"},
        json=example_payload(),
    )
    assert foreign.status_code == 403
    local_dev = client.post(
        "/v1/records",
        headers={
            "X-CSRF-Token": csrf,
            "Origin": "http://localhost:3000",
            "Host": "localhost:8000",
        },
        json=example_payload(),
    )
    assert local_dev.status_code == 201


def test_password_change_rotates_sessions(authed):
    client, csrf = authed
    new_password = "a-new-password-that-is-also-long-123"
    changed = client.post(
        "/v1/auth/password",
        headers={"X-CSRF-Token": csrf},
        json={"current_password": OWNER_PASSWORD, "new_password": new_password},
    )
    assert changed.status_code == 200
    assert client.get("/v1/auth/me").status_code == 200
    rotated_csrf = changed.json()["csrf_token"]
    assert client.post("/v1/auth/logout", headers={"X-CSRF-Token": rotated_csrf}).status_code == 204

    csrf = client.get("/v1/auth/csrf").json()["csrf_token"]
    wrong = client.post("/v1/auth/login", headers={"X-CSRF-Token": csrf}, json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD})
    assert wrong.status_code == 401
    csrf = client.get("/v1/auth/csrf").json()["csrf_token"]
    correct = client.post("/v1/auth/login", headers={"X-CSRF-Token": csrf}, json={"email": OWNER_EMAIL, "password": new_password})
    assert correct.status_code == 200
    assert client.get("/v1/auth/me").status_code == 200


def test_validation_errors_and_logs_do_not_echo_submitted_text(authed, caplog):
    client, _ = authed
    secret_text = "CONFIDENTIAL-CLAIM-DO-NOT-LOG-91827"
    caplog.set_level(logging.INFO, logger="indepora.request")
    response = client.post("/v1/reliance/inspect", json={
        "claim": secret_text * 200,
        "evidence": [{"id": "one", "title": "one", "url": "https://example.test", "text": secret_text}],
    })
    assert response.status_code == 422
    assert secret_text not in response.text
    assert secret_text not in caplog.text
    assert "request_id=" in caplog.text
    assert "duration_ms=" in caplog.text


def test_url_normalization_removes_tracking_and_sensitive_values():
    assert canonicalize_url("HTTPS://Example.org/story/?utm_source=x&id=7#part") == "https://example.org/story?id=7"
    assert canonicalize_url("https://alice:secret@example.org/story?token=abc&id=7") == "https://example.org/story?id=7"


def test_seal_is_deterministic_and_warns_about_scope():
    payload = {"b": 2, "a": 1}
    assert create_seal(payload)["digest"] == create_seal({"a": 1, "b": 2})["digest"]
    assert "does not prove" in create_seal(payload)["warning"]


def test_reliance_id_changes_when_evidence_set_changes(authed):
    client, _ = authed
    base = {"claim": "Same claim", "evidence": [{"id": "a", "title": "A", "url": "https://a.example"}]}
    changed = {"claim": "Same claim", "evidence": [{"id": "b", "title": "B", "url": "https://b.example"}]}
    first = client.post("/v1/reliance/inspect", json=base).json()["reliance_id"]
    second = client.post("/v1/reliance/inspect", json=changed).json()["reliance_id"]
    assert first != second
