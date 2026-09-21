from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class BoldImpactStyle(CaptionStyle):
    id = "bold-impact"
    name = "Bold Impact"
    category = "VIRAL_BOLD"
    description = "Ultra-bold viral headline typography with thick black stroke and dynamic word popping."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 54 if not video.is_vertical else 60
        return RenderSpec(
            typography=Typography(
                font_family="Impact",
                font_size=font_size,
                font_weight="900",
                text_transform="uppercase",
                letter_spacing=1.0,
                line_height=1.1,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#FFE600"),
            secondary_color=Color.hex("#00F0FF"),
            stroke_color=Color.hex("#000000"),
            stroke_width=8.0,
            shadow_color=Color.rgba(0, 0, 0, 0.9),
            shadow_blur=10.0,
            shadow_offset_x=2.0,
            shadow_offset_y=5.0,
            background_color="transparent",
            position=Position(x=50.0, y=78.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="word-pop", duration_ms=100, scale=1.25),
            display_mode="chunk",
        )


style = BoldImpactStyle()
