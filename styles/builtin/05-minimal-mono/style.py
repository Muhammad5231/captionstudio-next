from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class MinimalMonoStyle(CaptionStyle):
    id = "minimal-mono"
    name = "Minimal Mono"
    category = "MINIMAL"
    description = "Crisp monospaced typography styled for developer, tech, and productivity creators."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 34 if not video.is_vertical else 38
        return RenderSpec(
            typography=Typography(
                font_family="Courier New",
                font_size=font_size,
                font_weight="600",
                text_transform="none",
                letter_spacing=1.5,
                line_height=1.3,
            ),
            text_color=Color.hex("#E2E8F0"),
            highlight_color=Color.hex("#22C55E"),
            secondary_color=Color.hex("#38BDF8"),
            stroke_color=Color.hex("#000000"),
            stroke_width=0.0,
            shadow_color=Color.rgba(0, 0, 0, 0.5),
            shadow_blur=6.0,
            shadow_offset_x=1.0,
            shadow_offset_y=2.0,
            background_color=Color.rgba(10, 15, 20, 0.85),
            background_padding_x=18.0,
            background_padding_y=8.0,
            background_border_radius=6.0,
            position=Position(x=50.0, y=84.0, alignment="center"),
            max_words_per_line=6 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="none"),
            display_mode="segment",
        )


style = MinimalMonoStyle()
