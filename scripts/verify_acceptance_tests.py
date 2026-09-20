import asyncio
import uuid
import sys
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from apps.api.app.core.config import settings
from apps.api.app.database.session import SessionLocal, init_db
from apps.api.app.database.models import Project, ProjectAsset, CaptionTrack
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.media.ffmpeg_service import ffmpeg_service
from apps.api.app.services.jobs.job_manager import job_manager

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


async def run_acceptance_tests():
    print("\n=======================================================")
    print("       CaptionStudio Phase 1 - Real Acceptance Tests    ")
    print("=======================================================\n")

    init_db()

    # Step 0: Generate a real short test video with audio using FFmpeg
    fixtures_dir = root / "tests" / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    real_video_path = fixtures_dir / "real_test_video.mp4"

    print("[1/4] Generating short test video (3 seconds with audio)...")
    ffmpeg_service.run_command([
        "-f", "lavfi", "-i", "testsrc=duration=3:size=1280x720:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest",
        str(real_video_path)
    ])
    assert real_video_path.is_file(), "Test video generation failed."
    print("      [OK] Real test video generated successfully.")

    # -----------------------------------------------------------------
    # Test A: Video Upload & Pipeline
    # -----------------------------------------------------------------
    print("\n[2/4] Running Test A — Video Upload & Pipeline Workflow...")
    db = SessionLocal()
    try:
        proj_a = Project(
            id=str(uuid.uuid4()),
            name="Acceptance Test A - Video",
            source_type="VIDEO",
            status="CREATED",
        )
        db.add(proj_a)
        db.commit()

        with open(real_video_path, "rb") as f:
            v_key, v_size = storage_service.save_upload(f, "real_test_video.mp4")

        v_asset = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=proj_a.id,
            type="VIDEO",
            original_filename="real_test_video.mp4",
            mime_type="video/mp4",
            size=v_size,
            storage_key=v_key,
        )
        db.add(v_asset)
        db.commit()

        job_a = job_manager.create_job(db, project_id=proj_a.id, job_type="TRANSCRIPTION")

        print("      - Executing Video Pipeline (Media Analysis -> Audio Extraction -> Whisper -> Grouping)...")
        await job_manager._process_video_transcription(
            job_id=job_a.id,
            project_id=proj_a.id,
            video_asset_id=v_asset.id,
            language="auto",
        )

        db.expire_all()
        proj_a_updated = db.query(Project).filter(Project.id == proj_a.id).first()
        assert proj_a_updated.status == "READY", f"Project status is {proj_a_updated.status}"
        assert proj_a_updated.duration is not None and proj_a_updated.duration >= 2.9
        assert proj_a_updated.width == 1280 and proj_a_updated.height == 720

        # Check extracted audio
        audio_asset = db.query(ProjectAsset).filter(ProjectAsset.project_id == proj_a.id, ProjectAsset.type == "AUDIO").first()
        assert audio_asset is not None, "Extracted audio asset was not recorded."

        # Check caption track
        track_a = db.query(CaptionTrack).filter(CaptionTrack.project_id == proj_a.id).first()
        assert track_a is not None, "Caption track was not created."
        print(f"      [OK] Test A PASSED! Project status: {proj_a_updated.status}, Track: '{track_a.name}', Audio Extracted: OK")
    finally:
        db.close()

    # -----------------------------------------------------------------
    # Test B: Video + External SRT
    # -----------------------------------------------------------------
    print("\n[3/4] Running Test B — Video + External SRT Subtitle Workflow...")
    db = SessionLocal()
    try:
        proj_b = Project(
            id=str(uuid.uuid4()),
            name="Acceptance Test B - Video + SRT",
            source_type="VIDEO_WITH_SUBTITLE",
            status="CREATED",
        )
        db.add(proj_b)
        db.commit()

        # Save video asset
        with open(real_video_path, "rb") as f:
            v_key_b, v_size_b = storage_service.save_upload(f, "real_test_video.mp4")
        v_asset_b = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=proj_b.id,
            type="VIDEO",
            original_filename="real_test_video.mp4",
            mime_type="video/mp4",
            size=v_size_b,
            storage_key=v_key_b,
        )
        db.add(v_asset_b)

        # Save subtitle asset
        sample_srt = fixtures_dir / "sample.srt"
        with open(sample_srt, "rb") as f:
            s_key_b, s_size_b = storage_service.save_upload(f, "sample.srt")
        s_asset_b = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=proj_b.id,
            type="SUBTITLE",
            original_filename="sample.srt",
            mime_type="application/x-subrip",
            size=s_size_b,
            storage_key=s_key_b,
        )
        db.add(s_asset_b)
        db.commit()

        job_b = job_manager.create_job(db, project_id=proj_b.id, job_type="SUBTITLE_IMPORT")
        print("      - Synchronizing video and external SRT...")
        await job_manager._process_video_with_subtitle(
            job_id=job_b.id,
            project_id=proj_b.id,
            video_asset_id=v_asset_b.id,
            subtitle_asset_id=s_asset_b.id,
        )

        db.expire_all()
        proj_b_updated = db.query(Project).filter(Project.id == proj_b.id).first()
        assert proj_b_updated.status == "READY"
        track_b = db.query(CaptionTrack).filter(CaptionTrack.project_id == proj_b.id).first()
        assert track_b is not None
        assert len(track_b.segments) == 2
        print(f"      [OK] Test B PASSED! Synchronized {len(track_b.segments)} SRT segments to video timeline.")
    finally:
        db.close()

    # -----------------------------------------------------------------
    # Test C: Subtitle-Only (Chroma Canvas Generation)
    # -----------------------------------------------------------------
    print("\n[4/4] Running Test C — Subtitle-Only & Chroma Canvas Generation...")
    db = SessionLocal()
    try:
        proj_c = Project(
            id=str(uuid.uuid4()),
            name="Acceptance Test C - Chroma Canvas",
            source_type="SUBTITLE",
            status="CREATED",
        )
        db.add(proj_c)
        db.commit()

        # Save subtitle asset
        with open(sample_srt, "rb") as f:
            s_key_c, s_size_c = storage_service.save_upload(f, "sample.srt")
        s_asset_c = ProjectAsset(
            id=str(uuid.uuid4()),
            project_id=proj_c.id,
            type="SUBTITLE",
            original_filename="sample.srt",
            mime_type="application/x-subrip",
            size=s_size_c,
            storage_key=s_key_c,
        )
        db.add(s_asset_c)
        db.commit()

        job_c = job_manager.create_job(db, project_id=proj_c.id, job_type="SUBTITLE_IMPORT")
        print("      - Generating Green Chroma Canvas and parsing subtitles...")
        await job_manager._process_subtitle_import(
            job_id=job_c.id,
            project_id=proj_c.id,
            subtitle_asset_id=s_asset_c.id,
            chroma_color="#00FF00",
        )

        db.expire_all()
        proj_c_updated = db.query(Project).filter(Project.id == proj_c.id).first()
        assert proj_c_updated.status == "READY"

        # Verify generated chroma video
        chroma_asset = db.query(ProjectAsset).filter(ProjectAsset.project_id == proj_c.id, ProjectAsset.type == "VIDEO").first()
        assert chroma_asset is not None, "Chroma canvas video was not generated."
        chroma_path = storage_service.resolve_key(chroma_asset.storage_key)
        assert chroma_path.is_file() and chroma_path.stat().st_size > 0

        track_c = db.query(CaptionTrack).filter(CaptionTrack.project_id == proj_c.id).first()
        assert track_c is not None
        assert len(track_c.segments) == 2
        print(f"      [OK] Test C PASSED! Chroma canvas video ({chroma_asset.original_filename}) created successfully.")
    finally:
        db.close()

    print("\n=======================================================")
    print("  [SUCCESS] All Real Acceptance Tests (A, B, C) Passed! ")
    print("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(run_acceptance_tests())
