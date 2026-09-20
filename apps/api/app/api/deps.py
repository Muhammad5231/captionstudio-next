from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import User, Session as DbSession

security = HTTPBearer(auto_error=False)


def get_session_token(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """Extract session token from Bearer header or session_id cookie."""
    if creds and creds.credentials:
        return creds.credentials
    # Fallback to cookie
    return request.cookies.get("session_id") or request.headers.get("X-Session-Token")


def get_current_user(
    token: Optional[str] = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> User:
    """Retrieve and validate the active user corresponding to the session token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_session = (
        db.query(DbSession)
        .filter(DbSession.id == token)
        .first()
    )

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    # Handle both timezone-aware and naive datetime comparisons gracefully
    expires_at = db_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        db.delete(db_session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == db_session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated or unavailable.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last active timestamp
    user.last_active_at = now
    db.commit()

    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    """Require ADMIN or SUPER_ADMIN role."""
    if user.role not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrative privileges required.",
        )
    return user


def get_optional_user(
    token: Optional[str] = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Optionally resolve user if token is present and valid; otherwise None."""
    if not token:
        return None
    try:
        db_session = db.query(DbSession).filter(DbSession.id == token).first()
        if not db_session:
            return None
        now = datetime.now(timezone.utc)
        expires_at = db_session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return None
        user = db.query(User).filter(User.id == db_session.user_id).first()
        return user if (user and user.is_active) else None
    except Exception:
        return None

