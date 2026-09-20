# CaptionStudio — Exports & Subtitle Deliveries

## Formats Supported

| Format | Extension | Type | Usage |
|---|---|---|---|
| Burnt-in Video | `.mp4` | Video | Ready-to-upload viral video for TikTok, Reels, Shorts, and YouTube. |
| SubRip | `.srt` | Subtitle | Standard subtitle format for YouTube closed captions, Vimeo, and Premiere Pro. |
| WebVTT | `.vtt` | Subtitle | HTML5 web video players and modern streaming platforms. |
| Advanced SSA | `.ass` | Subtitle | Complex typography, color, and karaoke styling metadata. |
| Canonical JSON | `.json` | Metadata | Machine-readable word and segment timestamps with confidence ratings. |

## Storage & Downloads
- Exported files are preserved in `storage/exports/`.
- Direct authenticated download endpoint: `GET /api/v1/exports/{id}/download`.
- Exports are linked to the originating project and owner for complete data isolation.

