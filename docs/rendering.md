# CaptionStudio — FFmpeg Video Rendering Engine

## Architecture
CaptionStudio utilizes a native FFmpeg pipeline with `libass` subtitle filtering to burn animated, stylized captions directly into video streams.

## Pipeline Workflow
1. **Subtitle Generation**: The active caption track and styling spec are transformed into an Advanced SubStation Alpha (`.ass`) file containing font tags, color hexes, border styles, and karaoke timing (`\k`).
2. **Filter Graph Construction**:
   ```bash
   ffmpeg -y -i input.mp4 -vf "ass=subtitles.ass:fontsdir=storage/fonts" -c:v libx264 -preset veryfast -crf 20 -c:a aac output.mp4
   ```
3. **Hardware Acceleration**:
   - NVIDIA: `h264_nvenc` / `hevc_nvenc`
   - AMD: `h264_amf` / `hevc_amf`
   - Apple Silicon: `h264_videotoolbox`
   - Fallback: Multi-threaded `libx264`

## Export Profiles
- **1080p (Full HD)**: 1080x1920 (9:16) or 1920x1080 (16:9), CRF 20.
- **720p (Draft)**: 720x1280 (9:16) or 1280x720 (16:9), CRF 23.
- **4K (Ultra HD)**: 2160x3840 (9:16) or 3840x2160 (16:9), CRF 18.

