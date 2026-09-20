import uuid
from apps.api.app.database.session import SessionLocal, init_db
from apps.api.app.database.models import (
    Project,
    CaptionTrack,
    CaptionSegment,
    CaptionWord,
)


def test_caption_model_hierarchy():
    init_db()
    db = SessionLocal()
    try:
        # Create Project
        proj = Project(
            id=str(uuid.uuid4()),
            name="Test Hierarchy Project",
            source_type="VIDEO",
            status="READY",
            language="en",
        )
        db.add(proj)
        db.commit()

        # Create Track
        track = CaptionTrack(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            name="English Captions",
            language="en",
            is_default=True,
        )
        db.add(track)
        db.commit()

        # Create Segment
        seg = CaptionSegment(
            id=str(uuid.uuid4()),
            track_id=track.id,
            segment_index=0,
            start_time=1.0,
            end_time=3.0,
            text="Hello world test",
        )
        db.add(seg)
        db.commit()

        # Create Words
        w1 = CaptionWord(
            id=str(uuid.uuid4()),
            segment_id=seg.id,
            word_index=0,
            word="Hello",
            start_time=1.0,
            end_time=1.5,
            confidence=0.98,
        )
        w2 = CaptionWord(
            id=str(uuid.uuid4()),
            segment_id=seg.id,
            word_index=1,
            word="world",
            start_time=1.6,
            end_time=2.2,
            confidence=0.95,
        )
        db.add_all([w1, w2])
        db.commit()

        # Verify Hierarchy
        loaded_proj = db.query(Project).filter(Project.id == proj.id).first()
        assert loaded_proj is not None
        assert len(loaded_proj.caption_tracks) == 1

        loaded_track = loaded_proj.caption_tracks[0]
        assert len(loaded_track.segments) == 1

        loaded_seg = loaded_track.segments[0]
        assert loaded_seg.text == "Hello world test"
        assert len(loaded_seg.words) == 2
        assert loaded_seg.words[0].word == "Hello"
        assert loaded_seg.words[1].word == "world"

        # Clean up
        db.delete(loaded_proj)
        db.commit()
    finally:
        db.close()

