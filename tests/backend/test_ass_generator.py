import pytest
from apps.api.app.schemas.render_spec import CaptionRenderSpec, CaptionDisplayMode, CaptionAnimationType
from apps.api.app.services.rendering.ass_generator import ass_renderer, format_ass_time


def test_format_ass_time():
    assert format_ass_time(0.0) == "0:00:00.00"
    assert format_ass_time(1.25) == "0:00:01.25"
    assert format_ass_time(65.5) == "0:01:05.50"
    assert format_ass_time(3661.12) == "1:01:01.12"


def test_ass_generation_structure():
    spec = CaptionRenderSpec(
        fontFamily="Arial",
        fontSize=40,
        textColor="#FFFFFF",
        highlightColor="#FFE600",
        strokeColor="#000000",
        strokeWidth=6.0,
        positionY=80.0,
    )

    segments = [
        {
            "start_time": 1.0,
            "end_time": 3.0,
            "text": "Hello world",
            "words": [
                {"word": "Hello", "start_time": 1.0, "end_time": 2.0},
                {"word": "world", "start_time": 2.0, "end_time": 3.0},
            ],
        }
    ]

    ass_text = ass_renderer.generate_ass(segments, spec, video_width=1920, video_height=1080)
    assert "[Script Info]" in ass_text
    assert "PlayResX: 1920" in ass_text
    assert "PlayResY: 1080" in ass_text
    assert "[V4+ Styles]" in ass_text
    assert "Style: Default" in ass_text
    assert "[Events]" in ass_text
    assert "Dialogue:" in ass_text
    # Check that position tag was emitted
    assert "\\an5\\pos(" in ass_text


def test_karaoke_ass_generation():
    spec = CaptionRenderSpec(
        animation={"type": CaptionAnimationType.KARAOKE, "durationMs": 0, "scale": 1.0}
    )
    segments = [
        {
            "start_time": 0.0,
            "end_time": 2.0,
            "text": "sing along",
            "words": [
                {"word": "sing", "start_time": 0.0, "end_time": 1.0},
                {"word": "along", "start_time": 1.0, "end_time": 2.0},
            ],
        }
    ]
    ass_text = ass_renderer.generate_ass(segments, spec)
    assert "\\k" in ass_text

