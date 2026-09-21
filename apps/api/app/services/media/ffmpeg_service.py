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

    _cached_encoders: Optional[List[str]] = None

    def get_available_encoders(self) -> List[str]:
        """Discovers available H.264 video encoders from local FFmpeg binary."""
        if self._cached_encoders is not None:
            return self._cached_encoders
        try:
            res = subprocess.run(
                [self.binary, "-encoders"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False,
                timeout=5,
            )
            encoders = []
            output = res.stdout
            if "h264_nvenc" in output:
                encoders.append("h264_nvenc")
            if "h264_amf" in output:
                encoders.append("h264_amf")
            if "h264_videotoolbox" in output:
                encoders.append("h264_videotoolbox")
            if "libx264" in output or not encoders:
                encoders.append("libx264")
            self._cached_encoders = encoders
            return encoders
        except Exception as e:
            logger.warning("Failed to probe FFmpeg encoders: %s", e)
            self._cached_encoders = ["libx264"]
            return ["libx264"]

    def detect_best_encoder(self) -> str:
        """Returns the optimal encoder: hardware GPU if available, else libx264."""
        available = self.get_available_encoders()
        for preferred in ("h264_nvenc", "h264_amf", "h264_videotoolbox"):
            if preferred in available:
                return preferred
        return "libx264"

    def burn_subtitles(
        self,
        input_video_path: Path | str,
        ass_subtitle_path: Path | str,
        output_video_path: Path | str,
        fonts_dir: Optional[Path | str] = None,
        duration: Optional[float] = None,
        crf: int = 22,
        preset: str = "fast",
        encoder: Optional[str] = None,
        has_audio: bool = True,
        progress_callback: Optional[object] = None,
        timeout: int = 900,
    ) -> Path:
        """
        Burns styled ASS subtitles directly into video frames with font resolution,
        safe audio passthrough, hardware encoder support, and real-time progress callbacks.
        """
        import re

        in_p = Path(input_video_path).resolve()
        sub_p = Path(ass_subtitle_path).resolve()
        out_p = Path(output_video_path).resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)

        if not in_p.is_file():
            raise FileNotFoundError(f"Input video not found: {in_p}")
        if not sub_p.is_file():
            raise FileNotFoundError(f"ASS subtitle file not found: {sub_p}")

        # Windows-safe path escaping for FFmpeg filtergraph (handles spaces, colons, backslashes)
        def escape_path(p: Path) -> str:
            s = str(p.resolve()).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
            return f"'{s}'"

        escaped_sub = escape_path(sub_p)
        f_dir = Path(fonts_dir or settings.data_dir / "fonts").resolve()
        escaped_fonts = escape_path(f_dir)

        filter_arg = f"subtitles={escaped_sub}:fontsdir={escaped_fonts}"

        target_encoder = encoder or "libx264"
        available_encoders = self.get_available_encoders()
        if target_encoder not in available_encoders:
            target_encoder = "libx264"

        def build_args(enc: str) -> List[str]:
            cmd = ["-i", str(in_p), "-vf", filter_arg]
            if enc == "h264_nvenc":
                cmd.extend(["-c:v", "h264_nvenc", "-preset", "p4", "-cq", str(crf)])
            elif enc == "h264_amf":
                cmd.extend(["-c:v", "h264_amf", "-quality", "speed", "-rc", "cqp", "-qp_i", str(crf), "-qp_p", str(crf)])
            elif enc == "h264_videotoolbox":
                cmd.extend(["-c:v", "h264_videotoolbox", "-q:v", str(crf)])
            else:
                cmd.extend(["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p"])

            if has_audio:
                cmd.extend(["-c:a", "copy"])
            else:
                cmd.extend(["-an"])

            cmd.append(str(out_p))
            return cmd

        def execute_ffmpeg(args: List[str]) -> None:
            full_cmd = [self.binary, "-y", "-hide_banner"] + args
            logger.info("Executing burn_subtitles: %s", " ".join(full_cmd))

            proc = subprocess.Popen(
                full_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            time_regex = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")
            total_duration = duration or 0.0

            stderr_lines = []
            if proc.stderr:
                for line in iter(proc.stderr.readline, ""):
                    stderr_lines.append(line)
                    if progress_callback and callable(progress_callback) and total_duration > 0:
                        match = time_regex.search(line)
                        if match:
                            h = int(match.group(1))
                            m = int(match.group(2))
                            s = float(match.group(3))
                            current_sec = h * 3600 + m * 60 + s
                            pct = min(99.0, max(0.0, (current_sec / total_duration) * 100.0))
                            progress_callback(pct)

            proc.wait(timeout=timeout)
            if proc.returncode != 0:
                err_msg = "".join(stderr_lines[-20:]) if stderr_lines else "Unknown FFmpeg error"
                raise RuntimeError(f"FFmpeg subtitle burn-in failed: {err_msg}")

        # Try with target encoder; if hardware acceleration fails, fallback to libx264
        try:
            execute_ffmpeg(build_args(target_encoder))
        except Exception as e:
            if target_encoder != "libx264":
                logger.warning("Hardware encoder %s failed (%s). Falling back to libx264...", target_encoder, e)
                target_encoder = "libx264"
                execute_ffmpeg(build_args("libx264"))
            else:
                raise

        if progress_callback and callable(progress_callback):
            progress_callback(100.0)

        if not out_p.is_file() or out_p.stat().st_size == 0:
            raise RuntimeError("Rendered video file is missing or empty.")

        return out_p


ffmpeg_service = FFmpegService()


