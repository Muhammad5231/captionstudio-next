import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, ProjectAsset, CaptionTrack, CaptionSegment, CaptionWord
from apps.api.app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.core.logging import logger

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
):
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
def list_projects(
    include_deleted: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Project)
        .options(joinedload(Project.assets), joinedload(Project.caption_tracks))
    )

    if not include_deleted:
        query = query.filter(Project.deleted_at.is_(None))

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(Project.name.ilike(s))

    projects = query.order_by(Project.created_at.desc()).all()
    return projects


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .options(
            joinedload(Project.assets),
            joinedload(Project.caption_tracks)
            .joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words),
        )
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.status is not None:
        project.status = payload.status

    db.commit()
    db.refresh(project)
    return project


@router.post("/projects/{project_id}/duplicate", response_model=ProjectResponse)
def duplicate_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    src = (
        db.query(Project)
        .options(
            joinedload(Project.assets),
            joinedload(Project.caption_tracks)
            .joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words),
        )
        .filter(Project.id == project_id)
        .first()
    )
    if not src:
        raise HTTPException(status_code=404, detail="Project not found")

    # Create new project
    new_proj = Project(
        id=str(uuid.uuid4()),
        name=f"Copy of {src.name}",
        source_type=src.source_type,
        status=src.status,
        duration=src.duration,
        width=src.width,
        height=src.height,
        language=src.language,
    )
    db.add(new_proj)
    db.flush()

    # Clone assets
    for asset in src.assets:
        new_asset = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=new_proj.id,
            type=asset.type,
            original_filename=asset.original_filename,
            mime_type=asset.mime_type,
            size=asset.size,
            storage_key=asset.storage_key,
            duration=asset.duration,
            width=asset.width,
            height=asset.height,
        )
        db.add(new_asset)

    # Clone caption tracks + segments + words
    for track in src.caption_tracks:
        new_track = CaptionTrack(
            id=str(uuid.uuid4()),
            project_id=new_proj.id,
            name=track.name,
            language=track.language,
            is_default=track.is_default,
            style_spec=track.style_spec,
        )
        db.add(new_track)
        db.flush()

        for seg in track.segments:
            new_seg = CaptionSegment(
                id=str(uuid.uuid4()),
                track_id=new_track.id,
                segment_index=seg.segment_index,
                start_time=seg.start_time,
                end_time=seg.end_time,
                text=seg.text,
            )
            db.add(new_seg)
            db.flush()

            for w in seg.words:
                new_w = CaptionWord(
                    id=str(uuid.uuid4()),
                    segment_id=new_seg.id,
                    word_index=w.word_index,
                    word=w.word,
                    start_time=w.start_time,
                    end_time=w.end_time,
                    confidence=w.confidence,
                )
                db.add(new_w)

    db.commit()
    db.refresh(new_proj)
    logger.info("Duplicated project %s -> %s", src.id, new_proj.id)
    return new_proj


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    permanent: bool = Query(False),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not permanent:
        # Soft delete
        project.deleted_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Soft-deleted project %s", project_id)
        return None

    # Permanent delete: clean up associated asset files from storage
    assets = db.query(ProjectAsset).filter(ProjectAsset.project_id == project_id).all()
    for a in assets:
        storage_service.delete_file(a.storage_key)

    db.delete(project)
    db.commit()
    logger.info("Permanently deleted project %s and its files", project_id)
    return None


@router.post("/projects/{project_id}/restore", response_model=ProjectResponse)
def restore_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.deleted_at = None
    db.commit()
    db.refresh(project)
    logger.info("Restored project %s", project_id)
    return project
