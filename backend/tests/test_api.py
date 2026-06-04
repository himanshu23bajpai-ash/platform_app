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

    # Reset cached settings + provider
    from app import config
    from app.services.aws import factory

    config.get_settings.cache_clear()
    factory.get_aws_provider.cache_clear()

    # Re-create engine pointing at the temp DB
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


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_create_project_creates_four_steps(client):
    r = client.post("/projects", json={"name": "demo", "compute_type": "ecs"})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

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
    r = client.post("/projects", json={"name": "complete-flow", "compute_type": "lambda"})
    pid = r.json()["id"]

    # Background tasks run after response; allow time for the 4 simulated steps.
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
    r = client.post("/projects", json={"name": "infra-demo", "compute_type": "ecs"})
    pid = r.json()["id"]

    for path in ("compute", "databases", "s3"):
        r = client.get(f"/projects/{pid}/aws/{path}")
        assert r.status_code == 200, path
        assert isinstance(r.json(), list)
        assert len(r.json()) > 0, path
