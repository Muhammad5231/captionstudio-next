from pathlib import Path
import pytest
from apps.api.app.services.rendering.export_service import export_service
from apps.api.app.services.media.ffprobe_service import ffprobe_service
from apps.api.app.schemas.render_spec import CaptionRenderSpec


def test_real_ffmpeg_burn_in_with_fixture():
    test_video = Path("tests/fixtures/real_test_video.mp4").resolve()
    assert test_video.is_file(), "Test video fixture missing"

    out_mp4 = Path("storage/test_burn_in_output.mp4").resolve()
    if out_mp4.exists():
        out_mp4.unlink()

    spec = CaptionRenderSpec(
        fontFamily="Arial",
        fontSize=38,
        textColor="#FFFFFF",
        highlightColor="#FFE600",
        strokeColor="#000000",
        strokeWidth=6.0,
        positionY=75.0,
    )

    segments = [
        {
            "start_time": 0.0,
            "end_time": 2.0,
            "text": "BURN IN VERIFICATION",
            "words": [
                {"word": "BURN", "start_time": 0.0, "end_time": 0.6},
                {"word": "IN", "start_time": 0.6, "end_time": 1.2},
                {"word": "VERIFICATION", "start_time": 1.2, "end_time": 2.0},
            ],
        }
    ]

    rendered_file = export_service.render_mp4(
        input_video_path=test_video,
        segments=segments,
        spec=spec,
        output_path=out_mp4,
        video_width=640,
        video_height=360,
        duration=2.0,
        preset="ultrafast",
    )

    assert rendered_file.is_file()
    assert rendered_file.stat().st_size > 0

    # Probe output with ffprobe
    meta = ffprobe_service.probe(rendered_file)
    assert meta.has_video is True
    assert meta.video_codec in ("h264", "avc1")
    assert meta.duration > 0

    # Cleanup
    if out_mp4.exists():
        out_mp4.unlink()

