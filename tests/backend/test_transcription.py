from apps.api.app.services.transcription.base import (
    TranscriptionProvider,
    TranscriptionResult,
    TimedSegment,
    TimedWord,
)
from apps.api.app.services.transcription.transcription_service import TranscriptionService


class MockWhisperProvider(TranscriptionProvider):
    def transcribe(self, audio_file_path, language=None, initial_prompt=None):
        return TranscriptionResult(
            language="hinglish" if language == "hinglish" else (language or "en"),
            duration=3.5,
            segments=[
                TimedSegment(
                    start=0.5,
                    end=3.2,
                    text="Aaj we are discussing confidence and clarity.",
                    words=[
                        TimedWord(word="Aaj", start=0.5, end=0.8, confidence=0.99),
                        TimedWord(word="we", start=0.82, end=1.0, confidence=0.98),
                        TimedWord(word="are", start=1.02, end=1.2, confidence=0.97),
                        TimedWord(word="discussing", start=1.22, end=1.8, confidence=0.96),
                        TimedWord(word="confidence", start=1.85, end=2.4, confidence=0.98),
                        TimedWord(word="and", start=2.42, end=2.6, confidence=0.99),
                        TimedWord(word="clarity.", start=2.62, end=3.15, confidence=0.97),
                    ]
                )
            ]
        )


def test_transcription_service_mock():
    mock_provider = MockWhisperProvider()
    service = TranscriptionService(provider=mock_provider)

    result = service.transcribe_audio("dummy_path.wav", language="hinglish")
    assert result.language == "hinglish"
    assert len(result.segments) == 1
    assert len(result.segments[0].words) == 7

    # Ensure mixed Roman Hinglish is preserved without forced Devanagari conversion
    assert "Aaj we are discussing" in result.segments[0].text
    assert result.segments[0].words[0].word == "Aaj"
    assert result.segments[0].words[4].word == "confidence"

