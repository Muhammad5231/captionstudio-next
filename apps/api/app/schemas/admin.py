from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict


class AdminOverviewMetrics(BaseModel):
    total_users: int
    active_users: int
    total_projects: int
    total_exports: int
    total_jobs: int
    failed_jobs: int
    storage_used_bytes: int
    storage_used_mb: float
    storage_breakdown: Dict[str, float]  # MB per category


class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    project_count: int = 0
    export_count: int = 0


class AdminUserRoleUpdate(BaseModel):
    role: str  # USER, ADMIN


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


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
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str

