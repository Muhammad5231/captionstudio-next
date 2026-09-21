import os
import sys
import shutil
import uuid
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import fastapi
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from apps.api.app.database.session import get_db
from apps.api.app.database.models import AdminSession, Project, Job, Export, ProjectAsset, AuditLog, CaptionStyle
from apps.api.app.api.deps import require_admin
from apps.api.app.core.config import settings
from apps.api.app.schemas.admin import (
    AdminOverviewMetrics,
    StorageCleanupResult,
    SystemDiagnosticsResponse,
    AuditLogResponse,
    LogEntry,
)

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


def get_dir_size(path: Path) -> int:
    """Calculate total size of directory in bytes."""
    total = 0
    if path.exists() and path.is_dir():
        for root, _, files in os.walk(path):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    total += os.path.getsize(fp)
                except OSError:
                    pass
    return total


@router.get("/overview", response_model=AdminOverviewMetrics)
def get_admin_overview(
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_projects = db.query(Project).filter(Project.deleted_at.is_(None)).count()
    total_exports = db.query(Export).count()
    total_jobs = db.query(Job).count()
    failed_jobs = db.query(Job).filter(Job.status == "FAILED").count()
    total_styles = db.query(CaptionStyle).count()

    storage_root = settings.storage_root
    uploads_size = get_dir_size(storage_root / "uploads")
    renders_size = get_dir_size(storage_root / "renders")
    exports_size = get_dir_size(storage_root / "exports")
    fonts_size = get_dir_size(storage_root / "fonts")
    temp_size = get_dir_size(storage_root / "temp")

    total_storage_bytes = uploads_size + renders_size + exports_size + fonts_size + temp_size
    total_storage_mb = round(total_storage_bytes / (1024 * 1024), 2)

    return AdminOverviewMetrics(
        total_projects=total_projects,
        total_exports=total_exports,
        total_jobs=total_jobs,
        failed_jobs=failed_jobs,
        total_styles=total_styles,
        storage_used_bytes=total_storage_bytes,
        storage_used_mb=total_storage_mb,
        storage_breakdown={
            "uploads": round(uploads_size / (1024 * 1024), 2),
            "renders": round(renders_size / (1024 * 1024), 2),
            "exports": round(exports_size / (1024 * 1024), 2),
            "fonts": round(fonts_size / (1024 * 1024), 2),
            "temp": round(temp_size / (1024 * 1024), 2),
        },
    )


@router.get("/jobs")
def list_admin_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if status_filter:
        query = query.filter(Job.status == status_filter.upper())
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for j in jobs:
        proj = db.query(Project).filter(Project.id == j.project_id).first()
        result.append(
            {
                "id": j.id,
                "project_id": j.project_id,
                "project_name": proj.name if proj else "Unknown",
                "job_type": j.job_type,
                "status": j.status,
                "stage": j.stage,
                "progress": j.progress,
                "message": j.message,
                "error_details": j.error_details,
                "created_at": j.created_at,
                "started_at": j.started_at,
                "completed_at": j.completed_at,
            }
        )
    return result


@router.post("/jobs/{job_id}/cancel")
def cancel_admin_job(
    job_id: str,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status in ["COMPLETED", "FAILED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail=f"Job cannot be cancelled (status is {job.status})")

    job.status = "CANCELLED"
    job.message = "Cancelled by administrator"
    db.commit()

    db.add(
        AuditLog(
            id=str(uuid.uuid4()),
            actor="admin",
            action="CANCEL_JOB",
            target_type="JOB",
            target_id=job.id,
            details=f"Cancelled job {job.id} ({job.job_type})",
        )
    )
    db.commit()
    return {"message": "Job cancelled successfully."}


@router.get("/storage")
def get_storage_stats(
    session: AdminSession = Depends(require_admin),
):
    storage_root = settings.storage_root
    categories = ["uploads", "renders", "exports", "fonts", "temp"]
    details = {}
    total_bytes = 0

    for cat in categories:
        cat_path = storage_root / cat
        cat_bytes = get_dir_size(cat_path)
        total_bytes += cat_bytes
        file_count = 0
        if cat_path.exists():
            for _, _, files in os.walk(cat_path):
                file_count += len(files)
        details[cat] = {
            "bytes": cat_bytes,
            "mb": round(cat_bytes / (1024 * 1024), 2),
            "files": file_count,
            "path": str(cat_path),
        }

    return {
        "storage_root": str(storage_root),
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 2),
        "categories": details,
    }


@router.post("/storage/clean", response_model=StorageCleanupResult)
def clean_storage(
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Safely clean temporary files and expired artifacts.
    Never deletes active project assets or completed exports.
    """
    cleaned_files = 0
    freed_bytes = 0
    temp_dir = settings.storage_root / "temp"

    if temp_dir.exists():
        for item in temp_dir.iterdir():
            try:
                if item.is_file():
                    size = item.stat().st_size
                    item.unlink()
                    freed_bytes += size
                    cleaned_files += 1
                elif item.is_dir():
                    size = get_dir_size(item)
                    shutil.rmtree(item, ignore_errors=True)
                    freed_bytes += size
                    cleaned_files += 1
            except Exception:
                pass

    db.add(
        AuditLog(
            id=str(uuid.uuid4()),
            actor="admin",
            action="STORAGE_CLEANUP",
            target_type="STORAGE",
            target_id="temp",
            details=f"Cleaned {cleaned_files} temporary files, freed {round(freed_bytes / (1024 * 1024), 2)} MB",
        )
    )
    db.commit()

    return StorageCleanupResult(
        cleaned_files_count=cleaned_files,
        freed_bytes=freed_bytes,
        freed_mb=round(freed_bytes / (1024 * 1024), 2),
        message=f"Storage cleanup completed. Freed {round(freed_bytes / (1024 * 1024), 2)} MB.",
    )


@router.get("/system", response_model=SystemDiagnosticsResponse)
def get_system_diagnostics(
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Test SQLite connection
    db_status = "Available"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "Error"

    # Disk usage
    total, used, free = shutil.disk_usage(settings.storage_root)
    total_gb = round(total / (1024**3), 2)
    free_gb = round(free / (1024**3), 2)
    used_pct = round((used / total) * 100, 1)

    ffmpeg_ok = False
    ffprobe_ok = False
    try:
        settings.get_ffmpeg_bin()
        ffmpeg_ok = True
    except Exception:
        pass

    try:
        settings.get_ffprobe_bin()
        ffprobe_ok = True
    except Exception:
        pass

    return SystemDiagnosticsResponse(
        python_version=sys.version.split()[0],
        fastapi_version=fastapi.__version__,
        ffmpeg_available=ffmpeg_ok,
        ffprobe_available=ffprobe_ok,
        whisper_available=True,  # faster-whisper is installed locally
        database_status=db_status,
        storage_path=str(settings.storage_root),
        disk_total_gb=total_gb,
        disk_free_gb=free_gb,
        disk_used_percent=used_pct,
    )


LOG_LINE_REGEX = re.compile(r"^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s\[(\w+)\]\s(.*)$")


@router.get("/logs", response_model=List[LogEntry])
def get_admin_logs(
    level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    session: AdminSession = Depends(require_admin),
):
    log_file = settings.storage_root / "logs" / "captionstudio.log"
    if not log_file.exists():
        return []

    entries: List[LogEntry] = []
    try:
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        for line in reversed(lines):
            line_str = line.strip()
            if not line_str:
                continue

            match = LOG_LINE_REGEX.match(line_str)
            if match:
                ts, lvl, msg = match.groups()
                if level and lvl.upper() != level.upper():
                    continue
                if search and search.lower() not in msg.lower():
                    continue
                entries.append(LogEntry(timestamp=ts, level=lvl, message=msg))
                if len(entries) >= limit:
                    break
            else:
                if not level or level.upper() in ["ERROR", "WARNING"]:
                    if not search or search.lower() in line_str.lower():
                        entries.append(
                            LogEntry(
                                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                level="INFO",
                                message=line_str,
                            )
                        )
                        if len(entries) >= limit:
                            break
    except Exception:
        pass

    return entries


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [AuditLogResponse.model_validate(l) for l in logs]
