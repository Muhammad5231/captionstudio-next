# Local Storage Architecture & Security

## Storage Structure

All application media and workspace data reside locally in the `storage/` directory:

```
storage/
├── uploads/     # User uploads (videos, subtitle files)
├── projects/    # Project-specific workspace metadata
├── audio/       # Extracted 16kHz mono WAV audio tracks
├── subtitles/   # Converted and imported subtitle files
├── thumbnails/  # Generated video thumbnails (for project listing)
├── renders/     # Chroma canvas videos and rendered previews
├── exports/     # Exported subtitle and burned video assets
├── temp/        # Temporary working files (automatically cleaned)
└── logs/        # Application runtime log files
```

---

## Security & Path Defense

1. **Opaque Keys**:
   - Clients only receive identifiers such as `uploads/4a7f29c0_intro.mp4`.
   - Raw disk paths (e.g. `C:\Users\username\...` or `D:\Projects\...`) are never sent in API responses.

2. **Path Traversal Prevention**:
   - Every key resolution passes through `StorageService.resolve_key()`.
   - Relative parent segments (`..`) are rejected immediately.
   - Target files are verified to remain strictly within `settings.storage_path`.

3. **Multi-Level Media Validation**:
   - **Level 1**: Extension whitelist.
   - **Level 2**: MIME type whitelist.
   - **Level 3**: Magic byte signature inspection (rejects `.exe`, `.zip` masquerading as `.mp4`).
   - **Level 4**: FFprobe container and stream analysis.
   - **Level 5**: File size boundary check (<= 500MB).
   - **Level 6**: Duration check (<= 60 minutes).
   - **Level 7**: Resolution check (<= 8K UHD).

