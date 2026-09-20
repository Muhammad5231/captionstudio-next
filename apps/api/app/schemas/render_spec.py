import re
from enum import Enum
from typing import Literal, Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field, ConfigDict


class CaptionAnimationType(str, Enum):
    NONE = "none"
    WORD_POP = "word-pop"
    BOUNCE = "bounce"
    FADE = "fade"
    KARAOKE = "karaoke"
    ZOOM = "zoom"
    SLIDE = "slide"
    ELASTIC = "elastic"


class CaptionDisplayMode(str, Enum):
    WORD = "word"        # 1 word at a time
    CHUNK = "chunk"      # 2-3 words at a time
    SEGMENT = "segment"  # Full segment
    LINE = "line"        # Line by line


class StyleCategory(str, Enum):
    VIRAL_BOLD = "VIRAL_BOLD"
    MINIMAL = "MINIMAL"
    KINETIC = "KINETIC"
    HIGHLIGHT = "HIGHLIGHT"
    CINEMATIC = "CINEMATIC"
    CREATOR_SOCIAL = "CREATOR_SOCIAL"


class AnimationConfig(BaseModel):
    type: CaptionAnimationType = CaptionAnimationType.WORD_POP
    durationMs: int = Field(default=120, ge=0, le=1000)
    scale: float = Field(default=1.15, ge=1.0, le=2.0)


class CaptionRenderSpec(BaseModel):
    version: Literal[1] = 1

    # Typography
    fontFamily: str = "Montserrat"
    fontSize: int = Field(default=42, ge=10, le=200)  # Reference size at 1080p
    fontWeight: Union[str, int] = "800"
    fontStyle: Literal["normal", "italic"] = "normal"
    textTransform: Literal["none", "uppercase", "lowercase", "capitalize"] = "uppercase"
    letterSpacing: float = 0.0
    lineHeight: float = 1.2

    # Colors & Styling
    textColor: str = "#FFFFFF"
    highlightColor: str = "#FFE600"  # Active word color
    secondaryColor: str = "#00FF88"  # Accent color
    strokeColor: str = "#000000"
    strokeWidth: float = Field(default=6.0, ge=0.0, le=30.0)
    shadowColor: str = "rgba(0, 0, 0, 0.8)"
    shadowBlur: float = Field(default=8.0, ge=0.0, le=50.0)
    shadowOffsetX: float = 2.0
    shadowOffsetY: float = 4.0

    # Background Box
    backgroundColor: str = "transparent"
    backgroundPaddingX: float = Field(default=16.0, ge=0.0)
    backgroundPaddingY: float = Field(default=8.0, ge=0.0)
    backgroundBorderRadius: float = Field(default=8.0, ge=0.0)

    # Position & Alignment
    positionY: float = Field(default=80.0, ge=0.0, le=100.0)  # % from top
    positionX: float = Field(default=50.0, ge=0.0, le=100.0)  # % from left
    alignment: Literal["left", "center", "right"] = "center"

    # Layout Limits
    maxWordsPerLine: int = Field(default=4, ge=1, le=15)
    maxLines: int = Field(default=2, ge=1, le=5)
    safeAreaMargin: float = Field(default=5.0, ge=0.0, le=30.0)

    # Animation & Display
    animation: AnimationConfig = Field(default_factory=AnimationConfig)
    displayMode: CaptionDisplayMode = CaptionDisplayMode.SEGMENT

    def to_ass_color(self, color_str: str, default_bgr: str = "FFFFFF", default_alpha: str = "00") -> str:
        """
        Converts Hex/RGBA string to ASS &HAABBGGRR format.
        ASS color notation: &H[AA][BB][GG][RR]
        Note: ASS Alpha 00 = completely opaque, FF = completely transparent (inverse of standard alpha).
        """
        if not color_str or color_str.lower() == "transparent":
            return "&HFF000000"

        # Check for rgba(r, g, b, a)
        rgba_match = re.match(r"rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)", color_str)
        if rgba_match:
            r = int(rgba_match.group(1))
            g = int(rgba_match.group(2))
            b = int(rgba_match.group(3))
            a_val = float(rgba_match.group(4)) if rgba_match.group(4) is not None else 1.0
            ass_alpha = int(round((1.0 - a_val) * 255))
            return f"&H{ass_alpha:02X}{b:02X}{g:02X}{r:02X}"

        clean = color_str.lstrip("#").strip()
        if len(clean) == 3:  # e.g. #FFF
            r = int(clean[0] * 2, 16)
            g = int(clean[1] * 2, 16)
            b = int(clean[2] * 2, 16)
            return f"&H{default_alpha}{b:02X}{g:02X}{r:02X}"
        elif len(clean) == 6:  # e.g. #FFFFFF
            r = int(clean[0:2], 16)
            g = int(clean[2:4], 16)
            b = int(clean[4:6], 16)
            return f"&H{default_alpha}{b:02X}{g:02X}{r:02X}"
        elif len(clean) == 8:  # e.g. #FFFFFFFF (RRGGBBAA)
            r = int(clean[0:2], 16)
            g = int(clean[2:4], 16)
            b = int(clean[4:6], 16)
            std_alpha = int(clean[6:8], 16) / 255.0
            ass_alpha = int(round((1.0 - std_alpha) * 255))
            return f"&H{ass_alpha:02X}{b:02X}{g:02X}{r:02X}"

        return f"&H{default_alpha}{default_bgr}"


class StyleTemplate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: StyleCategory
    description: str
    renderSpec: CaptionRenderSpec
    thumbnailCss: Optional[Dict[str, str]] = None
    tags: List[str] = []

