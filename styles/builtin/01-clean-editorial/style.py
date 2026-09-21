from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class CleanEditorialStyle(CaptionStyle):
    id = "clean-editorial"
    name = "Clean Editorial"
    category = "MINIMAL"
    description = "Understated elegant sans-serif on a subtle dark slate rounded background pill."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        base_size = 40 if not video.is_vertical else 46
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=base_size,
                font_weight="600",
                text_transform="none",
                letter_spacing=0.5,
                line_height=1.25,
            ),
            text_color=Color.hex("#F8FAFC"),
            highlight_color=Color.hex("#38BDF8"),
            secondary_color=Color.hex("#94A3B8"),
            stroke_color=Color.hex("#000000"),
            stroke_width=0.0,
            shadow_color=Color.rgba(0, 0, 0, 0.4),
            shadow_blur=4.0,
            shadow_offset_x=1.0,
            shadow_offset_y=2.0,
            background_color=Color.rgba(15, 23, 42, 0.78),
            background_padding_x=22.0,
            background_padding_y=10.0,
            background_border_radius=12.0,
            position=Position(x=50.0, y=82.0, alignment="center"),
            max_words_per_line=5 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="fade", duration_ms=140),
            display_mode="segment",
        )


style = CleanEditorialStyle()
