from typing import Literal


class Animation:
    """
    Caption and word animation configuration.
    """

    def __init__(
        self,
        animation_type: Literal[
            "word-pop", "bounce", "fade", "karaoke", "zoom", "slide", "elastic", "none"
        ] = "word-pop",
        duration_ms: int = 120,
        scale: float = 1.15,
    ):
        self.type = animation_type
        self.duration_ms = duration_ms
        self.scale = scale

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "durationMs": self.duration_ms,
            "scale": self.scale,
        }
