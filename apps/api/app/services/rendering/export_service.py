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
        self._temp_dir = (settings.storage_path / "temp").resolve()
        self._temp_dir.mkdir(parents=True, exist_ok=True)
        self.last_output_meta = None
        self.last_input_meta = None

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
        crf: int = 22,
        preset: str = "fast",
        encoder: Optional[str] = None,
        progress_callback: Optional[Callable[[float], None]] = None,
    ) -> Path:
        """
        Two-phase atomic rendering:
        1. Probes input video to inspect streams (including audio safety).
        2. Generates styled ASS subtitles.
        3. Renders directly to a temporary staging path in storage/temp/.
        4. Validates output integrity with FFprobe (container, streams, duration).
        5. Atomically commits to the final destination on success.
        """
        import shutil

        in_p = Path(input_video_path).resolve()
        out_p = Path(output_path).resolve()
        unique_id = uuid.uuid4().hex[:12]
        temp_ass_path = self._temp_dir / f"stage_{unique_id}.ass"
        staging_video_path = self._temp_dir / f"stage_{unique_id}.mp4"

        try:
            # 1. Probe input video
            in_meta = ffprobe_service.probe(in_p)
            self.last_input_meta = in_meta
            vw = video_width or in_meta.width or 1920
            vh = video_height or in_meta.height or 1080
            expected_dur = duration or in_meta.duration

            # 2. Generate styled ASS
            self.export_ass(
                segments=segments,
                spec=spec,
                output_path=temp_ass_path,
                video_width=vw,
                video_height=vh,
            )

            # 3. Burn subtitles into staging video via FFmpeg
            ffmpeg_service.burn_subtitles(
                input_video_path=in_p,
                ass_subtitle_path=temp_ass_path,
                output_video_path=staging_video_path,
                duration=expected_dur,
                crf=crf,
                preset=preset,
                encoder=encoder,
                has_audio=in_meta.has_audio,
                progress_callback=progress_callback,
            )

            # 4. Strict validation of rendered staging file
            out_meta = ffprobe_service.probe(staging_video_path)
            if not out_meta.has_video or out_meta.size_bytes == 0:
                raise RuntimeError("Exported MP4 is corrupt or missing video stream.")

            if expected_dur > 1.0 and abs(out_meta.duration - expected_dur) > 2.0:
                logger.warning(
                    "Export duration divergence: expected %.2fs, got %.2fs",
                    expected_dur,
                    out_meta.duration,
                )

            self.last_output_meta = out_meta

            # 5. Atomic commit to destination
            out_p.parent.mkdir(parents=True, exist_ok=True)
            if out_p.exists():
                out_p.unlink()
            shutil.move(str(staging_video_path), str(out_p))

            logger.info(
                "Successfully rendered burned-in MP4: %s (%d bytes, %.2fs)",
                out_p.name,
                out_meta.size_bytes,
                out_meta.duration,
            )
            return out_p

        finally:
            if temp_ass_path.exists():
                try:
                    temp_ass_path.unlink()
                except Exception:
                    pass
            if staging_video_path.exists():
                try:
                    staging_video_path.unlink()
                except Exception:
                    pass


export_service = ExportService()

