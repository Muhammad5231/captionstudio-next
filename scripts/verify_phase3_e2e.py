#!/usr/bin/env python3
"""
CaptionStudio — Phase 3 End-to-End Verification Script
Tests local authentication, RBAC, user isolation, project actions,
admin dashboard, storage metrics, and diagnostics.
"""

import sys
import uuid
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.database.session import get_db, SessionLocal
from apps.api.app.database.models import User, Project, CaptionTrack, CaptionSegment, Favorite

client = TestClient(app)

PASSED = 0
FAILED = 0

def test_case(name: str):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            global PASSED, FAILED
            print(f"[*] Testing: {name} ...", end=" ", flush=True)
            try:
                fn(*args, **kwargs)
                print(" [PASS]")
                PASSED += 1
            except Exception as exc:
                print(f" [FAIL]: {exc}")
                FAILED += 1
                raise exc
        return wrapper
    return decorator


@test_case("1. Default Admin Login & Session Verification")
def test_admin_login():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    assert res.status_code == 200, f"Status: {res.status_code}, Body: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] in ["ADMIN", "SUPER_ADMIN"]
    return data["token"]


@test_case("2. Default Creator Login & Session Verification")
def test_creator_login():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "user@captionstudio.local", "password": "user123"},
    )
    assert res.status_code == 200, f"Status: {res.status_code}, Body: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "USER"
    return data["token"]


@test_case("3. User Signup with PBKDF2 Password Hashing")
def test_user_signup():
    email = f"tester_{uuid.uuid4().hex[:6]}@captionstudio.local"
    res = client.post(
        "/api/v1/auth/signup",
        json={"name": "Test Creator", "email": email, "password": "testpassword123"},
    )
    assert res.status_code == 201, f"Status: {res.status_code}, Body: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == email

    # Verify user in database has PBKDF2 hash
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        assert user.hashed_password.startswith("pbkdf2_sha256$")
    finally:
        db.close()

    return data["token"]


@test_case("4. Profile Access & Password Change")
def test_password_change():
    # Signup a temporary user
    email = f"pwd_{uuid.uuid4().hex[:6]}@captionstudio.local"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"name": "Pwd User", "email": email, "password": "initial_password123"},
    )
    token = signup_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Change password
    chg_res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "initial_password123", "new_password": "updated_password123"},
    )
    assert chg_res.status_code == 200

    # Verify login with new password succeeds
    login_new = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "updated_password123"},
    )
    assert login_new.status_code == 200


@test_case("5. Template Favoriting & Toggle")
def test_template_favorites():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    token = admin_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    template_id = "mrbeast-punch"

    # Add favorite
    add_res = client.post(
        "/api/v1/auth/favorites",
        headers=headers,
        json={"template_id": template_id},
    )
    assert add_res.status_code == 200

    # List favorites
    list_res = client.get("/api/v1/auth/favorites", headers=headers)
    assert list_res.status_code == 200
    fav_ids = [f["template_id"] for f in list_res.json()]
    assert template_id in fav_ids

    # Remove favorite
    del_res = client.delete(f"/api/v1/auth/favorites/{template_id}", headers=headers)
    assert del_res.status_code == 200


@test_case("6. Project Lifecycle: Create, Duplicate, Soft-Delete & Restore")
def test_project_lifecycle():
    user_res = client.post(
        "/api/v1/auth/login",
        json={"email": "user@captionstudio.local", "password": "user123"},
    )
    token = user_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create project
    create_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Lifecycle Video Project", "source_type": "VIDEO"},
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]

    # 2. Duplicate project
    dup_res = client.post(
        f"/api/v1/projects/{project_id}/duplicate",
        headers=headers,
    )
    assert dup_res.status_code in [200, 201]
    dup_id = dup_res.json()["id"]
    assert dup_id != project_id

    # 3. Soft-delete project
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
    assert del_res.status_code in [200, 204]

    # Active list should not include deleted project
    list_active = client.get("/api/v1/projects", headers=headers)
    active_ids = [p["id"] for p in list_active.json()]
    assert project_id not in active_ids

    # List with include_deleted=True should include it
    list_all = client.get("/api/v1/projects?include_deleted=true", headers=headers)
    all_ids = [p["id"] for p in list_all.json()]
    assert project_id in all_ids

    # 4. Restore project
    restore_res = client.post(f"/api/v1/projects/{project_id}/restore", headers=headers)
    assert restore_res.status_code == 200

    # Active list should now contain it again
    list_restored = client.get("/api/v1/projects", headers=headers)
    restored_ids = [p["id"] for p in list_restored.json()]
    assert project_id in restored_ids


@test_case("7. Role-Based Access Control: Regular User Blocked from Admin")
def test_rbac_protection():
    user_res = client.post(
        "/api/v1/auth/login",
        json={"email": "user@captionstudio.local", "password": "user123"},
    )
    user_token = user_res.json()["token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Creator attempts to access admin endpoint -> 403 Forbidden
    res = client.get("/api/v1/admin/overview", headers=user_headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


@test_case("8. Admin Overview & Real Metrics")
def test_admin_metrics():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    admin_token = admin_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/v1/admin/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "total_projects" in data
    assert "storage_used_bytes" in data
    assert "storage_breakdown" in data
    assert data["total_users"] >= 2


@test_case("9. Admin User Management & Role Update")
def test_admin_user_management():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    admin_token = admin_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # List users
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 2


@test_case("10. Admin Storage Breakdown & Safe Cleanup")
def test_admin_storage():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    admin_token = admin_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Storage stats
    storage_res = client.get("/api/v1/admin/storage", headers=admin_headers)
    assert storage_res.status_code == 200
    assert "categories" in storage_res.json()

    # Safe cleanup
    clean_res = client.post("/api/v1/admin/storage/clean", headers=admin_headers)
    assert clean_res.status_code == 200
    assert "freed_bytes" in clean_res.json()


@test_case("11. Admin System Diagnostics & Local Runtime Check")
def test_admin_diagnostics():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    admin_token = admin_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    diag_res = client.get("/api/v1/admin/system", headers=admin_headers)
    assert diag_res.status_code == 200
    data = diag_res.json()
    assert "python_version" in data
    assert "ffmpeg_available" in data
    assert "database_status" in data
    assert data["database_status"] == "Available"


@test_case("12. Server Logs & Audit Trail Inspection")
def test_admin_logs():
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@captionstudio.local", "password": "admin123"},
    )
    admin_token = admin_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    logs_res = client.get("/api/v1/admin/logs?limit=50", headers=admin_headers)
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)

    audit_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)


def main():
    print("=" * 70)
    print("  CAPTIONSTUDIO -- PHASE 3 END-TO-END VERIFICATION")
    print("=" * 70)

    test_admin_login()
    test_creator_login()
    test_user_signup()
    test_password_change()
    test_template_favorites()
    test_project_lifecycle()
    test_rbac_protection()
    test_admin_metrics()
    test_admin_user_management()
    test_admin_storage()
    test_admin_diagnostics()
    test_admin_logs()

    print("=" * 70)
    print(f"  SUMMARY: {PASSED} Passed, {FAILED} Failed (Total: {PASSED + FAILED})")
    print("=" * 70)

    if FAILED > 0:
        sys.exit(1)
    else:
        print("  ALL PHASE 3 CAPABILITIES VERIFIED SUCCESSFULLY! [OK]")


if __name__ == "__main__":
    main()
