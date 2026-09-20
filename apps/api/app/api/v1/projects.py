import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, ProjectAsset, CaptionTrack, CaptionSegment, CaptionWord
from apps.api.app.schemas.project import ProjectCreate, ProjectResponse
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.core.logging import logger

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        id=str(uuid.uuid4()),
        name=payload.name,
        source_type=payload.source_type,
        status="CREATED",
        language=payload.language or "en",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info("Created project %s (%s)", project.id, project.name)
    return project


@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = (
        db.query(Project)
        .options(joinedload(Project.assets), joinedload(Project.caption_tracks))
        .order_by(Project.created_at.desc())
        .all()
    )
    return projects


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .options(
            joinedload(Project.assets),
            joinedload(Project.caption_tracks)
            .joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clean up associated asset files from storage
    assets = db.query(ProjectAsset).filter(ProjectAsset.project_id == project_id).all()
    for a in assets:
        storage_service.delete_file(a.storage_key)

    db.delete(project)
    db.commit()
    logger.info("Deleted project %s and its files", project_id)
    return None
