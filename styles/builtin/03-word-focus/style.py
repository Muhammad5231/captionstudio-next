from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class WordFocusStyle(CaptionStyle):
    id = "word-focus"
    name = "Word Focus"
    category = "KINETIC"
    description = "Laser-targeted single-word rapid serial display in the visual focal center."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 64 if not video.is_vertical else 72
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="900",
                text_transform="uppercase",
                letter_spacing=2.0,
                line_height=1.0,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#00FF66"),
            secondary_color=Color.hex("#00E5FF"),
            stroke_color=Color.hex("#000000"),
            stroke_width=7.0,
            shadow_color=Color.rgba(0, 0, 0, 0.8),
            shadow_blur=12.0,
            shadow_offset_x=3.0,
            shadow_offset_y=5.0,
            background_color="transparent",
            position=Position(x=50.0, y=50.0, alignment="center"),
            max_words_per_line=1,
            max_lines=1,
            animation=Animation(animation_type="zoom", duration_ms=90, scale=1.3),
            display_mode="word",
        )


style = WordFocusStyle()
