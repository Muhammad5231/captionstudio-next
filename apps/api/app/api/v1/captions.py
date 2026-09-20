import json
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, CaptionTrack, CaptionSegment, CaptionWord
from apps.api.app.schemas.caption import CaptionTrackResponse, CaptionTrackUpdate
from apps.api.app.schemas.render_spec import CaptionRenderSpec

router = APIRouter()


class SplitSegmentRequest(BaseModel):
    segment_id: str
    split_time: Optional[float] = None
    split_word_index: Optional[int] = None


class MergeSegmentsRequest(BaseModel):
    segment_id_1: str
    segment_id_2: str


class StyleUpdateRequest(BaseModel):
    style: CaptionRenderSpec


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
        .options(
            joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(CaptionTrack.id == track_id, CaptionTrack.project_id == project_id)
        .first()
    )
    if not track:
        raise HTTPException(status_code=404, detail="Caption track not found")

    if payload.name is not None:
        track.name = payload.name
    if payload.language is not None:
        track.language = payload.language
    if payload.style is not None:
        track.style_spec = json.dumps(payload.style.model_dump())

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

            words_to_insert = seg_data.words or []
            if not words_to_insert and new_seg.text:
                raw_words = [w for w in new_seg.text.split() if w]
                if raw_words:
                    dur = max(0.1, new_seg.end_time - new_seg.start_time)
                    step = dur / len(raw_words)
                    for w_idx, w_text in enumerate(raw_words):
                        w_start = new_seg.start_time + w_idx * step
                        w_end = w_start + step
                        new_word = CaptionWord(
                            id=str(uuid.uuid4()),
                            segment_id=new_seg.id,
                            word_index=w_idx,
                            word=w_text,
                            start_time=round(w_start, 3),
                            end_time=round(w_end, 3),
                            confidence=1.0,
                        )
                        db.add(new_word)
            else:
                for w_idx, w_data in enumerate(words_to_insert):
                    new_word = CaptionWord(
                        id=str(uuid.uuid4()),
                        segment_id=new_seg.id,
                        word_index=w_idx if w_data.word_index is None else w_data.word_index,
                        word=w_data.word,
                        start_time=w_data.start_time,
                        end_time=w_data.end_time,
                        confidence=w_data.confidence,
                    )
                    db.add(new_word)

        db.commit()
    db.refresh(track)
    return track


@router.put("/projects/{project_id}/captions/{track_id}/style", response_model=CaptionTrackResponse)
def update_track_style(
    project_id: str,
    track_id: str,
    payload: StyleUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Updates the active CaptionRenderSpec for a specific caption track.
    """
    track = (
        db.query(CaptionTrack)
        .options(
            joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(CaptionTrack.id == track_id, CaptionTrack.project_id == project_id)
        .first()
    )
    if not track:
        raise HTTPException(status_code=404, detail="Caption track not found")

    track.style_spec = json.dumps(payload.style.model_dump())
    db.commit()
    db.refresh(track)
    return track


@router.post("/projects/{project_id}/captions/{track_id}/split", response_model=CaptionTrackResponse)
def split_caption_segment(
    project_id: str,
    track_id: str,
    payload: SplitSegmentRequest,
    db: Session = Depends(get_db),
):
    """
    Splits a caption segment into two at a specified timestamp or word index.
    """
    track = (
        db.query(CaptionTrack)
        .options(
            joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(CaptionTrack.id == track_id, CaptionTrack.project_id == project_id)
        .first()
    )
    if not track:
        raise HTTPException(status_code=404, detail="Caption track not found")

    target_seg = next((s for s in track.segments if s.id == payload.segment_id), None)
    if not target_seg:
        raise HTTPException(status_code=404, detail="Target segment not found")

    words = list(target_seg.words)
    if len(words) < 2:
        # Fallback split text in half
        mid_time = (target_seg.start_time + target_seg.end_time) / 2.0
        split_time = payload.split_time or mid_time
        if split_time <= target_seg.start_time or split_time >= target_seg.end_time:
            split_time = mid_time

        text_parts = target_seg.text.split()
        mid_word = max(1, len(text_parts) // 2)
        text1 = " ".join(text_parts[:mid_word]) or target_seg.text
        text2 = " ".join(text_parts[mid_word:]) or target_seg.text

        target_seg.end_time = split_time
        target_seg.text = text1

        new_seg = CaptionSegment(
            id=str(uuid.uuid4()),
            track_id=track.id,
            segment_index=target_seg.segment_index + 1,
            start_time=split_time,
            end_time=target_seg.end_time,
            text=text2,
        )
        db.add(new_seg)
    else:
        # Split according to word index or split_time
        split_idx = payload.split_word_index
        if split_idx is None and payload.split_time is not None:
            # Find closest word boundary
            for idx, w in enumerate(words):
                if w.start_time >= payload.split_time and idx > 0:
                    split_idx = idx
                    break
            if split_idx is None:
                split_idx = len(words) // 2
        elif split_idx is None:
            split_idx = len(words) // 2

        split_idx = max(1, min(len(words) - 1, split_idx))

        words1 = words[:split_idx]
        words2 = words[split_idx:]

        target_seg.end_time = words1[-1].end_time
        target_seg.text = " ".join(w.word for w in words1)

        new_seg = CaptionSegment(
            id=str(uuid.uuid4()),
            track_id=track.id,
            segment_index=target_seg.segment_index + 1,
            start_time=words2[0].start_time,
            end_time=words2[-1].end_time,
            text=" ".join(w.word for w in words2),
        )
        db.add(new_seg)
        db.flush()

        # Reassign words2 to new segment
        for new_w_idx, w in enumerate(words2):
            w.segment_id = new_seg.id
            w.word_index = new_w_idx

    # Re-index subsequent segments
    all_segs = sorted(track.segments, key=lambda s: s.start_time)
    for idx, s in enumerate(all_segs):
        s.segment_index = idx

    db.commit()
    db.refresh(track)
    return track


@router.post("/projects/{project_id}/captions/{track_id}/merge", response_model=CaptionTrackResponse)
def merge_caption_segments(
    project_id: str,
    track_id: str,
    payload: MergeSegmentsRequest,
    db: Session = Depends(get_db),
):
    """
    Merges two adjacent caption segments into a single unified segment.
    """
    track = (
        db.query(CaptionTrack)
        .options(
            joinedload(CaptionTrack.segments)
            .joinedload(CaptionSegment.words)
        )
        .filter(CaptionTrack.id == track_id, CaptionTrack.project_id == project_id)
        .first()
    )
    if not track:
        raise HTTPException(status_code=404, detail="Caption track not found")

    seg1 = next((s for s in track.segments if s.id == payload.segment_id_1), None)
    seg2 = next((s for s in track.segments if s.id == payload.segment_id_2), None)
    if not seg1 or not seg2:
        raise HTTPException(status_code=404, detail="Segments to merge not found")

    # Ensure chronological order
    first_seg, second_seg = (seg1, seg2) if seg1.start_time <= seg2.start_time else (seg2, seg1)

    first_seg.end_time = max(first_seg.end_time, second_seg.end_time)
    first_seg.text = f"{first_seg.text.strip()} {second_seg.text.strip()}".strip()

    # Move words from second_seg to first_seg
    start_w_idx = len(first_seg.words)
    for idx, w in enumerate(second_seg.words):
        w.segment_id = first_seg.id
        w.word_index = start_w_idx + idx

    db.delete(second_seg)
    db.flush()

    # Re-index
    all_segs = sorted([s for s in track.segments if s.id != second_seg.id], key=lambda s: s.start_time)
    for idx, s in enumerate(all_segs):
        s.segment_index = idx

    db.commit()
    db.refresh(track)
    return track
