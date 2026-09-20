# CaptionStudio — Local Storage Layout

## Filesystem Directory Structure
All user files and database records reside within the local `storage/` directory:

```
storage/
├── captionstudio.db       # SQLite 3 ACID database
├── uploads/               # Original uploaded video and audio media files
├── audio/                 # Extracted 16kHz mono WAV waveforms for Whisper
├── exports/               # Rendered MP4 videos and subtitle files (SRT, VTT, ASS)
├── fonts/                 # Custom uploaded TrueType (.ttf) and OpenType (.otf) fonts
├── temp/                  # Transient render chunks and FFmpeg intermediate files
└── models/                # Downloaded faster-whisper model weights
```

## Safe Cleanup Lifecycle
- **Temp Cache**: Files in `storage/temp/` can be safely removed anytime via `/admin/storage`.
- **Audio Waves**: `storage/audio/` contains cached WAV files extracted from uploaded videos. If deleted, the pipeline can regenerate them from the source video if re-transcription is requested.
- **Exports**: Rendered outputs can be deleted per-file by creators or in bulk by administrators.
- **Projects**: Soft-deleted projects can be purged or restored before permanent cleanup.
