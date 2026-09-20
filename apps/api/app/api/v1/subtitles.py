from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, ProjectAsset
from apps.api.app.services.jobs.job_manager import job_manager
from apps.api.app.schemas.job import JobResponse

router = APIRouter()


class ImportSubtitleRequest(BaseModel):
    subtitle_asset_id: str
    video_asset_id: Optional[str] = None
    chroma_color: Optional[str] = "#00FF00"


@router.post("/projects/{project_id}/subtitles", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
def import_subtitles(
    project_id: str,
    payload: ImportSubtitleRequest,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    sub_asset = db.query(ProjectAsset).filter(ProjectAsset.id == payload.subtitle_asset_id).first()
    if not sub_asset or sub_asset.project_id != project_id:
        raise HTTPException(status_code=400, detail="Invalid subtitle asset for this project")

    job = job_manager.create_job(db, project_id=project_id, job_type="SUBTITLE_IMPORT")

    if payload.video_asset_id:
        video_asset = db.query(ProjectAsset).filter(ProjectAsset.id == payload.video_asset_id).first()
        if not video_asset or video_asset.project_id != project_id:
            raise HTTPException(status_code=400, detail="Invalid video asset for this project")

        job_manager.start_pipeline_task(
            job_id=job.id,
            project_id=project_id,
            pipeline_type="VIDEO_WITH_SUBTITLE",
            video_asset_id=video_asset.id,
            subtitle_asset_id=sub_asset.id,
        )
    else:
        job_manager.start_pipeline_task(
            job_id=job.id,
            project_id=project_id,
            pipeline_type="SUBTITLE_IMPORT",
            subtitle_asset_id=sub_asset.id,
            chroma_color=payload.chroma_color or "#00FF00",
        )

    return job
