import json
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger


class MediaMetadata(BaseModel):
    duration: float
    format_name: str
    size_bytes: int
    bitrate: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    video_codec: Optional[str] = None
    has_video: bool = False
    audio_codec: Optional[str] = None
    audio_sample_rate: Optional[int] = None
    audio_channels: Optional[int] = None
    has_audio: bool = False


class FFprobeService:
    """
    Subprocess-based FFprobe metadata extractor returning structured machine-readable media specifications.
    """

    def __init__(self, ffprobe_path: Optional[str] = None):
        self._custom_path = ffprobe_path

    @property
    def binary(self) -> str:
        return settings.resolve_binary("ffprobe", self._custom_path)

    def probe(self, file_path: Path | str) -> MediaMetadata:
        path_str = str(Path(file_path).resolve())
        if not Path(path_str).is_file():
            raise FileNotFoundError(f"Media file not found: {path_str}")

        cmd = [
            self.binary,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            path_str
        ]

        try:
            res = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
                timeout=30,
            )
            data: Dict[str, Any] = json.loads(res.stdout)
        except subprocess.CalledProcessError as e:
            logger.error("FFprobe failed on %s: %s", path_str, e.stderr)
            raise ValueError(f"Failed to probe media file: {e.stderr.strip() or 'Invalid container'}")
        except json.JSONDecodeError as e:
            logger.error("FFprobe returned non-JSON output: %s", e)
            raise ValueError("Corrupt metadata returned from FFprobe.")

        # Parse format
        fmt = data.get("format", {})
        duration = float(fmt.get("duration", 0.0))
        size_bytes = int(fmt.get("size", 0))
        bitrate = int(fmt.get("bit_rate")) if fmt.get("bit_rate") else None
        format_name = fmt.get("format_name", "unknown")

        # Parse streams
        streams = data.get("streams", [])
        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

        width = None
        height = None
        fps = None
        video_codec = None
        has_video = video_stream is not None

        if video_stream:
            width = int(video_stream.get("width", 0)) or None
            height = int(video_stream.get("height", 0)) or None
            video_codec = video_stream.get("codec_name")
            # Calculate FPS from r_frame_rate e.g. "30/1" or "30000/1001"
            r_fps = video_stream.get("r_frame_rate", "")
            if "/" in r_fps:
                num, den = r_fps.split("/")
                if float(den) > 0:
                    fps = round(float(num) / float(den), 2)

        has_audio = audio_stream is not None
        audio_codec = None
        audio_sample_rate = None
        audio_channels = None

        if audio_stream:
            audio_codec = audio_stream.get("codec_name")
            audio_sample_rate = int(audio_stream.get("sample_rate", 0)) or None
            audio_channels = int(audio_stream.get("channels", 0)) or None

        return MediaMetadata(
            duration=duration,
            format_name=format_name,
            size_bytes=size_bytes,
            bitrate=bitrate,
            width=width,
            height=height,
            fps=fps,
            video_codec=video_codec,
            has_video=has_video,
            audio_codec=audio_codec,
            audio_sample_rate=audio_sample_rate,
            audio_channels=audio_channels,
            has_audio=has_audio,
        )


ffprobe_service = FFprobeService()
