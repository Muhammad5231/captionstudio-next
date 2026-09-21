from typing import Union, Literal


class Typography:
    """
    Typography settings for caption styling.
    """

    def __init__(
        self,
        font_family: str = "Montserrat",
        font_size: int = 42,
        font_weight: Union[str, int] = "800",
        font_style: Literal["normal", "italic"] = "normal",
        text_transform: Literal["none", "uppercase", "lowercase", "capitalize"] = "uppercase",
        letter_spacing: float = 0.0,
        line_height: float = 1.2,
    ):
        self.font_family = font_family
        self.font_size = font_size
        self.font_weight = font_weight
        self.font_style = font_style
        self.text_transform = text_transform
        self.letter_spacing = letter_spacing
        self.line_height = line_height

    def to_dict(self) -> dict:
        return {
            "fontFamily": self.font_family,
            "fontSize": self.font_size,
            "fontWeight": str(self.font_weight),
            "fontStyle": self.font_style,
            "textTransform": self.text_transform,
            "letterSpacing": self.letter_spacing,
            "lineHeight": self.line_height,
        }
