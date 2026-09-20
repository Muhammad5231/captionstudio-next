from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserSignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None


class SessionResponse(BaseModel):
    token: str
    expires_at: datetime
    user: UserResponse


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)


class FavoriteCreate(BaseModel):
    template_id: str


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    template_id: str
    created_at: Optional[datetime] = None

