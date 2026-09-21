from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class ViralMotionStyle(CaptionStyle):
    id = "viral-motion"
    name = "Viral Motion"
    category = "VIRAL_BOLD"
    description = "Ultra-punchy TikTok and Shorts viral style with neon lime active text and massive stroke impact."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 56 if not video.is_vertical else 62
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="900",
                text_transform="uppercase",
                letter_spacing=1.5,
                line_height=1.1,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#CCFF00"),
            secondary_color=Color.hex("#FF0055"),
            stroke_color=Color.hex("#000000"),
            stroke_width=9.0,
            shadow_color=Color.rgba(0, 0, 0, 0.95),
            shadow_blur=14.0,
            shadow_offset_x=3.0,
            shadow_offset_y=6.0,
            background_color="transparent",
            position=Position(x=50.0, y=75.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="word-pop", duration_ms=95, scale=1.28),
            display_mode="chunk",
        )


style = ViralMotionStyle()
