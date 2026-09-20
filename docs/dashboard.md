# CaptionStudio — Creator Dashboard Guide

## Overview
The Creator Dashboard (`/dashboard`) serves as the central workstation hub for managing video captioning workflows.

## Features & Routes

### 1. Overview (`/dashboard`)
- Real-time KPI metrics: Total Projects, Total Rendered Exports, Installed Style Templates, and Speech Engine Status.
- Quick action to create a new project.
- Visual cards of recent projects with direct click-to-edit.
- Recent exports table with direct download links.

### 2. My Projects (`/dashboard/projects`)
- Filter projects by Active vs Trash (Soft-deleted).
- Instant search by title or description.
- Sort by last updated date, created date, or name.
- Project actions:
  - **Open in Editor**: Loads the full Phase 2 editor at `/editor/[projectId]`.
  - **Duplicate Project**: Clones caption tracks, segments, words, and styles into a new workspace.
  - **Rename Project**: In-place title updating.
  - **Move to Trash**: Safe soft-deletion (`deleted_at` timestamp).
  - **Restore Project**: Instantly recovers projects from Trash.

### 3. Templates (`/dashboard/templates`)
- Browse all 60+ pre-calibrated caption templates.
- Filter by "My Favorites" to keep preferred branding presets within reach.
- Single-click apply to start a new project pre-styled with that template.

### 4. Custom Fonts (`/dashboard/fonts`)
- Upload custom `.ttf` or `.otf` font files.
- Real-time typography preview playground to test live text rendering across fonts.
- Automatic registration into local fontconfig cache.

### 5. Render Exports (`/dashboard/exports`)
- View all rendered MP4 videos and subtitle files (SRT, VTT, ASS).
- Authenticated download and file deletion.

### 6. Settings (`/dashboard/settings`)
- View account profile and role details.
- Change password with confirmation.
- Configure processing defaults (default Whisper model, aspect ratio, resolution).

