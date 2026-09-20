import asyncio
import pytest
import uuid
from pathlib import Path
from apps.api.app.database.session import SessionLocal, init_db
from apps.api.app.database.models import Project, ProjectAsset, CaptionTrack
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.jobs.job_manager import job_manager

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"


@pytest.mark.asyncio
async def test_end_to_end_subtitle_pipeline():
    init_db()
    db = SessionLocal()
    try:
        # 1. Create Project
        proj = Project(
            id=str(uuid.uuid4()),
            name="E2E Subtitle Test Project",
            source_type="SUBTITLE",
            status="CREATED",
        )
        db.add(proj)
        db.commit()

        # 2. Save Subtitle Asset to Local Storage
        sample_srt_path = FIXTURES_DIR / "sample.srt"
        with open(sample_srt_path, "rb") as f:
            storage_key, file_size = storage_service.save_upload(f, "sample.srt")

        asset = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=proj.id,
            type="SUBTITLE",
            original_filename="sample.srt",
            mime_type="application/x-subrip",
            size=file_size,
            storage_key=storage_key,
        )
        db.add(asset)
        db.commit()

        # 3. Create and Run Background Pipeline Job
        job = job_manager.create_job(db, project_id=proj.id, job_type="SUBTITLE_IMPORT")

        await job_manager._process_subtitle_import(
            job_id=job.id,
            project_id=proj.id,
            subtitle_asset_id=asset.id,
            chroma_color="#00FF00",
        )

        # 4. Verify Database State
        db.expire_all()
        updated_proj = db.query(Project).filter(Project.id == proj.id).first()
        assert updated_proj.status == "READY"
        assert updated_proj.duration is not None
        assert updated_proj.duration > 0

        # Check that chroma video was generated
        assets = db.query(ProjectAsset).filter(ProjectAsset.project_id == proj.id).all()
        video_asset = next((a for a in assets if a.type == "VIDEO"), None)
        assert video_asset is not None
        video_disk_path = storage_service.resolve_key(video_asset.storage_key)
        assert video_disk_path.is_file()
        assert video_disk_path.stat().st_size > 0

        # Check that canonical caption track, segments, and words were created
        track = db.query(CaptionTrack).filter(CaptionTrack.project_id == proj.id).first()
        assert track is not None
        assert len(track.segments) == 2
        assert track.segments[0].text == "Hello world"
        assert len(track.segments[0].words) == 2
        assert track.segments[0].words[0].word == "Hello"

        # 5. Clean up test assets
        storage_service.delete_file(storage_key)
        storage_service.delete_file(video_asset.storage_key)
        db.delete(updated_proj)
        db.commit()

    finally:
        db.close()

