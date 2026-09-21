import uuid
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, Export, Job, CaptionTrack
from apps.api.app.schemas.export import ExportRequest, ExportResponse
from apps.api.app.services.jobs.job_manager import job_manager
from apps.api.app.services.storage.local_storage import storage_service

router = APIRouter()


@router.post("/projects/{project_id}/export", response_model=ExportResponse, status_code=status.HTTP_202_ACCEPTED)
def create_export(
    project_id: str,
    payload: ExportRequest,
    db: Session = Depends(get_db),
):
    """
    Queues an export job (MP4 with burn-in, SRT, VTT, ASS, or JSON) for background processing.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify track exists
    track_query = db.query(CaptionTrack).filter(CaptionTrack.project_id == project_id)
    if payload.track_id:
        track = track_query.filter(CaptionTrack.id == payload.track_id).first()
    else:
        track = track_query.filter(CaptionTrack.is_default == True).first() or track_query.first()

    if not track:
        raise HTTPException(status_code=400, detail="Project has no caption track to export")

    # Create Job record
    job = job_manager.create_job(db, project_id, f"EXPORT_{payload.format.value}")

    # Create Export record
    export_rec = Export(
        id=str(uuid.uuid4()),
        project_id=project_id,
        job_id=job.id,
        format=payload.format.value,
        status="QUEUED",
        source_duration=project.duration,
        source_width=project.width,
        source_height=project.height,
    )
    db.add(export_rec)
    db.commit()
    db.refresh(export_rec)

    # Launch background task
    render_spec_dict = payload.render_spec.model_dump() if payload.render_spec else None
    job_manager.start_pipeline_task(
        job_id=job.id,
        project_id=project_id,
        pipeline_type="RENDER_EXPORT",
        export_id=export_rec.id,
        format_type=payload.format.value,
        track_id=track.id,
        render_spec_dict=render_spec_dict,
        crf=payload.crf,
        preset=payload.preset,
    )

    return export_rec


@router.get("/projects/{project_id}/exports", response_model=List[ExportResponse])
def list_project_exports(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    exports = (
        db.query(Export)
        .filter(Export.project_id == project_id)
        .order_by(Export.created_at.desc())
        .all()
    )
    return exports


@router.get("/exports", response_model=List[ExportResponse])
def list_all_exports(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """
    Returns history of all exports across the local studio.
    """
    query = db.query(Export)
    if status_filter:
        query = query.filter(Export.status == status_filter.upper())

    exports = query.order_by(Export.created_at.desc()).all()
    return exports


@router.get("/exports/{export_id}", response_model=ExportResponse)
def get_export_status(
    export_id: str,
    db: Session = Depends(get_db),
):
    """
    Gets status and metadata for a specific export record.
    """
    export_rec = db.query(Export).filter(Export.id == export_id).first()
    if not export_rec:
        raise HTTPException(status_code=404, detail="Export record not found")

    return export_rec


@router.get("/exports/{export_id}/download")
def download_export(
    export_id: str,
    db: Session = Depends(get_db),
):
    """
    Downloads the completed exported file.
    """
    export_rec = db.query(Export).filter(Export.id == export_id).first()
    if not export_rec:
        raise HTTPException(status_code=404, detail="Export record not found")

    if export_rec.status != "COMPLETED" or not export_rec.storage_key:
        raise HTTPException(status_code=400, detail="Export is not ready for download")

    file_path = storage_service.resolve_key(export_rec.storage_key)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Exported file missing on storage")

    # Map format to mime type
    mime_types = {
        "MP4": "video/mp4",
        "SRT": "text/plain",
        "VTT": "text/vtt",
        "ASS": "text/x-ssa",
        "JSON": "application/json",
    }
    media_type = mime_types.get(export_rec.format, "application/octet-stream")
    download_filename = export_rec.filename or file_path.name

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=download_filename,
    )


@router.delete("/exports/{export_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_export(
    export_id: str,
    db: Session = Depends(get_db),
):
    export_rec = db.query(Export).filter(Export.id == export_id).first()
    if not export_rec:
        raise HTTPException(status_code=404, detail="Export record not found")

    if export_rec.storage_key:
        storage_service.delete_file(export_rec.storage_key)

    db.delete(export_rec)
    db.commit()
    return None
