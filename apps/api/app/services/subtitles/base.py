from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel
from apps.api.app.services.transcription.base import TimedSegment, TimedWord


class ParsedSubtitleResult(BaseModel):
    format: str
    has_timing: bool
    requires_alignment: bool = False
    segments: List[TimedSegment] = []
    raw_text: Optional[str] = None
    warning: Optional[str] = None


class BaseSubtitleParser(ABC):
    @abstractmethod
    def parse(self, file_content: str) -> ParsedSubtitleResult:
        pass


def interpolate_word_timestamps(
    start: float, end: float, text: str
) -> List[TimedWord]:
    """
    Interpolate approximate word timestamps across a timed segment when words
    are not individually timestamped in the source subtitle file (e.g. SRT, VTT, ASS).
    """
    words = text.strip().split()
    if not words:
        return []

    duration = max(0.01, end - start)
    total_chars = sum(len(w) for w in words)
    if total_chars == 0:
        total_chars = len(words)

    result: List[TimedWord] = []
    current_time = start

    for w in words:
        # Allocate duration proportional to word character length
        weight = len(w) / total_chars
        w_duration = duration * weight
        w_start = current_time
        w_end = min(end, current_time + w_duration)
        result.append(
            TimedWord(
                word=w,
                start=round(w_start, 3),
                end=round(w_end, 3),
            )
        )
        current_time = w_end

    return result
