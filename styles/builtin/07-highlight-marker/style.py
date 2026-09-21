from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class HighlightMarkerStyle(CaptionStyle):
    id = "highlight-marker"
    name = "Highlight Marker"
    category = "HIGHLIGHT"
    description = "Fluorescent neon marker backing bar that highlights high-retention keywords."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 46 if not video.is_vertical else 50
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="800",
                text_transform="uppercase",
                letter_spacing=1.0,
                line_height=1.2,
            ),
            text_color=Color.hex("#0F172A"),
            highlight_color=Color.hex("#000000"),
            secondary_color=Color.hex("#1E293B"),
            stroke_color="transparent",
            stroke_width=0.0,
            shadow_color="transparent",
            shadow_blur=0.0,
            background_color=Color.hex("#CCFF00"),
            background_padding_x=22.0,
            background_padding_y=10.0,
            background_border_radius=8.0,
            position=Position(x=50.0, y=78.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="word-pop", duration_ms=110, scale=1.12),
            display_mode="chunk",
        )


style = HighlightMarkerStyle()
