from pathlib import Path
from typing import Optional, Set
from pydantic import BaseModel
from apps.api.app.core.config import settings
from apps.api.app.services.media.ffprobe_service import ffprobe_service, MediaMetadata
from apps.api.app.core.logging import logger

ALLOWED_VIDEO_EXTENSIONS: Set[str] = {".mp4", ".mov", ".webm", ".mkv", ".avi"}
ALLOWED_SUBTITLE_EXTENSIONS: Set[str] = {".srt", ".vtt", ".ass", ".txt"}

ALLOWED_VIDEO_MIMES: Set[str] = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
    "video/x-msvideo",
    "application/octet-stream",  # Often sent by browsers for mkv/webm
}

ALLOWED_SUBTITLE_MIMES: Set[str] = {
    "text/plain",
    "text/vtt",
    "text/x-ssa",
    "application/x-subrip",
    "application/octet-stream",
}

# Known file signatures (magic bytes)
MAGIC_SIGNATURES = {
    b"PK": "zip_or_office",  # Disallowed for video
    b"\x1f\x8b": "gzip",
    b"MZ": "windows_executable",
}


class ValidationResult(BaseModel):
    is_valid: bool
    error_message: Optional[str] = None
    media_metadata: Optional[MediaMetadata] = None


class MediaValidator:
    """
    7-Level Multi-Tier Media Validator defending against malicious or unsupported uploads.
    """

    def validate_video_file(
        self,
        file_path: Path,
        original_filename: str,
        mime_type: str,
        file_size_bytes: int,
    ) -> ValidationResult:
        # Level 1: Extension check
        ext = Path(original_filename).suffix.lower()
        if ext not in ALLOWED_VIDEO_EXTENSIONS:
            return ValidationResult(
                is_valid=False,
                error_message=f"Unsupported file extension '{ext}'. Supported video formats: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}"
            )

        # Level 2: MIME type check
        if mime_type.lower() not in ALLOWED_VIDEO_MIMES:
            return ValidationResult(
                is_valid=False,
                error_message=f"Invalid MIME type '{mime_type}' for video file."
            )

        # Level 3: Magic signature check
        try:
            with open(file_path, "rb") as f:
                header = f.read(4)
                for sig, danger in MAGIC_SIGNATURES.items():
                    if header.startswith(sig):
                        return ValidationResult(
                            is_valid=False,
                            error_message=f"Dangerous or incompatible binary signature detected ({danger})."
                        )
        except Exception as e:
            return ValidationResult(is_valid=False, error_message=f"Cannot read file header: {e}")

        # Level 5: File size check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size_bytes > max_bytes or file_path.stat().st_size > max_bytes:
            return ValidationResult(
                is_valid=False,
                error_message=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # Level 4: FFprobe container and stream analysis
        try:
            meta = ffprobe_service.probe(file_path)
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                error_message=f"Media analysis failed. File may be corrupted or invalid: {e}"
            )

        if not meta.has_video and not meta.has_audio:
            return ValidationResult(
                is_valid=False,
                error_message="Uploaded container does not contain any valid video or audio stream."
            )

        # Level 6: Duration check
        max_duration_sec = settings.MAX_VIDEO_DURATION_MINUTES * 60
        if meta.duration > max_duration_sec:
            return ValidationResult(
                is_valid=False,
                error_message=f"Media duration ({meta.duration:.1f}s) exceeds maximum allowed duration of {settings.MAX_VIDEO_DURATION_MINUTES} minutes."
            )
        if meta.duration <= 0.05:
            return ValidationResult(
                is_valid=False,
                error_message="Media file duration is too short or invalid (duration <= 0)."
            )

        # Level 7: Resolution check
        if meta.has_video and meta.width and meta.height:
            if meta.width > 7680 or meta.height > 4320:
                return ValidationResult(
                    is_valid=False,
                    error_message=f"Resolution ({meta.width}x{meta.height}) exceeds 8K UHD limit."
                )
            if meta.width < 16 or meta.height < 16:
                return ValidationResult(
                    is_valid=False,
                    error_message=f"Resolution ({meta.width}x{meta.height}) is below minimum supported dimensions."
                )

        return ValidationResult(is_valid=True, media_metadata=meta)

    def validate_subtitle_file(
        self,
        file_path: Path,
        original_filename: str,
        mime_type: str,
        file_size_bytes: int,
    ) -> ValidationResult:
        ext = Path(original_filename).suffix.lower()
        if ext not in ALLOWED_SUBTITLE_EXTENSIONS:
            return ValidationResult(
                is_valid=False,
                error_message=f"Unsupported subtitle format '{ext}'. Supported: {', '.join(sorted(ALLOWED_SUBTITLE_EXTENSIONS))}"
            )

        # Subtitle files shouldn't exceed 20MB
        if file_size_bytes > 20 * 1024 * 1024:
            return ValidationResult(
                is_valid=False,
                error_message="Subtitle file exceeds maximum allowed size of 20MB."
            )

        # Ensure text is readable
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(1024)
                if not content.strip():
                    return ValidationResult(is_valid=False, error_message="Subtitle file is empty.")
        except Exception as e:
            return ValidationResult(is_valid=False, error_message=f"Unable to read subtitle file: {e}")

        return ValidationResult(is_valid=True)


media_validator = MediaValidator()
