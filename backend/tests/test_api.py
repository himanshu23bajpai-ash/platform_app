import os
import tempfile
import time

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(monkeypatch):
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp.name}")
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("AWS_MODE", "mock")
    monkeypatch.setenv("SIMULATE_FAIL_STEP", "")
    monkeypatch.setenv("ADMIN_EMAILS", "dev@local")
    monkeypatch.setenv("DEV_USER_EMAIL", "dev@local")
    monkeypatch.setenv("DEV_USER_NAME", "Local Dev")
    monkeypatch.setenv("DEV_USER_ROLE", "ADMIN")

    from app import config
    from app.services.aws import factory

    config.get_settings.cache_clear()
    factory.get_aws_provider.cache_clear()
    factory.get_secrets_provider.cache_clear()
    factory.get_cost_provider.cache_clear()

    from app import db as db_module

    new_engine = db_module.create_engine(
        f"sqlite:///{tmp.name}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    db_module.engine = new_engine
    db_module.SessionLocal = db_module.sessionmaker(
        bind=new_engine, autoflush=False, autocommit=False, future=True
    )

    from app.main import app

    with TestClient(app) as c:
        yield c

    os.unlink(tmp.name)


def _make_project(client, name="demo", **kwargs):
    payload = {"name": name, "compute_type": "ecs", **kwargs}
    r = client.post("/projects", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_dev_user_is_bootstrapped_as_admin(client):
    r = client.get("/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "dev@local"
    assert body["role"] == "ADMIN"


def test_create_project_creates_four_steps(client):
    pid = _make_project(client)["id"]
    r = client.get(f"/projects/{pid}/onboarding")
    assert r.status_code == 200
    steps = r.json()
    assert len(steps) == 4
    assert [s["step"] for s in steps] == [
        "REPO_REGISTRATION",
        "AWS_ACCOUNT_VPC",
        "CICD_PIPELINE",
        "COMPUTE_PROVISION",
    ]


def test_onboarding_completes(client):
    pid = _make_project(client, name="complete-flow", compute_type="lambda")["id"]
    deadline = time.time() + 20
    statuses: list[str] = []
    while time.time() < deadline:
        steps = client.get(f"/projects/{pid}/onboarding").json()
        statuses = [s["status"] for s in steps]
        if all(s == "SUCCESS" for s in statuses):
            break
        time.sleep(0.5)
    assert all(s == "SUCCESS" for s in statuses), statuses


def test_aws_endpoints_mock(client):
    pid = _make_project(client, name="infra-demo")["id"]
    for path in ("compute", "databases", "s3"):
        r = client.get(f"/projects/{pid}/aws/{path}")
        assert r.status_code == 200, path
        assert isinstance(r.json(), list)
        assert len(r.json()) > 0, path


def test_soft_delete_hides_project(client):
    pid = _make_project(client, name="to-delete")["id"]
    assert client.delete(f"/projects/{pid}").status_code == 204
    # default list excludes deleted
    assert pid not in [p["id"] for p in client.get("/projects").json()]
    # include_deleted=true shows it again (admin only)
    deleted = [p["id"] for p in client.get("/projects?include_deleted=true").json()]
    assert pid in deleted
    # fetching a deleted project returns 404 by default
    assert client.get(f"/projects/{pid}").status_code == 404
    # restore brings it back
    r = client.post(f"/projects/{pid}/restore")
    assert r.status_code == 200
    assert r.json()["deleted_at"] is None


def test_update_project_metadata(client):
    pid = _make_project(client, name="updatable")["id"]
    r = client.patch(f"/projects/{pid}", json={"description": "new desc", "compute_type": "eks"})
    assert r.status_code == 200
    body = r.json()
    assert body["description"] == "new desc"
    assert body["compute_type"] == "eks"


def test_user_crud_admin_only(client):
    # Create a viewer
    r = client.post(
        "/users",
        json={"email": "viewer1@acme.com", "name": "View Er", "role": "PROJECT_VIEWER"},
    )
    assert r.status_code == 201, r.text
    uid = r.json()["id"]
    assert r.json()["role"] == "PROJECT_VIEWER"

    # List
    r = client.get("/users")
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()]
    assert "viewer1@acme.com" in emails
    assert "dev@local" in emails

    # Update role
    r = client.patch(f"/users/{uid}", json={"role": "PROJECT_MANAGER"})
    assert r.status_code == 200
    assert r.json()["role"] == "PROJECT_MANAGER"

    # Self-demote is blocked
    me = client.get("/auth/me").json()
    r = client.patch(f"/users/{me['id']}", json={"role": "PROJECT_VIEWER"})
    assert r.status_code == 400

    # Delete the other user
    assert client.delete(f"/users/{uid}").status_code == 204
    assert client.get(f"/users/{uid}").status_code == 404


def test_rbac_viewer_cannot_create_or_see_unassigned(client):
    # admin creates a project and a viewer user
    pid = _make_project(client, name="restricted")["id"]
    r = client.post(
        "/users",
        json={"email": "viewer@acme.com", "role": "PROJECT_VIEWER"},
    )
    viewer_id = r.json()["id"]

    # impersonate the viewer via the DEV_USER_* override
    import importlib

    os.environ["DEV_USER_EMAIL"] = "viewer@acme.com"
    os.environ["DEV_USER_ROLE"] = "PROJECT_VIEWER"
    from app import config

    config.get_settings.cache_clear()

    # viewer cannot list-all (gets empty), cannot create, cannot see the project
    assert client.get("/projects").json() == []
    r = client.post("/projects", json={"name": "x", "compute_type": "ecs"})
    assert r.status_code == 403
    assert client.get(f"/projects/{pid}").status_code == 403
    assert client.get(f"/projects/{pid}/aws/compute").status_code == 403

    # Now assign the viewer to the project (need admin context)
    os.environ["DEV_USER_EMAIL"] = "dev@local"
    os.environ["DEV_USER_ROLE"] = "ADMIN"
    config.get_settings.cache_clear()
    r = client.post(f"/projects/{pid}/assignments", json={"user_id": viewer_id})
    assert r.status_code == 201

    # Back to viewer — can now see the project, but still no cost matrix
    os.environ["DEV_USER_EMAIL"] = "viewer@acme.com"
    os.environ["DEV_USER_ROLE"] = "PROJECT_VIEWER"
    config.get_settings.cache_clear()
    ids = [p["id"] for p in client.get("/projects").json()]
    assert pid in ids
    assert client.get(f"/projects/{pid}/aws/compute").status_code == 200
    assert client.get(f"/projects/{pid}/cost").status_code == 403
    assert client.get("/cost/matrix").status_code == 403

    # cleanup
    os.environ["DEV_USER_EMAIL"] = "dev@local"
    os.environ["DEV_USER_ROLE"] = "ADMIN"
    config.get_settings.cache_clear()


def test_secrets_lifecycle(client):
    pid = _make_project(client, name="secret-svc")["id"]
    # initially empty
    assert client.get(f"/projects/{pid}/secrets").json() == []
    # write
    r = client.put(
        f"/projects/{pid}/secrets/db_password",
        json={"value": "s3cret", "description": "db pw"},
    )
    assert r.status_code == 200
    # listed
    listed = client.get(f"/projects/{pid}/secrets").json()
    assert any(s["name"] == "db_password" for s in listed)
    # read back
    r = client.get(f"/projects/{pid}/secrets/db_password")
    assert r.status_code == 200
    assert r.json()["value"] == "s3cret"
    # update
    r = client.put(
        f"/projects/{pid}/secrets/db_password",
        json={"value": "rotated", "description": "rotated"},
    )
    assert r.status_code == 200
    assert client.get(f"/projects/{pid}/secrets/db_password").json()["value"] == "rotated"
    # delete
    assert client.delete(f"/projects/{pid}/secrets/db_password").status_code == 204
    assert client.get(f"/projects/{pid}/secrets/db_password").status_code == 404


def test_bearer_token_rejected_when_auth_required(monkeypatch):
    """With AUTH_DISABLED=false and Azure AD configured, an unsigned/garbage
    Bearer token must be rejected with 401."""
    import os
    import tempfile

    from fastapi.testclient import TestClient

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp.name}")
    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("AZURE_TENANT_ID", "fake-tenant")
    monkeypatch.setenv("AZURE_CLIENT_ID", "fake-client")
    monkeypatch.setenv("AWS_MODE", "mock")

    from app import config
    from app.services.aws import factory

    config.get_settings.cache_clear()
    factory.get_aws_provider.cache_clear()
    factory.get_secrets_provider.cache_clear()
    factory.get_cost_provider.cache_clear()

    from app import db as db_module

    new_engine = db_module.create_engine(
        f"sqlite:///{tmp.name}", connect_args={"check_same_thread": False}, future=True
    )
    db_module.engine = new_engine
    db_module.SessionLocal = db_module.sessionmaker(
        bind=new_engine, autoflush=False, autocommit=False, future=True
    )

    from app.main import app

    with TestClient(app) as c:
        # No token → 401
        assert c.get("/auth/me").status_code == 401
        # Malformed token → 401 (validator rejects)
        r = c.get("/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
        assert r.status_code == 401
        assert "Invalid token" in r.json()["detail"]

    os.unlink(tmp.name)


def test_lifecycle_field(client):
    p = _make_project(client, name="alpha-lifecycle", lifecycle="IN_DEVELOPMENT")
    assert p["lifecycle"] == "IN_DEVELOPMENT"
    r = client.patch(f"/projects/{p['id']}", json={"lifecycle": "ACTIVE"})
    assert r.status_code == 200
    assert r.json()["lifecycle"] == "ACTIVE"


def test_ai_overview(client):
    pid = _make_project(client, name="ai-svc")["id"]
    r = client.get(f"/projects/{pid}/ai")
    assert r.status_code == 200
    body = r.json()
    assert body["metrics"]["active_models"] >= 2
    assert body["metrics"]["predictions_today"] > 0
    assert len(body["models"]) == body["metrics"]["active_models"]
    assert len(body["jobs"]) == 3
    for m in body["models"]:
        assert m["status"] in {"deployed", "training", "retired"}
        assert 0 <= m["accuracy_pct"] <= 100


def test_activity_overview(client):
    pid = _make_project(client, name="activity-svc")["id"]
    r = client.get(f"/projects/{pid}/activity")
    assert r.status_code == 200
    body = r.json()
    assert body["metrics"]["active_users"] >= 200
    assert len(body["requests_24h"]) == 6  # 4-hour buckets
    assert len(body["deployments"]) == 4
    assert len(body["errors"]) == 4
    for err in body["errors"]:
        assert err["severity"] in {"high", "medium", "low"}


def test_cost_matrix_admin(client):
    pid1 = _make_project(client, name="cost-a")["id"]
    pid2 = _make_project(client, name="cost-b", compute_type="eks")["id"]

    matrix = client.get("/cost/matrix").json()
    ids = {r["project_id"]: r for r in matrix}
    assert pid1 in ids and pid2 in ids
    for row in matrix:
        assert row["current_month_usd"] > 0
        assert "trend_pct" in row

    detail = client.get(f"/projects/{pid1}/cost").json()
    assert detail["project_id"] == pid1
    assert len(detail["breakdown"]) > 0
    assert len(detail["last_6_months"]) == 6

    org = client.get("/cost/total").json()
    assert org["currency"] == "USD"
    assert org["project_count"] >= 2
