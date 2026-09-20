from typing import Optional
from apps.api.app.services.transcription.base import TranscriptionProvider, TranscriptionResult
from apps.api.app.services.transcription.faster_whisper_provider import faster_whisper_provider


class TranscriptionService:
    """
    High-level transcription service coordinating STT engine providers.
    """

    def __init__(self, provider: Optional[TranscriptionProvider] = None):
        self.provider = provider or faster_whisper_provider

    def transcribe_audio(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        initial_prompt: Optional[str] = None,
    ) -> TranscriptionResult:
        return self.provider.transcribe(
            audio_file_path=audio_file_path,
            language=language,
            initial_prompt=initial_prompt,
        )


transcription_service = TranscriptionService()

