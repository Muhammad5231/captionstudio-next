from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class PremiumSocialStyle(CaptionStyle):
    id = "premium-social"
    name = "Premium Social"
    category = "CREATOR_SOCIAL"
    description = "Modern creator aesthetic with soft dark container and electric blue key word highlights."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 44 if not video.is_vertical else 48
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="700",
                text_transform="none",
                letter_spacing=0.5,
                line_height=1.25,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#60A5FA"),
            secondary_color=Color.hex("#A78BFA"),
            stroke_color=Color.hex("#000000"),
            stroke_width=2.5,
            shadow_color=Color.rgba(0, 0, 0, 0.7),
            shadow_blur=10.0,
            shadow_offset_x=2.0,
            shadow_offset_y=3.0,
            background_color=Color.rgba(0, 0, 0, 0.65),
            background_padding_x=20.0,
            background_padding_y=10.0,
            background_border_radius=14.0,
            position=Position(x=50.0, y=80.0, alignment="center"),
            max_words_per_line=4 if not video.is_vertical else 3,
            max_lines=2,
            animation=Animation(animation_type="word-pop", duration_ms=120, scale=1.15),
            display_mode="segment",
        )


style = PremiumSocialStyle()
