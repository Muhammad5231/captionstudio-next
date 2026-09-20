# CaptionStudio — Installation & Setup Guide

## System Requirements
- **Operating System**: Windows 10/11 (64-bit), macOS 12+ (Apple Silicon or Intel), or modern Linux (Ubuntu 22.04+).
- **Node.js**: v18.18+ or v20+
- **pnpm**: v9+ or v10+
- **Python**: 3.10 to 3.13 (Python 3.12 recommended)
- **FFmpeg & FFprobe**: Installed and available on system `PATH`
- **RAM**: Minimum 8 GB (16 GB recommended for Whisper `medium` or `large-v3` models)
- **GPU (Optional)**: NVIDIA GPU with CUDA 12.x for 10x faster speech transcription.

## Step-by-Step Installation

### 1. Clone Repository & Install Node Dependencies
```bash
git clone https://github.com/captionstudio/captionstudio.git
cd captionstudio
pnpm install
```

### 2. Set Up Python Virtual Environment
```bash
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate

# Install Python backend dependencies:
pip install -r apps/api/requirements.txt
```

### 3. Verify FFmpeg Installation
```bash
ffmpeg -version
ffprobe -version
```

### 4. Start the Application

**Option A: Run Both Concurrently**
```bash
pnpm dev
```

**Option B: Run Services Separately**
Terminal 1 (FastAPI Backend):
```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (Next.js Web Frontend):
```bash
pnpm --filter @captionstudio/web dev
```

The web application is accessible at: `http://localhost:3000`
The backend REST API is available at: `http://localhost:8000/docs`
