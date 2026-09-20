# Subtitle Parsers & Import Architecture

## Supported Subtitle Formats

CaptionStudio provides modular parsers for all major subtitle formats:

| Format | Extension | Timing Support | Word Timestamps | Parser Class |
| :--- | :--- | :--- | :--- | :--- |
| **SubRip** | `.srt` | Yes | Character-weighted interpolation | `SRTParser` |
| **WebVTT** | `.vtt` | Yes | Character-weighted interpolation | `VTTParser` |
| **ASS** | `.ass` | Yes | Dialogue line extraction | `ASSParser` |
| **Plain Text** | `.txt` | No | Un-timed transcript | `TXTParser` |

---

## Parser Specifications

### 1. SRT (`SubRip`)
- Handles index lines, comma (`00:00:01,000`) and period (`00:00:01.000`) timestamps.
- Cleans HTML formatting tags (`<i>`, `<b>`, `<font>`).
- Calculates frame-accurate word duration based on letter counts.

### 2. WebVTT (`.vtt`)
- Validates `WEBVTT` signature header.
- Ignores `NOTE` blocks and voice span indicators (`<v Speaker>`).
- Supports cue settings (`position:50% line:80%`).

### 3. ASS (`Advanced SubStation Alpha`)
- Parses the `[Events]` section and dynamically extracts `Start`, `End`, and `Text` fields based on `Format:` declaration.
- Strips override tags (e.g. `{\k50}`, `{\pos(x,y)}`, `{\b1}`).

### 4. TXT Handling (Strictly Honest)
- Plain text files do **not** contain timing data.
- The `TXTParser` marks the file as `has_timing=False` and `requires_alignment=True`.
- It will **never** generate fake or assumed timestamps.

