from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict
from apps.api.app.schemas.render_spec import CaptionRenderSpec


class ExportFormat(str, Enum):
    MP4 = "MP4"
    SRT = "SRT"
    VTT = "VTT"
    ASS = "ASS"
    JSON = "JSON"


class ExportRequest(BaseModel):
    format: ExportFormat = ExportFormat.MP4
    track_id: Optional[str] = None
    render_spec: Optional[CaptionRenderSpec] = None
    crf: int = 20  # Constant Rate Factor (18-28)
    preset: str = "veryfast"


class ExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    job_id: Optional[str] = None
    format: str
    status: str
    storage_key: Optional[str] = None
    file_size: Optional[int] = None
    filename: Optional[str] = None
    source_filename: Optional[str] = None
    source_duration: Optional[float] = None
    source_width: Optional[int] = None
    source_height: Optional[int] = None
    source_fps: Optional[float] = None
    output_filename: Optional[str] = None
    output_duration: Optional[float] = None
    output_width: Optional[int] = None
    output_height: Optional[int] = None
    output_fps: Optional[float] = None
    output_size: Optional[int] = None
    style_id: Optional[str] = None
    style_name: Optional[str] = None
    style_version: Optional[int] = None
    caption_language: Optional[str] = None
    encoder: Optional[str] = None
    quality_preset: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

