import uuid
import pytest
from starlette.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.database.session import SessionLocal, init_db
from apps.api.app.database.models import User, Project, Export

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_signup_validation():
    # 1. Invalid email
    res = client.post(
        "/api/v1/auth/signup",
        json={"name": "Test User", "email": "invalidemail", "password": "password123"},
    )
    assert res.status_code == 400
    data = res.json()
    msg = data.get("detail") or data.get("error", {}).get("message", "")
    assert "Invalid email" in msg

    # 2. Short password
    res = client.post(
        "/api/v1/auth/signup",
        json={"name": "Test User", "email": f"valid_{uuid.uuid4().hex[:6]}@example.com", "password": "123"},
    )
    assert res.status_code in [400, 422]
    data = res.json()
    msg = str(data)
    assert "at least 6" in msg or "String should have at least 6 characters" in msg


def test_signup_and_login_flow():
    uid = uuid.uuid4().hex[:6]
    test_email = f"creator_{uid}@example.com"
    test_pass = "securepass123"

    # 1. Signup
    res_signup = client.post(
        "/api/v1/auth/signup",
        json={"name": "Creator Test", "email": test_email, "password": test_pass},
    )
    assert res_signup.status_code == 201
    data = res_signup.json()
    assert "token" in data
    assert data["user"]["email"] == test_email
    assert data["user"]["role"] == "USER"
    token = data["token"]

    # 2. Duplicate signup rejected
    res_dup = client.post(
        "/api/v1/auth/signup",
        json={"name": "Creator Test", "email": test_email, "password": test_pass},
    )
    assert res_dup.status_code == 400
    data = res_dup.json()
    msg = data.get("detail") or data.get("error", {}).get("message", "")
    assert "already exists" in msg

    # 3. Login with wrong password
    res_bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "wrongpassword"},
    )
    assert res_bad_login.status_code == 401

    # 4. Login with correct password
    res_login = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": test_pass},
    )
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert "token" in login_data
    assert login_data["user"]["email"] == test_email

    # 5. GET /auth/me
    res_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_me.status_code == 200
    assert res_me.json()["email"] == test_email


def test_favorites_endpoints():
    uid = uuid.uuid4().hex[:6]
    test_email = f"fav_{uid}@example.com"
    res = client.post(
        "/api/v1/auth/signup",
        json={"name": "Fav User", "email": test_email, "password": "password123"},
    )
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add favorite
    res_add = client.post("/api/v1/auth/favorites", json={"template_id": "viral-hormozi"}, headers=headers)
    assert res_add.status_code == 200
    assert res_add.json()["template_id"] == "viral-hormozi"

    # List favorites
    res_list = client.get("/api/v1/auth/favorites", headers=headers)
    assert res_list.status_code == 200
    assert any(f["template_id"] == "viral-hormozi" for f in res_list.json())

    # Delete favorite
    res_del = client.delete("/api/v1/auth/favorites/viral-hormozi", headers=headers)
    assert res_del.status_code == 200


def test_admin_authorization_and_endpoints():
    # 1. Login as default seeded admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Login as regular user
    uid = uuid.uuid4().hex[:6]
    user_login = client.post(
        "/api/v1/auth/signup",
        json={"name": "Regular User", "email": f"reg_{uid}@example.com", "password": "password123"},
    )
    assert user_login.status_code == 201
    user_token = user_login.json()["token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 3. Regular user forbidden from admin overview
    res_forbidden = client.get("/api/v1/admin/overview", headers=user_headers)
    assert res_forbidden.status_code == 403

    # 4. Admin accesses overview
    res_admin = client.get("/api/v1/admin/overview", headers=admin_headers)
    assert res_admin.status_code == 200
    overview = res_admin.json()
    assert overview["total_users"] >= 2
    assert "storage_breakdown" in overview

    # 5. Admin lists users
    res_users = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res_users.status_code == 200
    assert len(res_users.json()) >= 2

    # 6. Admin system diagnostics
    res_sys = client.get("/api/v1/admin/system", headers=admin_headers)
    assert res_sys.status_code == 200
    sys_data = res_sys.json()
    assert sys_data["database_status"] == "Available"
    assert "python_version" in sys_data

    # 7. Admin storage cleanup
    res_clean = client.post("/api/v1/admin/storage/clean", headers=admin_headers)
    assert res_clean.status_code == 200
    assert "cleaned_files_count" in res_clean.json()


def test_project_isolation_and_actions():
    uid_a = uuid.uuid4().hex[:6]
    uid_b = uuid.uuid4().hex[:6]

    # User A
    user_a = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alice", "email": f"alice_{uid_a}@example.com", "password": "password123"},
    ).json()
    headers_a = {"Authorization": f"Bearer {user_a['token']}"}

    # User B
    user_b = client.post(
        "/api/v1/auth/signup",
        json={"name": "Bob", "email": f"bob_{uid_b}@example.com", "password": "password123"},
    ).json()
    headers_b = {"Authorization": f"Bearer {user_b['token']}"}

    # Alice creates a project
    p_alice = client.post(
        "/api/v1/projects",
        json={"name": "Alice Private Project", "source_type": "VIDEO"},
        headers=headers_a,
    ).json()

    # Bob lists projects -> should NOT include Alice's project
    b_projects = client.get("/api/v1/projects", headers=headers_b).json()
    assert not any(p["id"] == p_alice["id"] for p in b_projects)

    # Bob attempts direct access to Alice's project -> 403 Forbidden
    res_b_get = client.get(f"/api/v1/projects/{p_alice['id']}", headers=headers_b)
    assert res_b_get.status_code == 403

    # Alice duplicates project
    res_dup = client.post(f"/api/v1/projects/{p_alice['id']}/duplicate", headers=headers_a)
    assert res_dup.status_code == 200
    dup_data = res_dup.json()
    assert "Copy of Alice Private Project" == dup_data["name"]

    # Alice soft-deletes project
    res_del = client.delete(f"/api/v1/projects/{p_alice['id']}", headers=headers_a)
    assert res_del.status_code == 204

    # Project is hidden from normal list
    alice_list = client.get("/api/v1/projects", headers=headers_a).json()
    assert not any(p["id"] == p_alice["id"] for p in alice_list)

    # Alice restores project
    res_restore = client.post(f"/api/v1/projects/{p_alice['id']}/restore", headers=headers_a)
    assert res_restore.status_code == 200
    assert res_restore.json()["deleted_at"] is None
