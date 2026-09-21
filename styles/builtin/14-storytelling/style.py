from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class StorytellingStyle(CaptionStyle):
    id = "storytelling"
    name = "Storytelling"
    category = "CREATOR_SOCIAL"
    description = "Narrative-paced warm serif typography with amber highlights inside a soft focus container."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 40 if not video.is_vertical else 44
        return RenderSpec(
            typography=Typography(
                font_family="Georgia",
                font_size=font_size,
                font_weight="600",
                text_transform="none",
                letter_spacing=0.5,
                line_height=1.32,
            ),
            text_color=Color.hex("#F1F5F9"),
            highlight_color=Color.hex("#FBBF24"),
            secondary_color=Color.hex("#FDE68A"),
            stroke_color=Color.hex("#0F172A"),
            stroke_width=2.0,
            shadow_color=Color.rgba(0, 0, 0, 0.6),
            shadow_blur=8.0,
            shadow_offset_x=1.5,
            shadow_offset_y=2.5,
            background_color=Color.rgba(15, 23, 42, 0.65),
            background_padding_x=22.0,
            background_padding_y=10.0,
            background_border_radius=12.0,
            position=Position(x=50.0, y=82.0, alignment="center"),
            max_words_per_line=5 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="fade", duration_ms=160),
            display_mode="segment",
        )


style = StorytellingStyle()
