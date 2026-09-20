# CaptionStudio — Professional Editor Guide

## Overview
The CaptionStudio Editor (`/editor/[projectId]`) is a multi-track subtitle synchronization workspace built with Next.js, React 19, and HTML5 Video.

## Key Capabilities

### 1. Synchronized Timeline Scrubber
- Sub-frame playhead scrubbing with interactive audio waveform visualization.
- Click-to-seek directly to any word or segment timestamp.
- Zoom in and zoom out of timeline duration.

### 2. Segment & Word Level Control
- Word-level confidence badges to highlight tokens where Whisper speech confidence was below 0.6.
- In-place text editing for words and segments.
- Segment split (`S` key) at active playhead timestamp.
- Segment merge (`M` key) to combine consecutive subtitle lines.

### 3. Visual Styling Controls
- Live font family selector (bundled + custom uploaded fonts).
- Font size, weight, text transform (uppercase, lowercase, none), letter spacing.
- Text color, stroke width, stroke color, shadow blur, offset, and background pill box.
- Vertical and horizontal alignment with mobile social media safe zone overlays (TikTok, Reels, Shorts).

### 4. Keyboard Shortcuts
- `Space`: Play / Pause playback
- `K`: Pause
- `J / L`: Step 1 second backward / forward
- `Left / Right`: Step 1 frame (0.04s)
- `S`: Split segment at playhead
- `M`: Merge segment
- `Ctrl + S`: Save project draft

