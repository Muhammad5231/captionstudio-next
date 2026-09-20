import json
import uuid
from pathlib import Path
from typing import Optional, Callable
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.schemas.render_spec import CaptionRenderSpec
from apps.api.app.schemas.export import ExportFormat
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.media.ffmpeg_service import ffmpeg_service
from apps.api.app.services.media.ffprobe_service import ffprobe_service
from apps.api.app.services.rendering.ass_generator import ass_renderer


class ExportService:
    """
    Orchestrates subtitle and video exports across MP4, SRT, VTT, ASS, and JSON formats.
    """

    def __init__(self):
        self._exports_dir = (settings.storage_path / "exports").resolve()
        self._exports_dir.mkdir(parents=True, exist_ok=True)

    def export_srt(self, segments: list, output_path: Path) -> Path:
        """Converts caption segments into standard SubRip (.srt) format."""
        def to_srt_time(sec: float) -> str:
            total_ms = int(round(max(0.0, sec) * 1000))
            ms = total_ms % 1000
            total_s = total_ms // 1000
            s = total_s % 60
            total_m = total_s // 60
            m = total_m % 60
            h = total_m // 60
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

        lines = []
        for idx, seg in enumerate(segments, start=1):
            st = seg.get("start_time", seg.get("start", 0.0))
            et = seg.get("end_time", seg.get("end", 0.0))
            txt = seg.get("text", "")
            lines.append(f"{idx}\n{to_srt_time(st)} --> {to_srt_time(et)}\n{txt}\n")

        output_path.write_text("\n".join(lines), encoding="utf-8")
        return output_path

    def export_vtt(self, segments: list, output_path: Path) -> Path:
        """Converts caption segments into WebVTT (.vtt) format."""
        def to_vtt_time(sec: float) -> str:
            total_ms = int(round(max(0.0, sec) * 1000))
            ms = total_ms % 1000
            total_s = total_ms // 1000
            s = total_s % 60
            total_m = total_s // 60
            m = total_m % 60
            h = total_m // 60
            return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

        lines = ["WEBVTT\n"]
        for idx, seg in enumerate(segments, start=1):
            st = seg.get("start_time", seg.get("start", 0.0))
            et = seg.get("end_time", seg.get("end", 0.0))
            txt = seg.get("text", "")
            lines.append(f"{idx}\n{to_vtt_time(st)} --> {to_vtt_time(et)}\n{txt}\n")

        output_path.write_text("\n".join(lines), encoding="utf-8")
        return output_path

    def export_ass(
        self,
        segments: list,
        spec: CaptionRenderSpec,
        output_path: Path,
        video_width: int = 1920,
        video_height: int = 1080,
    ) -> Path:
        """Generates Advanced SubStation Alpha (.ass) file."""
        content = ass_renderer.generate_ass(
            segments=segments,
            spec=spec,
            video_width=video_width,
            video_height=video_height,
        )
        output_path.write_text(content, encoding="utf-8")
        return output_path

    def export_json(self, track_data: dict, output_path: Path) -> Path:
        """Exports canonical project captions as structured JSON."""
        output_path.write_text(json.dumps(track_data, indent=2), encoding="utf-8")
        return output_path

    def render_mp4(
        self,
        input_video_path: Path,
        segments: list,
        spec: CaptionRenderSpec,
        output_path: Path,
        video_width: int = 1920,
        video_height: int = 1080,
        duration: Optional[float] = None,
        crf: int = 20,
        preset: str = "veryfast",
        progress_callback: Optional[Callable[[float], None]] = None,
    ) -> Path:
        """
        Generates ASS file and burns captions into the video file via FFmpeg.
        """
        temp_ass_path = output_path.with_suffix(".temp.ass")
        try:
            # 1. Generate styled ASS
            self.export_ass(
                segments=segments,
                spec=spec,
                output_path=temp_ass_path,
                video_width=video_width,
                video_height=video_height,
            )

            # 2. Burn subtitles via FFmpeg
            ffmpeg_service.burn_subtitles(
                input_video_path=input_video_path,
                ass_subtitle_path=temp_ass_path,
                output_video_path=output_path,
                duration=duration,
                crf=crf,
                preset=preset,
                progress_callback=progress_callback,
            )

            # 3. Verify output with FFprobe
            meta = ffprobe_service.probe(output_path)
            if not meta.has_video or meta.size_bytes == 0:
                raise RuntimeError("Exported MP4 is corrupt or missing video stream.")

            logger.info("Successfully rendered burned-in MP4: %s (%d bytes)", output_path.name, meta.size_bytes)
            return output_path

        finally:
            if temp_ass_path.exists():
                try:
                    temp_ass_path.unlink()
                except Exception:
                    pass


export_service = ExportService()

