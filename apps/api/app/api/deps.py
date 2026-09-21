from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import AdminSession

security = HTTPBearer(auto_error=False)


def get_admin_token(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """Extract admin session token from Bearer header, X-Admin-Token, or cookie."""
    if creds and creds.credentials:
        return creds.credentials
    # Fallback to header or cookie
    return (
        request.headers.get("X-Admin-Token")
        or request.cookies.get("admin_session")
        or request.cookies.get("session_id")
    )


def get_admin_session(
    token: Optional[str] = Depends(get_admin_token),
    db: Session = Depends(get_db),
) -> Optional[AdminSession]:
    """Retrieve and validate the active admin session."""
    if not token:
        return None

    db_session = (
        db.query(AdminSession)
        .filter(AdminSession.id == token)
        .first()
    )

    if not db_session:
        return None

    now = datetime.now(timezone.utc)
    expires_at = db_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        db.delete(db_session)
        db.commit()
        return None

    return db_session


def require_admin(
    session: Optional[AdminSession] = Depends(get_admin_session),
) -> AdminSession:
    """Dependency that strictly requires an authenticated admin session."""
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return session
