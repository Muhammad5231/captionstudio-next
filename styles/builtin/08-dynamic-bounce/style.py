from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class DynamicBounceStyle(CaptionStyle):
    id = "dynamic-bounce"
    name = "Dynamic Bounce"
    category = "KINETIC"
    description = "Bouncy animated text with warm citrus accent colors and lively momentum."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 48 if not video.is_vertical else 54
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="800",
                text_transform="uppercase",
                letter_spacing=1.0,
                line_height=1.2,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#FF9900"),
            secondary_color=Color.hex("#FFD600"),
            stroke_color=Color.hex("#0F0F1A"),
            stroke_width=6.5,
            shadow_color=Color.rgba(255, 153, 0, 0.4),
            shadow_blur=14.0,
            shadow_offset_x=2.0,
            shadow_offset_y=4.0,
            background_color="transparent",
            position=Position(x=50.0, y=78.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="bounce", duration_ms=140, scale=1.22),
            display_mode="chunk",
        )


style = DynamicBounceStyle()
