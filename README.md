# CaptionStudio — Local-First AI Captioning & Video Rendering Studio

> **100% On-Device AI Speech Recognition • 60+ Animated Styles • Multi-Track Editor • Hardware-Accelerated FFmpeg Burn-In • Multi-User Workspace • Admin Control Center**

CaptionStudio is a complete production-grade application for creating viral, kinetic video subtitles without uploading your media to third-party cloud platforms or paying subscription fees.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                      │
│     (React 19, TypeScript, Tailwind CSS, Local Auth)        │
│                                                             │
│   • Marketing Pages (/features, /styles, /templates, etc.)  │
│   • Auth Pages (/login, /signup)                            │
│   • Creator Workspace (/dashboard, /projects, /fonts, etc.) │
│   • Studio Timeline Editor (/editor/[projectId])            │
│   • Admin Console (/admin, /users, /jobs, /storage, etc.)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (/api/v1)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Python Backend                   │
│         (Python 3.12+, SQLAlchemy 2.0, Local Auth)          │
├──────────────────────────────┬──────────────────────────────┤
│   Local AI Speech Engine     │   Media & Render Pipeline    │
│   faster-whisper             │   FFmpeg, FFprobe, libass    │
│   (CTranslate2, Word Timing) │   (NVENC, AMF, VideoToolbox) │
└──────────────────────────────┴──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Local Storage & Persistence                 │
│   SQLite Database (storage/captionstudio.db)                │
│   Directory Structure: uploads, audio, exports, temp, fonts │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Default Local Accounts

Upon initial launch, CaptionStudio auto-seeds two local credentials in SQLite:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@captionstudio.local` | `admin123` | Full access to `/admin` & `/dashboard` |
| **Creator** | `user@captionstudio.local` | `user123` | Creator workspace & project editor |

*Passwords are salted and hashed locally using PBKDF2-HMAC-SHA256 (100,000 rounds).*

---

## ✨ Features

- **100% Offline AI Transcription**: Powered by `faster-whisper` and CTranslate2 with sub-millisecond word timestamps.
- **60+ Kinetic Caption Styles**: Pre-calibrated presets across TikTok, Reels, Shorts, Documentary, Neon, and Cinema.
- **Professional Timeline Editor**: Word-by-word confidence ratings, split/merge segments (`S`/`M`), and safe-zone guides.
- **Hardware-Accelerated Render Engine**: Direct subtitle burn-in via FFmpeg & `libass` utilizing NVIDIA NVENC, AMD AMF, or Apple VideoToolbox.
- **Creator Dashboard**: Unified project manager, project duplication, soft-delete & restore, and custom font uploads.
- **Admin Control Suite**: Real-time system diagnostics, background worker monitor, storage breakdown & safe cleanup, and live log streamer.
- **Export Versatility**: Export burnt-in MP4s (1080p, 720p, 4K) or clean subtitle tracks (SRT, VTT, ASS, JSON).

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
