import sys
import uuid
import json
from pathlib import Path

# Fix Windows stdout encoding
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from apps.api.app.database.session import init_db, SessionLocal
from apps.api.app.database.models import Project, CaptionTrack, CaptionSegment, CaptionWord, ProjectAsset, Export
from apps.api.app.services.templates.template_service import template_service
from apps.api.app.services.fonts.font_manager import font_manager
from apps.api.app.services.rendering.ass_generator import ass_renderer
from apps.api.app.services.rendering.export_service import export_service
from apps.api.app.services.media.ffprobe_service import ffprobe_service
from apps.api.app.schemas.render_spec import CaptionRenderSpec, StyleCategory


def run_e2e_verification():
    print("=" * 60)
    print("CAPTIONSTUDIO PHASE 2 — END-TO-END VERIFICATION")
    print("=" * 60)

    # Step 1: Initialize Database & Migrations
    print("\n[Step 1] Initializing SQLite database and schema migrations...")
    init_db()
    print(" [OK] Database schema initialized and verified.")

    # Step 2: Verify Templates & Categories
    print("\n[Step 2] Validating 60+ Data-Driven Style Templates...")
    templates = template_service.list_templates()
    print(f" [OK] Loaded {len(templates)} templates across all categories.")
    assert len(templates) >= 60, f"Expected 60 templates, found {len(templates)}"

    for cat in StyleCategory:
        cat_items = template_service.list_templates(category=cat)
        assert len(cat_items) == 10, f"Category {cat.value} has {len(cat_items)} templates"
        print(f"   - {cat.value}: {len(cat_items)} templates [OK]")

    # Step 3: Verify Font Manager
    print("\n[Step 3] Validating Font Registry & Fallbacks...")
    fonts = font_manager.list_available_fonts()
    print(f" [OK] Registered {len(fonts)} local TrueType fonts.")
    resolved_impact = font_manager.resolve_font_name("Impact")
    resolved_mont = font_manager.resolve_font_name("Montserrat")
    print(f"   - Impact -> {resolved_impact}")
    print(f"   - Montserrat -> {resolved_mont}")
    assert resolved_impact is not None
    assert resolved_mont is not None

    # Step 4: Create Test Project & Caption Track
    print("\n[Step 4] Creating Test Project and Captions...")
    db = SessionLocal()
    proj = Project(
        id=str(uuid.uuid4()),
        name="Phase 2 Verification Reel",
        source_type="VIDEO",
        duration=3.0,
        width=1280,
        height=720,
    )
    db.add(proj)

    # Attach test video fixture
    test_video_fixture = Path("tests/fixtures/real_test_video.mp4").resolve()
    assert test_video_fixture.is_file(), "Test video fixture not found!"

    asset = ProjectAsset(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        type="VIDEO",
        original_filename="real_test_video.mp4",
        mime_type="video/mp4",
        size=test_video_fixture.stat().st_size,
        storage_key="fixtures/real_test_video.mp4",
        duration=3.0,
        width=1280,
        height=720,
    )
    db.add(asset)

    # Select a viral template: Hormozi Punch
    hormozi_template = template_service.get_template("viral-hormozi")
    assert hormozi_template is not None, "viral-hormozi template missing!"

    track = CaptionTrack(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        name="Main Captions",
        is_default=True,
        style_spec=json.dumps(hormozi_template.renderSpec.model_dump()),
    )
    db.add(track)
    db.flush()

    seg = CaptionSegment(
        id=str(uuid.uuid4()),
        track_id=track.id,
        segment_index=0,
        start_time=0.2,
        end_time=2.6,
        text="CAPTION STUDIO PHASE TWO",
    )
    db.add(seg)
    db.flush()

    words = [
        ("CAPTION", 0.2, 0.8),
        ("STUDIO", 0.8, 1.4),
        ("PHASE", 1.4, 2.0),
        ("TWO", 2.0, 2.6),
    ]
    for idx, (w, st, et) in enumerate(words):
        db.add(CaptionWord(
            id=str(uuid.uuid4()),
            segment_id=seg.id,
            word_index=idx,
            word=w,
            start_time=st,
            end_time=et,
        ))
    db.commit()
    print(f" [OK] Project created: '{proj.name}' (ID: {proj.id})")
    print(f" [OK] Applied style: '{hormozi_template.name}' (Highlight: {hormozi_template.renderSpec.highlightColor})")

    # Step 5: ASS Generation & Parity Check
    print("\n[Step 5] Generating ASS subtitles from canonical RenderSpec...")
    segments_dict = [
        {
            "start_time": seg.start_time,
            "end_time": seg.end_time,
            "text": seg.text,
            "words": [
                {"word": w, "start_time": st, "end_time": et}
                for w, st, et in words
            ]
        }
    ]
    ass_output = ass_renderer.generate_ass(
        segments=segments_dict,
        spec=hormozi_template.renderSpec,
        video_width=proj.width,
        video_height=proj.height,
    )
    assert "[Script Info]" in ass_output
    assert "PlayResX: 1280" in ass_output
    assert "PlayResY: 720" in ass_output
    assert "Style: Default" in ass_output
    assert "\\an5\\pos(" in ass_output
    print(" [OK] ASS subtitle syntax verified.")

    # Step 6: Full FFmpeg Subtitle Burn-In Render
    print("\n[Step 6] Executing FFmpeg subtitle burn-in rendering...")
    out_rendered_mp4 = Path("storage/exports/e2e_verification_rendered.mp4").resolve()
    out_rendered_mp4.parent.mkdir(parents=True, exist_ok=True)
    if out_rendered_mp4.exists():
        out_rendered_mp4.unlink()

    export_service.render_mp4(
        input_video_path=test_video_fixture,
        segments=segments_dict,
        spec=hormozi_template.renderSpec,
        output_path=out_rendered_mp4,
        video_width=proj.width,
        video_height=proj.height,
        duration=proj.duration,
        preset="ultrafast",
    )
    assert out_rendered_mp4.is_file() and out_rendered_mp4.stat().st_size > 0
    print(f" [OK] Rendered MP4 produced: {out_rendered_mp4.name} ({out_rendered_mp4.stat().st_size} bytes)")

    # Step 7: Probe Rendered Video via FFprobe
    print("\n[Step 7] Probing exported video with FFprobe...")
    meta = ffprobe_service.probe(out_rendered_mp4)
    print(f" [OK] Stream info: {meta.video_codec} ({meta.width}x{meta.height}) at {meta.fps} FPS, duration: {meta.duration:.2f}s")
    assert meta.has_video is True
    assert meta.video_codec in ("h264", "avc1")
    assert meta.duration >= 2.0

    # Step 8: Multi-format export checks (SRT, VTT, ASS, JSON)
    print("\n[Step 8] Testing auxiliary export formats (SRT, VTT, ASS, JSON)...")
    srt_out = Path("storage/exports/e2e_test.srt")
    vtt_out = Path("storage/exports/e2e_test.vtt")
    ass_out = Path("storage/exports/e2e_test.ass")
    json_out = Path("storage/exports/e2e_test.json")

    export_service.export_srt(segments_dict, srt_out)
    export_service.export_vtt(segments_dict, vtt_out)
    export_service.export_ass(segments_dict, hormozi_template.renderSpec, ass_out)
    export_service.export_json({"test": True, "segments": segments_dict}, json_out)

    assert srt_out.is_file() and srt_out.stat().st_size > 0
    assert vtt_out.is_file() and vtt_out.stat().st_size > 0
    assert ass_out.is_file() and ass_out.stat().st_size > 0
    assert json_out.is_file() and json_out.stat().st_size > 0
    print(" [OK] All subtitle export formats generated successfully.")

    # Cleanup artifacts
    for p in [out_rendered_mp4, srt_out, vtt_out, ass_out, json_out]:
        if p.exists():
            p.unlink()

    # Cleanup DB
    for exp in db.query(Export).filter(Export.project_id == proj.id).all():
        db.delete(exp)
    db.delete(proj)
    db.commit()
    db.close()

    print("\n" + "=" * 60)
    print("ALL PHASE 2 ACCEPTANCE CRITERIA SUCCESSFULLY VERIFIED!")
    print("=" * 60)


if __name__ == "__main__":
    run_e2e_verification()

