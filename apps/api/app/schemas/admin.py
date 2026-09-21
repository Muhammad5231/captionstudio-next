from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict


class AdminLoginRequest(BaseModel):
    password: str


class AdminAuthResponse(BaseModel):
    token: str
    expires_at: datetime


class AdminOverviewMetrics(BaseModel):
    total_projects: int
    total_exports: int
    total_jobs: int
    failed_jobs: int
    total_styles: int
    storage_used_bytes: int
    storage_used_mb: float
    storage_breakdown: Dict[str, float]  # MB per category


class StorageCleanupResult(BaseModel):
    cleaned_files_count: int
    freed_bytes: int
    freed_mb: float
    message: str


class SystemDiagnosticsResponse(BaseModel):
    python_version: str
    fastapi_version: str
    ffmpeg_available: bool
    ffprobe_available: bool
    whisper_available: bool
    database_status: str
    storage_path: str
    disk_total_gb: float
    disk_free_gb: float
    disk_used_percent: float


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor: Optional[str] = "admin"
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class ExportAnalyticsResponse(BaseModel):
    total_exports: int
    completed_exports: int
    failed_exports: int
    queued_processing_exports: int
    success_rate_percent: float
    total_render_duration_seconds: float
    total_source_duration_seconds: float
    average_render_time_seconds: float
    total_exported_bytes: int
    total_exported_mb: float
    styles_breakdown: List[Dict[str, Any]]
    encoders_breakdown: List[Dict[str, Any]]
    formats_breakdown: List[Dict[str, Any]]
