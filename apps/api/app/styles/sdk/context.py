from typing import List, Literal, Optional


class Position:
    """
    Subtitles positioning on screen (0-100 percentage).
    """

    def __init__(
        self,
        x: float = 50.0,
        y: float = 80.0,
        alignment: Literal["left", "center", "right"] = "center",
    ):
        self.x = x
        self.y = y
        self.alignment = alignment

    def to_dict(self) -> dict:
        return {
            "positionX": self.x,
            "positionY": self.y,
            "alignment": self.alignment,
        }


class VideoContext:
    """
    Runtime context of the target video.
    """

    def __init__(
        self,
        width: int = 1920,
        height: int = 1080,
        aspect_ratio: str = "16:9",
        safe_area_margin: float = 5.0,
    ):
        self.width = width
        self.height = height
        self.aspect_ratio = aspect_ratio
        self.safe_area_margin = safe_area_margin

    @property
    def is_vertical(self) -> bool:
        return self.height > self.width

    @property
    def is_square(self) -> bool:
        return self.height == self.width


class WordContext:
    """
    Word-level context for active subtitle rendering.
    """

    def __init__(
        self,
        word: str,
        start_time: float,
        end_time: float,
        confidence: float = 1.0,
        word_index: int = 0,
        is_active: bool = False,
    ):
        self.word = word
        self.start_time = start_time
        self.end_time = end_time
        self.confidence = confidence
        self.word_index = word_index
        self.is_active = is_active


class SegmentContext:
    """
    Segment-level caption context.
    """

    def __init__(
        self,
        text: str,
        start_time: float,
        end_time: float,
        words: Optional[List[WordContext]] = None,
    ):
        self.text = text
        self.start_time = start_time
        self.end_time = end_time
        self.words = words or []
