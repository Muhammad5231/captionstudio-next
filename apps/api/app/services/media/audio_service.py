import uuid
from pathlib import Path
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.media.ffmpeg_service import ffmpeg_service
from apps.api.app.core.logging import logger


class AudioExtractionService:
    """
    Extracts 16kHz mono WAV audio tracks from media assets for local Whisper transcription.
    """

    def extract_audio_for_transcription(self, video_storage_key: str) -> str:
        """
        Extracts audio from video key, saves into storage/audio/{id}.wav,
        and returns the new audio storage_key.
        """
        video_path = storage_service.resolve_key(video_storage_key)
        audio_id = uuid.uuid4().hex[:12]
        audio_storage_key = f"audio/{audio_id}_extracted.wav"
        output_path = storage_service.resolve_key(audio_storage_key)

        logger.info("Extracting audio from %s to %s", video_storage_key, audio_storage_key)
        ffmpeg_service.extract_audio(
            input_media_path=video_path,
            output_audio_path=output_path,
            sample_rate=16000,
            channels=1,
        )

        return audio_storage_key


audio_extraction_service = AudioExtractionService()
