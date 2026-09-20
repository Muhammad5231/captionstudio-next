from abc import ABC, abstractmethod
from typing import Optional, List
from apps.api.app.services.transcription.base import TimedSegment


class TranslationProvider(ABC):
    @abstractmethod
    def translate(
        self,
        segments: List[TimedSegment],
        source_language: str,
        target_language: str,
    ) -> List[TimedSegment]:
        pass


class LocalTranslationProvider(TranslationProvider):
    """
    Prepared architecture for local offline translation (e.g., MarianMT or NLLB).
    Disabled in Phase 1 without external cloud APIs.
    """

    def translate(
        self,
        segments: List[TimedSegment],
        source_language: str,
        target_language: str,
    ) -> List[TimedSegment]:
        raise NotImplementedError(
            "Local translation provider is reserved for Phase 2/3 and currently disabled."
        )


class TranslationService:
    def __init__(self, provider: Optional[TranslationProvider] = None):
        self.provider = provider or LocalTranslationProvider()

    def translate_segments(
        self,
        segments: List[TimedSegment],
        source_language: str,
        target_language: str,
    ) -> List[TimedSegment]:
        return self.provider.translate(segments, source_language, target_language)


translation_service = TranslationService()

