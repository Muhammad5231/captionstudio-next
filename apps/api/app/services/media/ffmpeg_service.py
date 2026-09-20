import subprocess
from pathlib import Path
from typing import List, Optional
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger


class FFmpegService:
    """
    Subprocess-based FFmpeg execution service.
    Guarantees:
    - shell=False strictly enforced
    - Structured argument arrays only (no string concatenation)
    - Validated parameters
    """

    def __init__(self, ffmpeg_path: Optional[str] = None):
        self._custom_path = ffmpeg_path

    @property
    def binary(self) -> str:
        return settings.resolve_binary("ffmpeg", self._custom_path)

    def run_command(self, args: List[str], timeout: int = 300) -> subprocess.CompletedProcess:
        full_cmd = [self.binary, "-y", "-hide_banner"] + args
        logger.debug("Executing FFmpeg command: %s", " ".join(full_cmd))

        try:
            result = subprocess.run(
                full_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
                timeout=timeout,
            )
            return result
        except subprocess.CalledProcessError as e:
            logger.error("FFmpeg command failed with code %d: %s", e.returncode, e.stderr)
            raise RuntimeError(f"FFmpeg process failed: {e.stderr.strip() or 'Unknown error'}")
        except subprocess.TimeoutExpired:
            logger.error("FFmpeg process timed out after %d seconds", timeout)
            raise TimeoutError("FFmpeg execution timed out.")

    def extract_audio(
        self,
        input_media_path: Path | str,
        output_audio_path: Path | str,
        sample_rate: int = 16000,
        channels: int = 1,
    ) -> Path:
        """
        Extract audio track to 16kHz mono 16-bit PCM WAV (ideal for faster-whisper).
        """
        in_p = Path(input_media_path).resolve()
        out_p = Path(output_audio_path).resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)

        args = [
            "-i", str(in_p),
            "-vn",  # No video
            "-acodec", "pcm_s16le",  # Uncompressed 16-bit PCM
            "-ar", str(sample_rate),
            "-ac", str(channels),
            str(out_p)
        ]

        self.run_command(args)
        if not out_p.is_file() or out_p.stat().st_size == 0:
            raise RuntimeError("Audio extraction failed: output file is missing or empty.")
        return out_p

    def generate_chroma_background_video(
        self,
        output_video_path: Path | str,
        color_hex: str = "#00FF00",
        duration: float = 10.0,
        width: int = 1920,
        height: int = 1080,
        fps: int = 30,
    ) -> Path:
        """
        Generates a solid color chroma-key canvas video (e.g. Green or Blue screen)
        for subtitle-only preview workflows.
        """
        out_p = Path(output_video_path).resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)

        # Validate hex color
        clean_color = color_hex.strip()
        if not clean_color.startswith("#"):
            clean_color = f"#{clean_color}"
        if len(clean_color) not in (7, 9):
            clean_color = "#00FF00"

        args = [
            "-f", "lavfi",
            "-i", f"color=c={clean_color}:s={width}x{height}:r={fps}:d={duration}",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-t", str(duration),
            str(out_p)
        ]

        self.run_command(args)
        return out_p


ffmpeg_service = FFmpegService()

