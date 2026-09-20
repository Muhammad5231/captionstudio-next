# Local Job System & Real-Time Event Streaming

## Asynchronous In-Process Architecture

Video media analysis, audio extraction, and faster-whisper transcription take noticeable processing time. They are never run synchronously inside HTTP request handlers.

Instead, CaptionStudio uses a lightweight, robust **SQLite-backed in-process asynchronous job queue**:

```
Client (Web)                         FastAPI Route                       JobManager / Worker
      |                                    |                                      |
      |--- POST /projects/{id}/transcribe ->|                                      |
      |                                    |--- Create Job record in SQLite ----->|
      |                                    |--- Spawn asyncio.create_task() ----->|
      |<-- Returns 202 Accepted (Job ID) --|                                      |
      |                                                                           |
      |--- GET /api/v1/jobs/{job_id}/events (SSE) ------------------------------->|
      |                                                                           |
      |<-- SSE data: { status: "PROCESSING", stage: "MEDIA_ANALYSIS", ... } ------|
      |<-- SSE data: { status: "PROCESSING", stage: "AUDIO_EXTRACTION", ... } ----|
      |<-- SSE data: { status: "PROCESSING", stage: "TRANSCRIPTION", ... } -------|
      |<-- SSE data: { status: "PROCESSING", stage: "CAPTION_GENERATION", ... } --|
      |<-- SSE data: { status: "COMPLETED", progress: 100 } ----------------------|
```

---

## Job States & Types

### Job Status Lifecycle
- `QUEUED`: Awaiting execution.
- `PROCESSING`: Currently running in a background task.
- `COMPLETED`: Pipeline succeeded; outputs written to SQLite and storage.
- `FAILED`: Pipeline encountered an error (error message and details recorded).
- `CANCELLED`: User aborted job.

### Pipeline Types
1. **`VIDEO_TRANSCRIPTION`**:
   - `MEDIA_ANALYSIS` (15%) -> `AUDIO_EXTRACTION` (35%) -> `TRANSCRIPTION` (60%) -> `CAPTION_GENERATION` (85%) -> `COMPLETED` (100%).
2. **`SUBTITLE_IMPORT`**:
   - `SUBTITLE_IMPORT` (30%) -> `CAPTION_GENERATION` (60%) -> `MEDIA_ANALYSIS` (80% Chroma video generation) -> `COMPLETED` (100%).
3. **`VIDEO_WITH_SUBTITLE`**:
   - `MEDIA_ANALYSIS` (30%) -> `SUBTITLE_IMPORT` (60%) -> `CAPTION_GENERATION` (85%) -> `COMPLETED` (100%).

