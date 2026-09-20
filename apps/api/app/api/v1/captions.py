import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, CaptionTrack, CaptionSegment, CaptionWord
from apps.api.app.schemas.caption import CaptionTrackResponse, CaptionTrackUpdate

router = APIRouter()


@router.get("/projects/{project_id}/captions", response_model=List[CaptionTrackResponse])
def get_project_captions(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tracks = (
        db.query(CaptionTrack)
        .options(
            joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(CaptionTrack.project_id == project_id)
        .all()
    )
    return tracks


@router.put("/projects/{project_id}/captions/{track_id}", response_model=CaptionTrackResponse)
def update_caption_track(
    project_id: str,
    track_id: str,
    payload: CaptionTrackUpdate,
    db: Session = Depends(get_db),
):
    track = (
        db.query(CaptionTrack)
        .options(joinedload(CaptionTrack.segments))
        .filter(CaptionTrack.id == track_id, CaptionTrack.project_id == project_id)
        .first()
    )
    if not track:
        raise HTTPException(status_code=404, detail="Caption track not found")

    if payload.name is not None:
        track.name = payload.name
    if payload.language is not None:
        track.language = payload.language

    if payload.segments is not None:
        # Clear existing segments
        for seg in list(track.segments):
            db.delete(seg)
        db.flush()

        # Add updated segments
        for s_idx, seg_data in enumerate(payload.segments):
            new_seg = CaptionSegment(
                id=str(uuid.uuid4()),
                track_id=track.id,
                segment_index=s_idx,
                start_time=seg_data.start_time,
                end_time=seg_data.end_time,
                text=seg_data.text,
            )
            db.add(new_seg)
            db.flush()

            for w_idx, w_data in enumerate(seg_data.words):
                new_word = CaptionWord(
                    id=str(uuid.uuid4()),
                    segment_id=new_seg.id,
                    word_index=w_idx,
                    word=w_data.word,
                    start_time=w_data.start_time,
                    end_time=w_data.end_time,
                    confidence=w_data.confidence,
                )
                db.add(new_word)

    db.commit()
    db.refresh(track)
    return track
