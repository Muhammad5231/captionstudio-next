from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from apps.api.app.schemas.caption import CaptionTrackResponse


class AssetResponse(BaseModel):
    id: str
    project_id: str
    type: str
    original_filename: str
    mime_type: str
    size: int
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_type: str = Field(..., pattern="^(VIDEO|SUBTITLE|VIDEO_WITH_SUBTITLE)$")
    language: Optional[str] = "en"


class ProjectResponse(BaseModel):
    id: str
    name: str
    status: str
    source_type: str
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    language: Optional[str] = "en"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assets: List[AssetResponse] = []
    caption_tracks: List[CaptionTrackResponse] = []

    class Config:
        from_attributes = True
