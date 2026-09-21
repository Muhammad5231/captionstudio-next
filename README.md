# CaptionStudio — Local-First AI Captioning & Video Rendering Studio

> **100% On-Device AI Speech Recognition • 15 Sandboxed Python Styles • Multi-Track Editor • Hardware-Accelerated FFmpeg Burn-In • Accountless Public Workflow • Admin Telemetry Control Center**

CaptionStudio is a complete production-grade application for creating viral, kinetic video subtitles without uploading media to third-party cloud platforms or paying subscription fees.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                      │
│        (React 19, TypeScript, Tailwind CSS, SSE)            │
│                                                             │
│   • Frictionless Creator Flow (/create -> /editor/[id])     │
│   • Real-Time RenderSpec Canvas Preview                     │
│   • Multi-Track Interactive Timeline Track (Ruler/Media/Sub)│
│   • Keyboard Shortcuts System (Play, Step, Split, Undo)     │
│   • Admin Console (/admin, /admin/styles, /admin/exports)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (/api/v1) & SSE Events
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Python Backend                   │
│         (Python 3.12+, SQLAlchemy 2.0, SQLite)              │
├──────────────────────────────┬──────────────────────────────┤
│   Local AI Speech Engine     │   Media & Render Pipeline    │
│   faster-whisper             │   FFmpeg, FFprobe, libass    │
│   (CTranslate2, Word Timing) │   Two-Phase Atomic Render    │
│   Hinglish Normalization     │   (NVENC, AMF, libx264)      │
├──────────────────────────────┴──────────────────────────────┤
│   Sandboxed Python Style Engine                             │
│   Isolated Subprocess Execution • RenderSpec Contract       │
│   15 Built-in Studio Styles (Viral, Minimal, Kinetic...)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Local Storage & Persistence                 │
│   SQLite Database (storage/captionstudio.db)                │
│   Directory Structure: uploads, exports, temp, fonts, styles │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Access Architecture

- **Public Creators**: No sign-up, login, or accounts required! Direct friction-free access to `/create` -> Upload -> Transcribe -> Interactive Editor -> Two-Phase MP4 Burn-In.
- **Studio Administrator**: Secure session token authentication for `/admin` management console (default password: `admin` or configured via `ADMIN_SECRET`).

---

## ✨ Features

- **100% Offline AI Transcription**: Powered by `faster-whisper` and CTranslate2 with sub-millisecond word timestamps.
- **Hinglish Accuracy & Subtitle Normalization**: Preserves natural mixed-language cadences without forced translations, cleans stutters, and balances into 2-line maximum layouts.
- **15 Sandboxed Python Caption Styles**: Pure Python styles executed in isolated, memory-capped subprocesses generating declarative `RenderSpec` contracts.
- **Professional Multi-Track Timeline**: Word-by-word active timing, waveform rhythm visualization, split/merge/duplicate segments, and aspect ratio controls (16:9, 9:16, 1:1, 4:5, 4:3).
- **Two-Phase Production Video Export**: Renders to staging before validating stream health, container integrity, and audio safety, then atomically moves to delivery.
- **Real-Time SSE Event Streaming**: Live progress bars for video uploads, Whisper transcription, and FFmpeg frame encoding.
- **Admin Telemetry & Delivery Inspector**: Inspect frame rates, render duration, encoding hardware, and media metadata directly from SQLite.
- **Export Versatility**: Export burnt-in MP4s or clean subtitle tracks (SRT, VTT, ASS, JSON).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18.18+ or 20+
- pnpm 9+ or 10+
- Python 3.10 to 3.13 (Python 3.12 recommended)
- FFmpeg on system `PATH` (or placed in project root)

### 2. Setup
```bash
# Clone & install Node dependencies
pnpm install

# Set up Python virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

# Install Python requirements
pip install -r apps/api/requirements.txt
```

### 3. Run Development Servers
```bash
# Terminal 1: FastAPI Backend
cd apps/api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Next.js Frontend
pnpm --filter @captionstudio/web dev
```
- Open `http://localhost:3000` in your web browser.
- Interactive API Docs: `http://localhost:8000/docs`

---

## 🧪 Testing & Verification

```bash
# Run all 36 backend API & security unit tests
python -m pytest tests/backend -v

# Run the Phase 3 End-to-End verification script
python scripts/verify_phase3_e2e.py

# Verify frontend TypeScript types
pnpm --filter @captionstudio/web exec tsc --noEmit

# Run production build
pnpm --filter @captionstudio/web build
```

---

## 📚 Documentation Index

Detailed guides are located in the [`docs/`](./docs) folder:

- [`docs/architecture.md`](./docs/architecture.md) — System architecture & data flow
- [`docs/setup.md`](./docs/setup.md) — Detailed installation & environment setup
- [`docs/authentication.md`](./docs/authentication.md) — PBKDF2 auth, sessions & RBAC
- [`docs/dashboard.md`](./docs/dashboard.md) — Creator workspace & project management
- [`docs/editor.md`](./docs/editor.md) — Timeline editor, waveform & keyboard shortcuts
- [`docs/styles.md`](./docs/styles.md) — 60+ caption styles & animation parameters
- [`docs/templates.md`](./docs/templates.md) — Style templates & favorites system
- [`docs/fonts.md`](./docs/fonts.md) — Bundled fonts & custom TTF/OTF loader
- [`docs/rendering.md`](./docs/rendering.md) — FFmpeg libass burn-in & hardware encoding
- [`docs/exports.md`](./docs/exports.md) — MP4, SRT, VTT, ASS, and JSON export specs
- [`docs/admin.md`](./docs/admin.md) — Admin panel, diagnostics & storage cleaner
- [`docs/security.md`](./docs/security.md) — Threat model, isolation & path protection
- [`docs/storage.md`](./docs/storage.md) — Filesystem layout & cleanup lifecycle
- [`docs/jobs.md`](./docs/jobs.md) — Asynchronous job manager & state transitions
- [`docs/testing.md`](./docs/testing.md) — Automated tests & verification procedures
- [`docs/troubleshooting.md`](./docs/troubleshooting.md) — FAQ & common issue resolutions

---

## 📄 License
CaptionStudio is distributed under the MIT License.
