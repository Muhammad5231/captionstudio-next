from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, ProjectAsset
from apps.api.app.services.jobs.job_manager import job_manager
from apps.api.app.schemas.job import JobResponse

router = APIRouter()


class TranscribeRequest(BaseModel):
    video_asset_id: str
    language: Optional[str] = "auto"


@router.post("/projects/{project_id}/transcribe", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
def start_transcription(
    project_id: str,
    payload: TranscribeRequest,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    asset = db.query(ProjectAsset).filter(ProjectAsset.id == payload.video_asset_id).first()
    if not asset or asset.project_id != project_id:
        raise HTTPException(status_code=400, detail="Invalid video asset for this project")

    # Create job record
    job = job_manager.create_job(db, project_id=project_id, job_type="TRANSCRIPTION")

    # Launch async background pipeline
    job_manager.start_pipeline_task(
        job_id=job.id,
        project_id=project_id,
        pipeline_type="VIDEO_TRANSCRIPTION",
        video_asset_id=asset.id,
        language=payload.language,
    )

    return job
