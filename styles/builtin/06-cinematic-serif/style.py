from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class CinematicSerifStyle(CaptionStyle):
    id = "cinematic-serif"
    name = "Cinematic Serif"
    category = "CINEMATIC"
    description = "Letterbox-safe classic cinematic serif subtitles with warm ivory and muted gold accents."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 38 if not video.is_vertical else 42
        return RenderSpec(
            typography=Typography(
                font_family="Georgia",
                font_size=font_size,
                font_weight="700",
                font_style="italic",
                text_transform="none",
                letter_spacing=0.8,
                line_height=1.35,
            ),
            text_color=Color.hex("#FDF6E2"),
            highlight_color=Color.hex("#D4AF37"),
            secondary_color=Color.hex("#E2E8F0"),
            stroke_color=Color.hex("#1C1917"),
            stroke_width=3.5,
            shadow_color=Color.rgba(0, 0, 0, 0.8),
            shadow_blur=12.0,
            shadow_offset_x=2.0,
            shadow_offset_y=3.0,
            background_color="transparent",
            position=Position(x=50.0, y=86.0, alignment="center"),
            max_words_per_line=6 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="fade", duration_ms=180),
            display_mode="segment",
        )


style = CinematicSerifStyle()
