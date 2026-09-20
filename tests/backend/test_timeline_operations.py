import uuid
import pytest
from apps.api.app.database.session import SessionLocal
from apps.api.app.database.models import Project, CaptionTrack, CaptionSegment, CaptionWord
from apps.api.app.api.v1.captions import split_caption_segment, merge_caption_segments, SplitSegmentRequest, MergeSegmentsRequest


@pytest.fixture
def sample_project_track():
    db = SessionLocal()
    proj = Project(
        id=str(uuid.uuid4()),
        name="Timeline Test Project",
        source_type="VIDEO",
        duration=10.0,
    )
    db.add(proj)
    track = CaptionTrack(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        name="Test Track",
    )
    db.add(track)
    db.flush()

    seg1 = CaptionSegment(
        id=str(uuid.uuid4()),
        track_id=track.id,
        segment_index=0,
        start_time=0.0,
        end_time=3.0,
        text="The quick brown fox",
    )
    db.add(seg1)
    db.flush()

    words = [
        ("The", 0.0, 0.5),
        ("quick", 0.5, 1.2),
        ("brown", 1.2, 2.0),
        ("fox", 2.0, 3.0),
    ]
    for idx, (w, st, et) in enumerate(words):
        db.add(CaptionWord(
            id=str(uuid.uuid4()),
            segment_id=seg1.id,
            word_index=idx,
            word=w,
            start_time=st,
            end_time=et,
        ))

    db.commit()
    track_id = track.id
    proj_id = proj.id
    seg_id = seg1.id
    db.close()

    yield proj_id, track_id, seg_id

    # Cleanup
    db = SessionLocal()
    p = db.query(Project).filter(Project.id == proj_id).first()
    if p:
        db.delete(p)
        db.commit()
    db.close()


def test_split_and_merge_segments(sample_project_track):
    proj_id, track_id, seg_id = sample_project_track
    db = SessionLocal()

    # Split segment at word index 2 ('brown')
    req = SplitSegmentRequest(segment_id=seg_id, split_word_index=2)
    updated_track = split_caption_segment(proj_id, track_id, req, db)

    assert len(updated_track.segments) == 2
    s1 = updated_track.segments[0]
    s2 = updated_track.segments[1]

    assert s1.text == "The quick"
    assert s2.text == "brown fox"
    assert s1.end_time == s2.start_time

    # Now merge them back
    merge_req = MergeSegmentsRequest(segment_id_1=s1.id, segment_id_2=s2.id)
    merged_track = merge_caption_segments(proj_id, track_id, merge_req, db)

    assert len(merged_track.segments) == 1
    assert merged_track.segments[0].text == "The quick brown fox"
    assert merged_track.segments[0].start_time == 0.0
    assert merged_track.segments[0].end_time == 3.0

    db.close()

