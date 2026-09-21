from typing import Union, Literal, Dict, Any, Optional
from apps.api.app.styles.sdk.color import Color
from apps.api.app.styles.sdk.typography import Typography
from apps.api.app.styles.sdk.animation import Animation
from apps.api.app.styles.sdk.context import Position


def _to_color_str(c: Union[Color, str]) -> str:
    if isinstance(c, Color):
        return c.to_css()
    return str(c)


class RenderSpec:
    """
    Complete render specification for captions, compatible with CaptionRenderSpec schema.
    """

    def __init__(
        self,
        typography: Optional[Typography] = None,
        text_color: Union[Color, str] = "#FFFFFF",
        highlight_color: Union[Color, str] = "#FFE600",
        secondary_color: Union[Color, str] = "#00FF88",
        stroke_color: Union[Color, str] = "#000000",
        stroke_width: float = 6.0,
        shadow_color: Union[Color, str] = "rgba(0, 0, 0, 0.8)",
        shadow_blur: float = 8.0,
        shadow_offset_x: float = 2.0,
        shadow_offset_y: float = 4.0,
        background_color: Union[Color, str] = "transparent",
        background_padding_x: float = 16.0,
        background_padding_y: float = 8.0,
        background_border_radius: float = 8.0,
        position: Optional[Position] = None,
        max_words_per_line: int = 4,
        max_lines: int = 2,
        safe_area_margin: float = 5.0,
        animation: Optional[Animation] = None,
        display_mode: Literal["word", "chunk", "segment", "line"] = "segment",
    ):
        self.typography = typography or Typography()
        self.text_color = _to_color_str(text_color)
        self.highlight_color = _to_color_str(highlight_color)
        self.secondary_color = _to_color_str(secondary_color)
        self.stroke_color = _to_color_str(stroke_color)
        self.stroke_width = stroke_width
        self.shadow_color = _to_color_str(shadow_color)
        self.shadow_blur = shadow_blur
        self.shadow_offset_x = shadow_offset_x
        self.shadow_offset_y = shadow_offset_y
        self.background_color = _to_color_str(background_color)
        self.background_padding_x = background_padding_x
        self.background_padding_y = background_padding_y
        self.background_border_radius = background_border_radius
        self.position = position or Position()
        self.max_words_per_line = max_words_per_line
        self.max_lines = max_lines
        self.safe_area_margin = safe_area_margin
        self.animation = animation or Animation()
        self.display_mode = display_mode

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "version": 1,
            "textColor": self.text_color,
            "highlightColor": self.highlight_color,
            "secondaryColor": self.secondary_color,
            "strokeColor": self.stroke_color,
            "strokeWidth": self.stroke_width,
            "shadowColor": self.shadow_color,
            "shadowBlur": self.shadow_blur,
            "shadowOffsetX": self.shadow_offset_x,
            "shadowOffsetY": self.shadow_offset_y,
            "backgroundColor": self.background_color,
            "backgroundPaddingX": self.background_padding_x,
            "backgroundPaddingY": self.background_padding_y,
            "backgroundBorderRadius": self.background_border_radius,
            "maxWordsPerLine": self.max_words_per_line,
            "maxLines": self.max_lines,
            "safeAreaMargin": self.safe_area_margin,
            "displayMode": self.display_mode,
        }
        result.update(self.typography.to_dict())
        result.update(self.position.to_dict())
        result["animation"] = self.animation.to_dict()
        return result
