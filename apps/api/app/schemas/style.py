from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from apps.api.app.schemas.render_spec import CaptionRenderSpec, StyleCategory


class StyleVersionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version: int
    created_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    checksum: Optional[str] = None


class StyleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    description: str = ""
    status: str = "PUBLISHED"  # DRAFT, PUBLISHED, ARCHIVED
    is_builtin: bool = False
    current_version: int = 1
    tags: List[str] = []
    thumbnail_css: Optional[Dict[str, str]] = None
    render_spec: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StyleDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    description: str = ""
    status: str = "PUBLISHED"
    is_builtin: bool = False
    current_version: int = 1
    python_code: str
    render_spec: Optional[Dict[str, Any]] = None
    versions: List[StyleVersionSummary] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StyleCreateRequest(BaseModel):
    id: str = Field(..., pattern="^[a-z0-9-]+$", min_length=2, max_length=64)
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(default="VIRAL_BOLD")
    description: Optional[str] = ""
    python_code: str = Field(..., min_length=10)


class StyleUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    python_code: Optional[str] = None
    status: Optional[str] = None


class StyleValidateRequest(BaseModel):
    python_code: str
    video_width: int = 1920
    video_height: int = 1080


class StyleValidateResponse(BaseModel):
    is_valid: bool
    error: Optional[str] = None
    render_spec: Optional[Dict[str, Any]] = None
    execution_time_ms: float = 0.0


class StylePreviewRequest(BaseModel):
    python_code: Optional[str] = None
    sample_text: Optional[str] = "The quick brown fox jumps over the lazy dog"
    video_width: int = 1920
    video_height: int = 1080
