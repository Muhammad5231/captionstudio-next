from captionstudio_style_sdk import (
    CaptionStyle,
    RenderSpec,
    Typography,
    Color,
    Animation,
    Position,
    VideoContext,
)


class KineticPunchStyle(CaptionStyle):
    id = "kinetic-punch"
    name = "Kinetic Punch"
    category = "KINETIC"
    description = "High-octane elastic animation with hot-pink accents and explosive transitions."

    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        font_size = 50 if not video.is_vertical else 56
        return RenderSpec(
            typography=Typography(
                font_family="Montserrat",
                font_size=font_size,
                font_weight="900",
                text_transform="uppercase",
                letter_spacing=1.5,
                line_height=1.15,
            ),
            text_color=Color.hex("#FFFFFF"),
            highlight_color=Color.hex("#FF0055"),
            secondary_color=Color.hex("#FFE600"),
            stroke_color=Color.hex("#111111"),
            stroke_width=7.5,
            shadow_color=Color.rgba(255, 0, 85, 0.5),
            shadow_blur=16.0,
            shadow_offset_x=2.0,
            shadow_offset_y=4.0,
            background_color="transparent",
            position=Position(x=50.0, y=76.0, alignment="center"),
            max_words_per_line=3 if video.is_vertical else 4,
            max_lines=2,
            animation=Animation(animation_type="elastic", duration_ms=130, scale=1.22),
            display_mode="chunk",
        )


style = KineticPunchStyle()
