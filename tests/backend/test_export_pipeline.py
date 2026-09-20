import uuid
import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.database.session import SessionLocal
from apps.api.app.database.models import Project, CaptionTrack, CaptionSegment, CaptionWord, ProjectAsset, Export
from apps.api.app.schemas.export import ExportFormat


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_project_for_export():
    db = SessionLocal()
    proj = Project(
        id=str(uuid.uuid4()),
        name="Export Test Project",
        source_type="VIDEO",
        duration=2.0,
        width=1280,
        height=720,
    )
    db.add(proj)

    # Attach video asset
    asset = ProjectAsset(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        type="VIDEO",
        original_filename="real_test_video.mp4",
        mime_type="video/mp4",
        size=1000,
        storage_key="uploads/test_export_dummy.mp4",
        duration=2.0,
    )
    db.add(asset)

    # Attach caption track
    track = CaptionTrack(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        name="Default Track",
        is_default=True,
    )
    db.add(track)
    db.flush()

    seg = CaptionSegment(
        id=str(uuid.uuid4()),
        track_id=track.id,
        segment_index=0,
        start_time=0.0,
        end_time=2.0,
        text="Export test subtitle",
    )
    db.add(seg)
    db.flush()

    word = CaptionWord(
        id=str(uuid.uuid4()),
        segment_id=seg.id,
        word_index=0,
        word="Export",
        start_time=0.0,
        end_time=1.0,
    )
    db.add(word)
    db.commit()

    proj_id = proj.id
    db.close()

    yield proj_id

    # Cleanup
    db = SessionLocal()
    for exp in db.query(Export).filter(Export.project_id == proj_id).all():
        db.delete(exp)
    db.commit()
    p = db.query(Project).filter(Project.id == proj_id).first()
    if p:
        db.delete(p)
        db.commit()
    db.close()


def test_export_srt_endpoint(client, test_project_for_export):
    proj_id = test_project_for_export

    res = client.post(
        f"/api/v1/projects/{proj_id}/export",
        json={"format": "SRT"},
    )
    assert res.status_code == 202
    data = res.json()
    assert data["format"] == "SRT"
    export_id = data["id"]

    # Check export listing
    list_res = client.get(f"/api/v1/projects/{proj_id}/exports")
    assert list_res.status_code == 200
    exports = list_res.json()
    assert any(e["id"] == export_id for e in exports)


def test_export_ass_endpoint(client, test_project_for_export):
    proj_id = test_project_for_export

    res = client.post(
        f"/api/v1/projects/{proj_id}/export",
        json={"format": "ASS"},
    )
    assert res.status_code == 202
    data = res.json()
    assert data["format"] == "ASS"


def test_export_json_endpoint(client, test_project_for_export):
    proj_id = test_project_for_export

    res = client.post(
        f"/api/v1/projects/{proj_id}/export",
        json={"format": "JSON"},
    )
    assert res.status_code == 202
    data = res.json()
    assert data["format"] == "JSON"
