from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class PodcastProStyle(CaptionStyle):
    id = "podcast-pro"
    name = "Podcast Pro"
    category = "CREATOR_SOCIAL"
    description = "Broadcast-ready podcast layout with balanced two-line readability and studio cyan accents."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 40 if not video.is_vertical else 46
        return RenderSpec(
            typography=Typography(
                font_family="Inter",
                font_size=font_size,
                font_weight="700",
                text_transform="none",
                letter_spacing=0.5,
                line_height=1.35,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#06B6D4"),
            secondary_color=Color.hex("#94A3B8"),
            stroke_color=Color.hex("#000000"),
            stroke_width=5.0,
            shadow_color=Color.rgba(0, 0, 0, 0.8),
            shadow_blur=8.0,
            shadow_offset_x=2.0,
            shadow_offset_y=3.0,
            background_color="transparent",
            position=Position(x=50.0, y=82.0, alignment="center"),
            max_words_per_line=5 if not video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="word-pop", duration_ms=100, scale=1.14),
            display_mode="segment",
        )


style = PodcastProStyle()
