from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class LuxuryGoldStyle(CaptionStyle):
    id = "luxury-gold"
    name = "Luxury Gold"
    category = "CINEMATIC"
    description = "Prestige champagne and metallic gold typography tailored for high-ticket and luxury brands."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 42 if not video.is_vertical else 46
        return RenderSpec(
            typography=Typography(
                font_family="Georgia",
                font_size=font_size,
                font_weight="700",
                text_transform="uppercase",
                letter_spacing=3.0,
                line_height=1.3,
            ),
            text_color=Color.hex("#FBF5B7"),
            highlight_color=Color.hex("#E6CA65"),
            secondary_color=Color.hex("#D4AF37"),
            stroke_color=Color.hex("#2A2005"),
            stroke_width=3.5,
            shadow_color=Color.rgba(212, 175, 55, 0.4),
            shadow_blur=16.0,
            shadow_offset_x=2.0,
            shadow_offset_y=3.0,
            background_color="transparent",
            position=Position(x=50.0, y=82.0, alignment="center"),
            max_words_per_line=4 if not video.is_vertical else 3,
            max_lines=2,
            animation=Animation(animation_type="fade", duration_ms=180),
            display_mode="segment",
        )


style = LuxuryGoldStyle()
