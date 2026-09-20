import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, AsyncGenerator
from sqlalchemy.orm import Session
from apps.api.app.database.session import SessionLocal
from apps.api.app.database.models import (
    Job,
    Project,
    ProjectAsset,
    CaptionTrack,
    CaptionSegment,
    CaptionWord,
    utc_now,
)
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.media.ffprobe_service import ffprobe_service
from apps.api.app.services.media.audio_service import audio_extraction_service
from apps.api.app.services.media.ffmpeg_service import ffmpeg_service
from apps.api.app.services.transcription.transcription_service import transcription_service
from apps.api.app.services.subtitles.subtitle_service import subtitle_service
from apps.api.app.services.captions.grouping_service import caption_grouping_service
from apps.api.app.schemas.job import JobProgressEvent
from apps.api.app.core.logging import logger


class JobManager:
    """
    SQLite-backed local asynchronous job manager with SSE event streaming.
    Executes heavy media processing, transcription, and caption generation in background tasks.
    """

    def __init__(self):
        # Maps job_id -> list of asyncio.Queue for live SSE event broadcast
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        self._tasks: Dict[str, asyncio.Task] = {}

    def subscribe(self, job_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        if job_id not in self._subscribers:
            self._subscribers[job_id] = []
        self._subscribers[job_id].append(q)
        return q

    def unsubscribe(self, job_id: str, q: asyncio.Queue):
        if job_id in self._subscribers and q in self._subscribers[job_id]:
            self._subscribers[job_id].remove(q)
            if not self._subscribers[job_id]:
                del self._subscribers[job_id]

    async def broadcast_progress(
        self,
        job_id: str,
        project_id: str,
        status: str,
        stage: str,
        progress: float,
        message: str,
        error: Optional[str] = None,
    ):
        event = JobProgressEvent(
            job_id=job_id,
            project_id=project_id,
            status=status,
            stage=stage,
            progress=round(progress, 1),
            message=message,
            error=error,
        )

        # Update Database
        db: Session = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = status
                job.stage = stage
                job.progress = progress
                job.message = message
                if error:
                    job.error_details = error
                if status == "PROCESSING" and not job.started_at:
                    job.started_at = utc_now()
                elif status in ("COMPLETED", "FAILED", "CANCELLED"):
                    job.completed_at = utc_now()
                db.commit()
        except Exception as e:
            logger.error("Failed to update job %s in DB: %s", job_id, e)
            db.rollback()
        finally:
            db.close()

        # Notify active SSE subscribers
        subscribers = self._subscribers.get(job_id, [])
        for q in subscribers:
            await q.put(event)

    def create_job(self, db: Session, project_id: str, job_type: str) -> Job:
        job = Job(
            id=str(uuid.uuid4()),
            project_id=project_id,
            job_type=job_type,
            status="QUEUED",
            stage="Queued",
            progress=0.0,
            message="Job queued for background processing",
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def start_pipeline_task(
        self,
        job_id: str,
        project_id: str,
        pipeline_type: str,
        **kwargs,
    ):
        task = asyncio.create_task(
            self._run_pipeline(job_id, project_id, pipeline_type, **kwargs)
        )
        self._tasks[job_id] = task

    async def _run_pipeline(
        self,
        job_id: str,
        project_id: str,
        pipeline_type: str,
        **kwargs,
    ):
        logger.info("Starting pipeline %s for project %s (job %s)", pipeline_type, project_id, job_id)
        try:
            if pipeline_type == "VIDEO_TRANSCRIPTION":
                await self._process_video_transcription(job_id, project_id, kwargs.get("video_asset_id"), kwargs.get("language"))
            elif pipeline_type == "SUBTITLE_IMPORT":
                await self._process_subtitle_import(job_id, project_id, kwargs.get("subtitle_asset_id"), kwargs.get("chroma_color", "#00FF00"))
            elif pipeline_type == "VIDEO_WITH_SUBTITLE":
                await self._process_video_with_subtitle(job_id, project_id, kwargs.get("video_asset_id"), kwargs.get("subtitle_asset_id"))
            else:
                raise ValueError(f"Unknown pipeline type: {pipeline_type}")
        except Exception as e:
            logger.exception("Pipeline failed for project %s: %s", project_id, e)
            db: Session = SessionLocal()
            try:
                proj = db.query(Project).filter(Project.id == project_id).first()
                if proj:
                    proj.status = "FAILED"
                    db.commit()
            finally:
                db.close()
            await self.broadcast_progress(
                job_id=job_id,
                project_id=project_id,
                status="FAILED",
                stage="Failed",
                progress=100.0,
                message=f"Pipeline error: {str(e)}",
                error=str(e),
            )

    async def _process_video_transcription(
        self,
        job_id: str,
        project_id: str,
        video_asset_id: str,
        language: Optional[str] = None,
    ):
        db: Session = SessionLocal()
        try:
            asset = db.query(ProjectAsset).filter(ProjectAsset.id == video_asset_id).first()
            project = db.query(Project).filter(Project.id == project_id).first()
            if not asset or not project:
                raise ValueError("Project or video asset not found.")

            project.status = "PROCESSING"
            db.commit()

            video_path = storage_service.resolve_key(asset.storage_key)

            # Stage 1: Media Analysis
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "MEDIA_ANALYSIS", 15.0, "Analyzing media container & streams...")
            meta = await asyncio.to_thread(ffprobe_service.probe, video_path)

            project.duration = meta.duration
            project.width = meta.width
            project.height = meta.height
            asset.duration = meta.duration
            asset.width = meta.width
            asset.height = meta.height
            db.commit()

            # Stage 2: Audio Extraction
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "AUDIO_EXTRACTION", 35.0, "Extracting audio track...")
            audio_key = await asyncio.to_thread(audio_extraction_service.extract_audio_for_transcription, asset.storage_key)

            # Register audio asset
            audio_path = storage_service.resolve_key(audio_key)
            audio_asset = ProjectAsset(
                id=str(uuid.uuid4()),
                project_id=project_id,
                type="AUDIO",
                original_filename=f"{asset.original_filename}_audio.wav",
                mime_type="audio/wav",
                size=audio_path.stat().st_size,
                storage_key=audio_key,
                duration=meta.duration,
            )
            db.add(audio_asset)
            db.commit()

            # Stage 3: Transcription
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "TRANSCRIPTION", 60.0, "Transcribing speech with local faster-whisper...")
            trans_result = await asyncio.to_thread(
                transcription_service.transcribe_audio,
                audio_file_path=str(audio_path),
                language=language,
            )

            project.language = trans_result.language
            db.commit()

            # Stage 4: Caption Generation & Grouping
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "CAPTION_GENERATION", 85.0, "Structuring and grouping caption segments...")
            grouped_segments = caption_grouping_service.group_raw_segments(trans_result.segments)

            # Save canonical caption track
            track = CaptionTrack(
                id=str(uuid.uuid4()),
                project_id=project_id,
                name=f"Auto Captions ({trans_result.language})",
                language=trans_result.language,
                is_default=True,
            )
            db.add(track)
            db.flush()

            for s_idx, seg in enumerate(grouped_segments):
                c_seg = CaptionSegment(
                    id=str(uuid.uuid4()),
                    track_id=track.id,
                    segment_index=s_idx,
                    start_time=seg.start,
                    end_time=seg.end,
                    text=seg.text,
                )
                db.add(c_seg)
                db.flush()

                for w_idx, w in enumerate(seg.words):
                    c_word = CaptionWord(
                        id=str(uuid.uuid4()),
                        segment_id=c_seg.id,
                        word_index=w_idx,
                        word=w.word,
                        start_time=w.start,
                        end_time=w.end,
                        confidence=w.confidence,
                    )
                    db.add(c_word)

            project.status = "READY"
            db.commit()

            # Stage 5: Done
            await self.broadcast_progress(job_id, project_id, "COMPLETED", "COMPLETED", 100.0, f"Captions generated successfully ({len(grouped_segments)} segments).")

        finally:
            db.close()

    async def _process_subtitle_import(
        self,
        job_id: str,
        project_id: str,
        subtitle_asset_id: str,
        chroma_color: str = "#00FF00",
    ):
        db: Session = SessionLocal()
        try:
            asset = db.query(ProjectAsset).filter(ProjectAsset.id == subtitle_asset_id).first()
            project = db.query(Project).filter(Project.id == project_id).first()
            if not asset or not project:
                raise ValueError("Project or subtitle asset not found.")

            project.status = "PROCESSING"
            db.commit()

            sub_path = storage_service.resolve_key(asset.storage_key)

            # Stage 1: Subtitle Import & Parsing
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "SUBTITLE_IMPORT", 30.0, "Parsing subtitle file...")
            parsed = await asyncio.to_thread(subtitle_service.parse_file, sub_path, asset.original_filename)

            if parsed.requires_alignment or not parsed.has_timing:
                # Honestly flag plain text transcripts
                project.status = "READY"
                db.commit()
                await self.broadcast_progress(
                    job_id, project_id, "COMPLETED", "SUBTITLE_IMPORT", 100.0,
                    "Transcript imported. Note: Plain text lacks timing data and requires speech alignment."
                )
                return

            # Stage 2: Caption Generation
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "CAPTION_GENERATION", 60.0, "Generating canonical caption track...")
            track = CaptionTrack(
                id=str(uuid.uuid4()),
                project_id=project_id,
                name=f"Imported Subtitles ({parsed.format})",
                language=project.language or "en",
                is_default=True,
            )
            db.add(track)
            db.flush()

            max_time = 5.0
            for s_idx, seg in enumerate(parsed.segments):
                if seg.end > max_time:
                    max_time = seg.end
                c_seg = CaptionSegment(
                    id=str(uuid.uuid4()),
                    track_id=track.id,
                    segment_index=s_idx,
                    start_time=seg.start,
                    end_time=seg.end,
                    text=seg.text,
                )
                db.add(c_seg)
                db.flush()

                for w_idx, w in enumerate(seg.words):
                    c_word = CaptionWord(
                        id=str(uuid.uuid4()),
                        segment_id=c_seg.id,
                        word_index=w_idx,
                        word=w.word,
                        start_time=w.start,
                        end_time=w.end,
                    )
                    db.add(c_word)

            project.duration = round(max_time + 1.0, 2)
            project.width = 1920
            project.height = 1080
            db.commit()

            # Stage 3: Generate Chroma Background Video for Subtitle-Only Preview
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "MEDIA_ANALYSIS", 80.0, "Creating chroma canvas preview video...")
            chroma_filename = f"chroma_{uuid.uuid4().hex[:8]}.mp4"
            chroma_key = f"renders/{chroma_filename}"
            chroma_path = storage_service.resolve_key(chroma_key)

            await asyncio.to_thread(
                ffmpeg_service.generate_chroma_background_video,
                output_video_path=chroma_path,
                color_hex=chroma_color,
                duration=project.duration,
                width=project.width,
                height=project.height,
            )

            # Register preview video asset
            video_asset = ProjectAsset(
                id=str(uuid.uuid4()),
                project_id=project_id,
                type="VIDEO",
                original_filename=f"chroma_canvas_{chroma_color}.mp4",
                mime_type="video/mp4",
                size=chroma_path.stat().st_size,
                storage_key=chroma_key,
                duration=project.duration,
                width=project.width,
                height=project.height,
            )
            db.add(video_asset)

            project.status = "READY"
            db.commit()

            await self.broadcast_progress(job_id, project_id, "COMPLETED", "COMPLETED", 100.0, f"Subtitle project ready with {len(parsed.segments)} segments.")

        finally:
            db.close()

    async def _process_video_with_subtitle(
        self,
        job_id: str,
        project_id: str,
        video_asset_id: str,
        subtitle_asset_id: str,
    ):
        db: Session = SessionLocal()
        try:
            video_asset = db.query(ProjectAsset).filter(ProjectAsset.id == video_asset_id).first()
            sub_asset = db.query(ProjectAsset).filter(ProjectAsset.id == subtitle_asset_id).first()
            project = db.query(Project).filter(Project.id == project_id).first()
            if not video_asset or not sub_asset or not project:
                raise ValueError("Project or required assets not found.")

            project.status = "PROCESSING"
            db.commit()

            # Analyze video
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "MEDIA_ANALYSIS", 30.0, "Analyzing video dimensions & duration...")
            video_path = storage_service.resolve_key(video_asset.storage_key)
            meta = await asyncio.to_thread(ffprobe_service.probe, video_path)

            project.duration = meta.duration
            project.width = meta.width
            project.height = meta.height
            video_asset.duration = meta.duration
            video_asset.width = meta.width
            video_asset.height = meta.height
            db.commit()

            # Parse Subtitle
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "SUBTITLE_IMPORT", 60.0, "Parsing external subtitles...")
            sub_path = storage_service.resolve_key(sub_asset.storage_key)
            parsed = await asyncio.to_thread(subtitle_service.parse_file, sub_path, sub_asset.original_filename)

            # Generate Captions
            await self.broadcast_progress(job_id, project_id, "PROCESSING", "CAPTION_GENERATION", 85.0, "Attaching captions to video timeline...")
            track = CaptionTrack(
                id=str(uuid.uuid4()),
                project_id=project_id,
                name=f"External Subtitles ({parsed.format})",
                language=project.language or "en",
                is_default=True,
            )
            db.add(track)
            db.flush()

            for s_idx, seg in enumerate(parsed.segments):
                c_seg = CaptionSegment(
                    id=str(uuid.uuid4()),
                    track_id=track.id,
                    segment_index=s_idx,
                    start_time=seg.start,
                    end_time=seg.end,
                    text=seg.text,
                )
                db.add(c_seg)
                db.flush()

                for w_idx, w in enumerate(seg.words):
                    c_word = CaptionWord(
                        id=str(uuid.uuid4()),
                        segment_id=c_seg.id,
                        word_index=w_idx,
                        word=w.word,
                        start_time=w.start,
                        end_time=w.end,
                    )
                    db.add(c_word)

            project.status = "READY"
            db.commit()

            await self.broadcast_progress(job_id, project_id, "COMPLETED", "COMPLETED", 100.0, "Video and external captions successfully synchronized.")

        finally:
            db.close()


job_manager = JobManager()

