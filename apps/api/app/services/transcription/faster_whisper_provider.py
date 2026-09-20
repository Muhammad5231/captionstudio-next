import os
from pathlib import Path
from typing import Optional, List
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.services.transcription.base import (
    TranscriptionProvider,
    TranscriptionResult,
    TimedSegment,
    TimedWord,
)


class FasterWhisperProvider(TranscriptionProvider):
    """
    Local CTranslate2-based faster-whisper speech-to-text implementation.
    Produces frame-accurate word-level and segment-level timestamps.
    Handles English, Hindi, Gujarati, and Hinglish (mixed spoken languages).
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
    ):
        self.model_name = model_name or settings.WHISPER_MODEL
        self.device = device or settings.WHISPER_DEVICE
        self.compute_type = compute_type or settings.WHISPER_COMPUTE_TYPE
        self.download_root = str(Path(settings.WHISPER_DOWNLOAD_ROOT).resolve())
        self._model = None

    def _load_model(self):
        if self._model is not None:
            return self._model

        logger.info(
            "Loading faster-whisper model '%s' (device: %s, compute_type: %s)...",
            self.model_name,
            self.device,
            self.compute_type,
        )
        from faster_whisper import WhisperModel

        Path(self.download_root).mkdir(parents=True, exist_ok=True)
        self._model = WhisperModel(
            model_size_or_path=self.model_name,
            device=self.device,
            compute_type=self.compute_type,
            download_root=self.download_root,
        )
        logger.info("Faster-whisper model loaded successfully.")
        return self._model

    def transcribe(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        initial_prompt: Optional[str] = None,
    ) -> TranscriptionResult:
        audio_path = str(Path(audio_file_path).resolve())
        if not Path(audio_path).is_file():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        model = self._load_model()

        # Hinglish / mixed language priming prompt:
        # Helps the model preserve Latin alphabet transliterations when mixed with English
        prompt = initial_prompt
        if not prompt and (language in (None, "auto", "hinglish")):
            prompt = "Namaste, hello! Aaj hum baat karenge confidence and learning ke baare mein. Kem cho!"

        # Handle 'auto' or 'hinglish' by letting faster-whisper auto-detect or transcribe
        target_lang = None
        if language and language.lower() not in ("auto", "hinglish"):
            target_lang = language.lower()

        logger.info(
            "Transcribing %s with faster-whisper (lang=%s, prompt=%s)...",
            audio_path,
            target_lang or "auto",
            bool(prompt),
        )

        segments_gen, info = model.transcribe(
            audio_path,
            language=target_lang,
            initial_prompt=prompt,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400),
        )

        detected_lang = target_lang or info.language
        logger.info("Detected language: %s (probability: %.2f)", info.language, info.language_probability)

        parsed_segments: List[TimedSegment] = []

        for seg in segments_gen:
            seg_words: List[TimedWord] = []
            if seg.words:
                for w in seg.words:
                    clean_w = w.word.strip()
                    if clean_w:
                        seg_words.append(
                            TimedWord(
                                word=clean_w,
                                start=round(float(w.start), 3),
                                end=round(float(w.end), 3),
                                confidence=round(float(w.probability), 2) if hasattr(w, "probability") else None,
                            )
                        )

            parsed_segments.append(
                TimedSegment(
                    start=round(float(seg.start), 3),
                    end=round(float(seg.end), 3),
                    text=seg.text.strip(),
                    words=seg_words,
                )
            )

        duration = round(float(info.duration), 2) if hasattr(info, "duration") else 0.0
        return TranscriptionResult(
            language=detected_lang,
            duration=duration,
            segments=parsed_segments,
        )


faster_whisper_provider = FasterWhisperProvider()
