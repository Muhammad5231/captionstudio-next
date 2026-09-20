# CaptionStudio — Local-First Caption Generation Engine (Phase 1)

CaptionStudio is a **local-first professional caption-generation application**. Everything runs directly on your machine: speech-to-text transcription, media validation, audio extraction, database storage, subtitle parsing, and real-time synchronized caption preview.

**Zero cloud dependencies. 100% private. No external APIs.**

---

## 🏛️ Architecture Overview

```
Browser (Web Client)
  │
  ├── HTTP Multipart Upload & JSON API
  └── Server-Sent Events (SSE) Live Progress Stream
  ▼
FastAPI Backend (:8000)
  ├── SQLite Database (WAL mode, relational caption models)
  ├── Local Filesystem Storage (opaque key abstraction)
  ├── Local faster-whisper AI Engine (word-level timestamps, Hinglish support)
  └── Local FFmpeg & FFprobe Services (audio extraction, chroma canvas generation)
```

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide | Creation studio, drag-drop upload, video player & caption editor |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 | Async job queue, validation, storage keys, REST & SSE APIs |
| **Database** | SQLite + WAL mode (`data/database/captionstudio.db`) | Relational persistence of projects, assets, tracks, segments, words |
| **Speech AI** | `faster-whisper` (CTranslate2) | 100% offline transcription with word timing & Hinglish preservation |
| **Media Engine** | `FFmpeg` & `FFprobe` | Media analysis, 16kHz mono audio extraction, chroma-key rendering |

---

## 📋 System Requirements

- **Node.js**: v18.0+ (Tested on v24.20.0)
- **Package Manager**: `pnpm` (Tested on v11.25.0) or `npm`
- **Python**: Python 3.11+ (Tested on Python 3.14.7)
- **FFmpeg & FFprobe**: Included locally in project root (`ffmpeg.exe`, `ffprobe.exe`)
- **Git**: Installed for version control

---

## 🚀 Step-by-Step Installation

### 1. Automated Environment Check
Run our built-in environment detection script to verify all prerequisites:

```bash
python scripts/check_env.py
```
Or double click `scripts/check-env.bat` on Windows.

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Install Backend Dependencies
```bash
pip install -r apps/api/requirements.txt
```

### 4. Install Frontend Dependencies & Build Shared Schemas
```bash
pnpm install --ignore-scripts
pnpm --filter @captionstudio/caption-schema build
```

---

## 🏃 Running the Application

### 1. Launch FastAPI Backend
From the monorepo root:
```bash
python apps/api/run.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Launch Next.js Web Frontend
In a second terminal:
```bash
pnpm --filter @captionstudio/web dev
```
- Web Application: `http://localhost:3000`

---

## 🎬 First Run Walkthrough

1. Open **http://localhost:3000** in your browser.
2. Click **Create Captions** or navigate to `/create`.
3. Select your input mode:
   - **Mode A (Upload Video)**: Choose any `.mp4`, `.mov`, `.webm`, `.mkv`, or `.avi` video. Select language (English, Hindi, Gujarati, or Auto/Hinglish).
   - **Mode B (Subtitle Only)**: Choose an `.srt`, `.vtt`, `.ass`, or `.txt` file. Pick a chroma canvas background color (Green `#00FF00` or Blue).
   - **Mode C (Video + Subtitle)**: Provide a video alongside external subtitle timing.
4. Click **Generate Captions Locally**.
5. Watch the live progress bar stream pipeline stages via Server-Sent Events (`MEDIA_ANALYSIS` ➔ `AUDIO_EXTRACTION` ➔ `TRANSCRIPTION` ➔ `CAPTION_GENERATION`).
6. Once complete, enjoy the **Synchronized Video Preview**:
   - Play, pause, or seek across the timeline.
   - See canonical captions overlay in real time.
   - Click any caption segment on the right to jump directly to its timestamp.
   - Edit caption text inline and click **Save Changes**.

---

## 🧪 Running Tests

Execute the complete backend test suite:
```bash
python -m pytest tests/
```
Output:
```
tests/backend/test_caption_model.py .                                    [  6%]
tests/backend/test_grouping.py ...                                       [ 26%]
tests/backend/test_media_services.py .                                   [ 33%]
tests/backend/test_parsers.py .....                                      [ 66%]
tests/backend/test_pipeline_e2e.py .                                     [ 73%]
tests/backend/test_transcription.py .                                    [ 80%]
tests/backend/test_validation.py ...                                     [100%]
============================= 15 passed in 8.87s ==============================
```

Build and test frontend TypeScript types:
```bash
pnpm --filter @captionstudio/web build
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `FFmpeg not found` | Binary missing from PATH | Ensure `ffmpeg.exe` and `ffprobe.exe` are in the project root. Run `python scripts/check_env.py`. |
| `Port 8000 in use` | Another process listening on 8000 | Change `BACKEND_PORT=8001` in `.env` and `apps/web/next.config.ts`. |
| `Whisper model error` | Insufficient RAM or disk space | In `.env`, switch `WHISPER_MODEL=tiny` or `base`. |
| `Pnpm build ignored` | Native sharp script warnings | Run `pnpm install --ignore-scripts`. |

---

## 📚 Detailed Documentation

- [Architecture Specification](docs/architecture.md)
- [Installation Guide](docs/setup.md)
- [Caption Grouping Engine](docs/caption-engine.md)
- [Transcription & Hinglish AI](docs/transcription.md)
- [Subtitle Parsers (SRT, VTT, ASS, TXT)](docs/subtitles.md)
- [Storage & Path Security](docs/storage.md)
- [Job System & SSE Streaming](docs/jobs.md)
- [Troubleshooting Reference](docs/troubleshooting.md)

