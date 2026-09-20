from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class TimedWord(BaseModel):
    word: str
    start: float
    end: float
    confidence: Optional[float] = None


class TimedSegment(BaseModel):
    start: float
    end: float
    text: str
    words: List[TimedWord] = []


class TranscriptionResult(BaseModel):
    language: str
    duration: float
    segments: List[TimedSegment]


class TranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        initial_prompt: Optional[str] = None,
    ) -> TranscriptionResult:
        """
        Transcribes audio file to word and segment-level timestamped tokens.
        """
        pass
