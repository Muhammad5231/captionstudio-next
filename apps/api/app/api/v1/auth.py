import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from apps.api.app.database.session import get_db
from apps.api.app.database.models import User, Session as DbSession, Favorite
from apps.api.app.core.security import get_password_hash, verify_password, generate_session_token
from apps.api.app.schemas.auth import (
    UserSignUpRequest,
    UserLoginRequest,
    UserResponse,
    SessionResponse,
    PasswordChangeRequest,
    UserProfileUpdateRequest,
    FavoriteCreate,
    FavoriteResponse,
)
from apps.api.app.api.deps import get_current_user, get_session_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
SESSION_DURATION_DAYS = 30


@router.post("/signup", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignUpRequest, response: Response, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format.",
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        username=clean_email.split("@")[0],
        name=payload.name.strip(),
        email=clean_email,
        hashed_password=get_password_hash(payload.password),
        role="USER",
        is_active=True,
    )
    db.add(user)
    db.flush()

    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    session_record = DbSession(
        id=token,
        user_id=user.id,
        expires_at=expires_at,
    )
    db.add(session_record)
    db.commit()
    db.refresh(user)

    response.set_cookie(
        key="session_id",
        value=token,
        httponly=True,
        max_age=SESSION_DURATION_DAYS * 86400,
        samesite="lax",
    )

    return SessionResponse(
        token=token,
        expires_at=expires_at,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=SessionResponse)
def login(payload: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    session_record = DbSession(
        id=token,
        user_id=user.id,
        expires_at=expires_at,
    )
    db.add(session_record)

    user.last_active_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    response.set_cookie(
        key="session_id",
        value=token,
        httponly=True,
        max_age=SESSION_DURATION_DAYS * 86400,
        samesite="lax",
    )

    return SessionResponse(
        token=token,
        expires_at=expires_at,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(
    response: Response,
    token: str = Depends(get_session_token),
    db: Session = Depends(get_db),
):
    if token:
        db.query(DbSession).filter(DbSession.id == token).delete()
        db.commit()

    response.delete_cookie("session_id")
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name:
        user.name = payload.name.strip()
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long.",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/favorites", response_model=List[FavoriteResponse])
def get_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favs = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return [FavoriteResponse.model_validate(f) for f in favs]


@router.post("/favorites", response_model=FavoriteResponse)
def add_favorite(
    payload: FavoriteCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.template_id == payload.template_id)
        .first()
    )
    if existing:
        return FavoriteResponse.model_validate(existing)

    fav = Favorite(
        id=str(uuid.uuid4()),
        user_id=user.id,
        template_id=payload.template_id,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return FavoriteResponse.model_validate(fav)


@router.delete("/favorites/{template_id}")
def remove_favorite(
    template_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Favorite).filter(
        Favorite.user_id == user.id, Favorite.template_id == template_id
    ).delete()
    db.commit()
    return {"message": "Favorite removed."}

