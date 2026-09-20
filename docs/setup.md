# Setup & Installation Guide

This guide walks you through configuring and running CaptionStudio completely locally on Windows, macOS, or Linux.

---

## Prerequisites

1. **Node.js**: v18.0.0 or higher (v24 LTS recommended).
2. **Package Manager**: `pnpm` (recommended) or `npm`.
3. **Python**: Python 3.11, 3.12, 3.13, or 3.14.
4. **Media Binaries**:
   - `ffmpeg.exe` (placed in root or system PATH)
   - `ffprobe.exe` (placed in root or system PATH)
5. **Git**: Installed for version control.

---

## Automated Environment Verification

Before running anything, execute our built-in environment verification script:

```bash
python scripts/check_env.py
```
Or on Windows:
```cmd
scripts\check-env.bat
```

You should see:
```
====================================================
           CaptionStudio Environment Check          
====================================================
Node.js          [PASS]     v24.20.0
Package Mgr      [PASS]     pnpm 11.25.0
Python           [PASS]     Python 3.14.7
pip              [PASS]     pip 26.2.1
FFmpeg           [PASS]     ffmpeg version 8.1.2 (ffmpeg.exe)
FFprobe          [PASS]     ffprobe version n8.0.1 (ffprobe.exe)
Git              [PASS]     git version 2.52.0.windows.1
----------------------------------------------------
[SUCCESS] All dependencies verified! System ready for CaptionStudio.
```

---

## Installation Steps

### 1. Clone or Open Workspace
```bash
cd CaptionStudio-NEXT
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Review the values in `.env`:
- `BACKEND_HOST=127.0.0.1`
- `BACKEND_PORT=8000`
- `DATABASE_URL=sqlite:///./data/database/captionstudio.db`
- `STORAGE_ROOT=./storage`
- `WHISPER_MODEL=base`
- `WHISPER_DEVICE=cpu`
- `WHISPER_COMPUTE_TYPE=int8`

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

## Running the Application

### Terminal 1: Launch FastAPI Backend
```bash
python apps/api/run.py
```
Backend API will start at: **http://127.0.0.1:8000**
Interactive OpenAPI Docs: **http://127.0.0.1:8000/docs**

### Terminal 2: Launch Next.js Web Frontend
```bash
pnpm --filter @captionstudio/web dev
```
Web client will start at: **http://localhost:3000**

