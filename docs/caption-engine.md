# Caption Engine & Grouping Architecture

## Canonical Caption Model

CaptionStudio establishes a single canonical data structure that bridges speech-to-text outputs, subtitle parsers, the preview player, and future rendering export engines.

```
CaptionTrack (id, project_id, name, language, is_default)
  │
  ├── CaptionSegment [0] (id, start_time, end_time, text)
  │     ├── CaptionWord [0] (id, word, start_time, end_time, confidence)
  │     ├── CaptionWord [1] (id, word, start_time, end_time, confidence)
  │     └── CaptionWord [2] (id, word, start_time, end_time, confidence)
  │
  └── CaptionSegment [1] (id, start_time, end_time, text)
        ├── CaptionWord [0]
        └── CaptionWord [1]
```

---

## The Caption Grouping Engine

Dumping raw speech recognition cues directly onto a video creates unreadable, jarring subtitle chunks. The `CaptionGroupingService` groups words according to readability metrics:

### Grouping Parameters:
- **`max_words_per_segment`**: default `4` (range: 3-6). Ensures concise captions for short-form media (TikTok, Reels, Shorts) and standard videos.
- **`max_chars_per_segment`**: default `36`. Prevents awkward text wrapping outside screen-safe margins.
- **`max_duration_seconds`**: default `3.0s`. Prevents captions from lingering after speech ends.
- **`min_gap_seconds_to_split`**: default `0.40s`. Detects natural conversational pauses and silences.
- **`split_on_punctuation`**: default `True`. Splits on terminal punctuation (`.`, `?`, `!`, `,`, `;`, `:`, `।`).

---

## Phase 1 Preview Style Specification

The default Phase 1 preview style complies with the core requirements:
- **Font Color**: Pure White (`#FFFFFF`)
- **Outline / Stroke**: Solid Black (`-webkit-text-stroke: 1.5px black`)
- **Shadow**: Deep ambient black drop shadow (`text-shadow: 0 0 4px #000, 2px 2px 3px rgba(0,0,0,0.9)`)
- **Alignment**: Bottom Center
- **Positioning**: Safe Margin (80px from bottom edge)
- **Active Word**: Subtle kinetic highlight (gold `#FDE047` with micro-scale)

