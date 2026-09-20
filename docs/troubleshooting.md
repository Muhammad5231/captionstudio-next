# Troubleshooting Guide

Common issues and solutions for local execution.

---

### 1. FFmpeg or FFprobe Not Found
- **Symptom**: `FileNotFoundError: Binary 'ffmpeg' could not be located in workspace or system PATH.`
- **Solution**:
  1. Ensure `ffmpeg.exe` and `ffprobe.exe` are placed directly inside the project root folder (`CaptionStudio-NEXT`), or added to system PATH.
  2. Run `python scripts/check_env.py` to confirm detection.

---

### 2. Port Conflict (Port 8000 or 3000 In Use)
- **Symptom**: `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000): address already in use`
- **Solution**:
  - For FastAPI: Change `BACKEND_PORT=8001` in `.env` and `apps/web/next.config.ts`.
  - For Next.js: Run `pnpm --filter @captionstudio/web dev -p 3001`.

---

### 3. Whisper Model Download Issues
- **Symptom**: Model download times out or fails on first transcription.
- **Solution**:
  - The model downloads into `data/models/`. Ensure write permissions exist on `data/models/`.
  - To use a smaller model for faster downloads, set `WHISPER_MODEL=tiny` in `.env`.
  - For higher accuracy with Hindi/Gujarati, set `WHISPER_MODEL=small` or `base`.

---

### 4. Node.js & pnpm Dependency Issues
- **Symptom**: `ERR_PNPM_IGNORED_BUILDS: Ignored build scripts: sharp`
- **Solution**:
  - Run `pnpm install --ignore-scripts` to bypass optional native binaries that are not needed for core web UI rendering.

---

### 5. Video Playback & Range Requests
- **Symptom**: Video does not seek or stalls when clicking the timeline.
- **Solution**:
  - CaptionStudio implements HTTP 206 Partial Content byte range streaming (`/api/v1/assets/{id}/stream`). Ensure your browser supports HTML5 video codecs (H.264 / AAC).

