import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.database.session import SessionLocal, init_db
from apps.api.app.database.models import AdminSession, Project


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


def test_admin_login_success_and_logout(client):
    # Test valid login
    res = client.post("/api/v1/admin/auth/login", json={"password": "admin123"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "token" in data
    token = data["token"]

    # Test /admin/auth/me with Bearer token
    res_me = client.get(
        "/api/v1/admin/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_me.status_code == 200
    assert res_me.json()["authenticated"] is True

    # Test admin overview access with session
    res_overview = client.get(
        "/api/v1/admin/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_overview.status_code == 200
    assert "total_projects" in res_overview.json()

    # Test logout
    res_logout = client.post(
        "/api/v1/admin/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_logout.status_code == 200

    # Verify session is revoked
    res_me_revoked = client.get(
        "/api/v1/admin/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_me_revoked.status_code == 401


def test_admin_login_invalid_password(client):
    res = client.post("/api/v1/admin/auth/login", json={"password": "wrongpassword"})
    assert res.status_code == 401


def test_admin_routes_require_authentication(client):
    # Attempting to access admin routes without credentials
    res = client.get("/api/v1/admin/overview")
    assert res.status_code == 401

    res = client.get("/api/v1/admin/jobs")
    assert res.status_code == 401

    res = client.get("/api/v1/admin/system")
    assert res.status_code == 401


def test_public_projects_require_zero_authentication(client):
    # Project creation works for public anonymous users
    res = client.post(
        "/api/v1/projects",
        json={"name": "Zero Auth Project", "source_type": "VIDEO"},
    )
    assert res.status_code == 201
    proj_id = res.json()["id"]

    # Project listing works anonymously
    res_list = client.get("/api/v1/projects")
    assert res_list.status_code == 200
    proj_ids = [p["id"] for p in res_list.json()]
    assert proj_id in proj_ids

    # Cleanup
    client.delete(f"/api/v1/projects/{proj_id}?permanent=true")
