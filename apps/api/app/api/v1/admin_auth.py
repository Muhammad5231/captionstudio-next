from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import AdminSession
from apps.api.app.schemas.admin import AdminLoginRequest, AdminAuthResponse
from apps.api.app.core.config import settings
from apps.api.app.core.security import verify_password, generate_session_token, get_password_hash
from apps.api.app.api.deps import require_admin, get_admin_session
from apps.api.app.core.logging import logger

router = APIRouter(prefix="/admin/auth", tags=["Admin Authentication"])

# Fallback hash for "admin123" if ADMIN_PASSWORD_HASH is not set in .env
DEFAULT_DEV_HASH = "pbkdf2_sha256$100000$67313835613364636637373834373461$da085b3068e36780c74f56f4d546aa862024db21d00c735d4ff3a69a9b8f2c96"


@router.post("/login", response_model=AdminAuthResponse)
def admin_login(
    payload: AdminLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Authenticate administrator using configured PBKDF2 password hash."""
    expected_hash = settings.ADMIN_PASSWORD_HASH or DEFAULT_DEV_HASH

    # Check password
    is_valid = verify_password(payload.password, expected_hash)
    if not is_valid:
        # Also allow plain match for admin123 in dev mode if hash wasn't matched
        if settings.APP_ENV == "development" and payload.password == "admin123":
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative password.",
        )

    # Generate session token and expiration
    token = generate_session_token()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=settings.ADMIN_SESSION_HOURS)

    admin_session = AdminSession(
        id=token,
        created_at=now,
        expires_at=expires_at,
    )
    db.add(admin_session)
    db.commit()

    # Set HTTP-only session cookie
    response.set_cookie(
        key="admin_session",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Local development friendly
        max_age=settings.ADMIN_SESSION_HOURS * 3600,
    )

    logger.info("Admin session created successfully (expires: %s)", expires_at)
    return AdminAuthResponse(token=token, expires_at=expires_at)


@router.post("/logout", status_code=status.HTTP_200_OK)
def admin_logout(
    response: Response,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Revoke active administrative session token."""
    db.delete(session)
    db.commit()

    response.delete_cookie(key="admin_session")
    return {"message": "Admin session revoked successfully."}


@router.get("/me")
def admin_me(session: AdminSession = Depends(require_admin)):
    """Check administrative session status."""
    return {
        "authenticated": True,
        "role": "ADMIN",
        "session_id": session.id,
        "expires_at": session.expires_at,
    }
