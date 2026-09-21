from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class DocumentaryStyle(CaptionStyle):
    id = "documentary"
    name = "Documentary"
    category = "CINEMATIC"
    description = "Non-intrusive broadcast subtitle standard with crisp outline and bottom third alignment."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 36 if not video.is_vertical else 40
        return RenderSpec(
            typography=Typography(
                font_family="Inter",
                font_size=font_size,
                font_weight="600",
                text_transform="none",
                letter_spacing=0.5,
                line_height=1.3,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#FFFFFF"),
            secondary_color=Color.hex("#E2E8F0"),
            stroke_color=Color.hex("#000000"),
            stroke_width=4.0,
            shadow_color=Color.rgba(0, 0, 0, 0.7),
            shadow_blur=4.0,
            shadow_offset_x=1.5,
            shadow_offset_y=2.5,
            background_color="transparent",
            position=Position(x=50.0, y=88.0, alignment="center"),
            max_words_per_line=6 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="none"),
            display_mode="line",
        )


style = DocumentaryStyle()
