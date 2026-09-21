from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class NeonEnergyStyle(CaptionStyle):
    id = "neon-energy"
    name = "Neon Energy"
    category = "VIRAL_BOLD"
    description = "Cyberpunk synthwave glow text with intense cyan luminescence and hot magenta accents."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 52 if not video.is_vertical else 58
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="900",
                text_transform="uppercase",
                letter_spacing=1.8,
                line_height=1.15,
            ),
            text_color=Color.hex("#00FFFF"),
            highlight_color=Color.hex("#FF00FF"),
            secondary_color=Color.hex("#FFFF00"),
            stroke_color=Color.hex("#050510"),
            stroke_width=6.0,
            shadow_color=Color.rgba(0, 255, 255, 0.95),
            shadow_blur=24.0,
            shadow_offset_x=0.0,
            shadow_offset_y=0.0,
            background_color="transparent",
            position=Position(x=50.0, y=78.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="karaoke", duration_ms=120, scale=1.2),
            display_mode="chunk",
        )


style = NeonEnergyStyle()
