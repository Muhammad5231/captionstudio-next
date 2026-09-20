# CaptionStudio — Troubleshooting & FAQ

## Common Issues and Resolutions

### 1. "FFmpeg is not installed or not found on PATH"
- **Symptom**: Audio extraction or video burn-in fails immediately with an error that `ffmpeg` could not be located.
- **Resolution**:
  - Download FFmpeg binaries from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) (Windows) or install via package manager (`brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Ubuntu).
  - Ensure the folder containing `ffmpeg.exe` and `ffprobe.exe` is added to your system `PATH`.
  - Restart the terminal session and test with `ffmpeg -version`.

### 2. "CUDA Out of Memory" during Whisper transcription
- **Symptom**: Backend crashes during transcription when processing large video files on GPUs with low VRAM.
- **Resolution**:
  - In project settings, select the `tiny` or `base` model instead of `medium` or `large-v3`.
  - Or configure the backend to use CPU inference (`compute_type="int8"`).

### 3. Port 3000 or Port 8000 already in use
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`
- **Resolution**:
  - Find and terminate the conflicting process:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
    ```
  - Or launch on alternative ports:
    ```bash
    pnpm --filter @captionstudio/web dev -- -p 3001
    uvicorn app.main:app --port 8001
    ```

### 4. Custom font not showing up in burned video
- **Symptom**: Subtitles render in default sans-serif font instead of the selected custom font.
- **Resolution**:
  - Go to `/admin/fonts` and click "Rescan Fontconfig Cache".
  - Verify that the font file name does not contain illegal special characters.
