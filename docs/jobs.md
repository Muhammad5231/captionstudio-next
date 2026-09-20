# CaptionStudio — Background Job System

## Architecture
CaptionStudio includes an in-process, thread-safe asynchronous job system that manages heavy computational tasks (AI speech recognition and FFmpeg encoding) without blocking web requests or requiring Redis/Celery.

## State Transitions
```
   ┌─────────┐
   │ QUEUED  │
   └────┬────┘
        │ Worker picks task
   ┌────▼─────┐
   │PROCESSING│
   └────┬─────┘
        ├────────────────────────┐
        │ Success                │ Failure
   ┌────▼──────┐           ┌─────▼─────┐
   │ COMPLETED │           │  FAILED   │
   └───────────┘           └───────────┘
```

## Job Types
1. `TRANSCRIPTION`: Audio extraction via FFmpeg -> faster-whisper inference -> Canonical segment parsing -> Database track commit.
2. `RENDER`: Subtitle ASS export -> FFmpeg libass video burn-in -> Storage artifact registration.
3. `AUDIO_EXTRACTION`: Dedicated pre-processing for waveform visualization.

## Progress Tracking
Jobs report fractional progress (`0.0` to `1.0`), stage names (e.g. `EXTRACTING_AUDIO`, `INFERRING_SPEECH`, `RENDERING_FRAMES`), and diagnostic messages accessible via `GET /api/v1/jobs/{id}` and `/admin/jobs`.
