import pytest
from apps.api.app.schemas.render_spec import (
    CaptionRenderSpec,
    CaptionAnimationType,
    CaptionDisplayMode,
    StyleCategory,
)


def test_caption_render_spec_defaults():
    spec = CaptionRenderSpec()
    assert spec.version == 1
    assert spec.fontFamily == "Montserrat"
    assert spec.fontSize == 42
    assert spec.textColor == "#FFFFFF"
    assert spec.strokeColor == "#000000"
    assert spec.strokeWidth == 6.0
    assert spec.positionY == 80.0
    assert spec.alignment == "center"
    assert spec.displayMode == CaptionDisplayMode.SEGMENT
    assert spec.animation.type == CaptionAnimationType.WORD_POP


def test_to_ass_color_conversions():
    spec = CaptionRenderSpec()

    # Pure white #FFFFFF -> &H00FFFFFF
    assert spec.to_ass_color("#FFFFFF") == "&H00FFFFFF"

    # Pure red #FF0000 -> &H000000FF (ASS is BGR: BB=00, GG=00, RR=FF)
    assert spec.to_ass_color("#FF0000") == "&H000000FF"

    # Cyan #00FFFF -> &H00FFFF00 (BB=FF, GG=FF, RR=00)
    assert spec.to_ass_color("#00FFFF") == "&H00FFFF00"

    # 3-char hex #F00 -> #FF0000 -> &H000000FF
    assert spec.to_ass_color("#F00") == "&H000000FF"

    # Transparent -> &HFF000000 (ASS alpha FF = transparent)
    assert spec.to_ass_color("transparent") == "&HFF000000"

    # RGBA: rgba(255, 255, 255, 0.5) -> alpha ~128 -> &H80FFFFFF
    res = spec.to_ass_color("rgba(255, 255, 255, 0.5)")
    assert res.startswith("&H")
    assert len(res) == 10

