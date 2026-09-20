# CaptionStudio Architecture Specification

## Overview
CaptionStudio is a **local-first professional video caption generation suite**. It is architected for zero cloud lock-in, maximal user privacy, and low-latency processing by running speech recognition, media transformation, database storage, and frontend rendering directly on the user's workstation.

---

## High-Level Topology

```
+-------------------------------------------------------------+
| Browser / Web Client (Next.js 15, React 19, TypeScript)     |
| - Drag & Drop Upload Zone                                   |
| - Synchronized Video Preview Player                         |
| - Real-time SSE Progress Subscriber                         |
| - Interactive Caption Segment Inspector & Text Editor       |
+------------------------------+------------------------------+
                               | HTTP / Server-Sent Events (SSE)
                               v
+-------------------------------------------------------------+
| Backend API Engine (FastAPI, Python 3.11+, Pydantic v2)     |
|                                                             |
| +---------------------+   +-------------------------------+ |
| | SQLite Database     |   | Local Storage Service         | |
| | (WAL Mode Concur.)  |   | (storage/uploads, audio, etc) | |
| +---------------------+   +-------------------------------+ |
|                                                             |
| +---------------------+   +-------------------------------+ |
| | Local Job Manager   |   | Subtitle Parsing Engine       | |
| | (Async in-process)  |   | (SRT, VTT, ASS, TXT)          | |
| +---------------------+   +-------------------------------+ |
|                                                             |
| +---------------------+   +-------------------------------+ |
| | Media Engine        |   | Local AI Speech-to-Text       | |
| | (FFmpeg & FFprobe)  |   | (faster-whisper / CTranslate2)| |
| +---------------------+   +-------------------------------+ |
+-------------------------------------------------------------+
```

---

## Architectural Principles

1. **Local-First & Zero Cloud Infiltration**:
   - No external APIs (no OpenAI, Google Cloud, Azure Speech, AssemblyAI, AWS).
   - No heavyweight external services (no Docker, Redis, Celery, PostgreSQL, or Kubernetes required for local operation).

2. **Opaque Storage & Defense in Depth**:
   - Internal filesystem paths (`C:\Users\...`) are never exposed via API endpoints.
   - All files are referenced via opaque storage keys (e.g. `uploads/uuid_name.mp4`).
   - 7-Level validation guards against directory traversal, corrupt media, and malicious executable uploads.

3. **Canonical Internal Caption Model**:
   - Uniform schema: `CaptionTrack -> CaptionSegment[] -> CaptionWord[]`.
   - Word timestamps are preserved throughout the pipeline.
   - Independent of input source (whether generated from faster-whisper or imported via SRT/VTT/ASS).

4. **Extensibility for Later Phases**:
   - Abstract provider contracts (`TranscriptionProvider`, `TranslationProvider`, `BaseSubtitleParser`) allow adding future models and GPU optimizations without touching the presentation layer or database schema.

