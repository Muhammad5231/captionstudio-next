# CaptionStudio — System Architecture Guide

## 1. Overview
CaptionStudio is a local-first, privacy-respecting application for AI-powered speech recognition, animated caption generation, and hardware-accelerated video rendering.

```
┌────────────────────────────────────────────────────────────┐
│                    Next.js 15 Frontend                     │
│  (React 19, TypeScript, Tailwind CSS, Zustand, AuthProvider)│
└──────────────────────────────┬─────────────────────────────┘
                               │ HTTP /api/v1 (REST)
┌──────────────────────────────▼─────────────────────────────┐
│                    FastAPI Python Backend                  │
│     (Python 3.12+, SQLAlchemy, PBKDF2 Auth, Job Manager)   │
├──────────────────────────────┬─────────────────────────────┤
│   AI Speech Engine           │   Media & Render Pipeline   │
│   faster-whisper             │   FFmpeg, FFprobe, libass   │
│   (CTranslate2, Word Timing) │   (Hardware NVENC/AMF/CPU)  │
└──────────────────────────────┴─────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────┐
│                 Local Storage & Persistence                │
│   SQLite Database (captionstudio.db) & Filesystem Assets    │
│   (storage/uploads, storage/audio, storage/exports, temp)  │
└────────────────────────────────────────────────────────────┘
```

## 2. Core Pillars
1. **Local-First & Offline**: Zero network calls to external cloud APIs. All transcription (faster-whisper), video rendering (FFmpeg), and session tokens execute directly on the user's workstation.
2. **Multi-User Isolation**: User accounts are stored in the local SQLite database. Creators only see and manage their own projects and exports. Administrators have access to system-wide metrics and maintenance tools.
3. **Hardware Acceleration**: Automatic detection of NVIDIA NVENC, AMD AMF, and Apple VideoToolbox GPU encoders for high-speed video burn-in.
4. **Canonical Caption Model**: Standardized TypeScript and Python schema representing segments, word timestamps, confidence scores, animations, and typography.
