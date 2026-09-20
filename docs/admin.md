# CaptionStudio — Administration Panel Guide

## Overview
The Admin Console (`/admin`) provides system administrators with tools for monitoring the workstation environment, managing accounts, and auditing background operations.

## Sections

### 1. Overview (`/admin`)
- Total users (active, admins, creators).
- Project counts (active vs trash).
- Real-time disk storage footprint.
- Background worker status and failed jobs monitor.
- Engine health diagnostics (faster-whisper, FFmpeg, SQLite, RAM).

### 2. User Accounts (`/admin/users`)
- View all local creator and admin accounts.
- Assign roles (`USER`, `ADMIN`, `SUPER_ADMIN`).
- Deactivate or re-activate accounts (with protection against self-lockout).

### 3. All Projects (`/admin/projects`)
- Global system catalog of projects across all creators.
- Inspect owner, track count, and soft-delete status.
- One-click restore or deletion.

### 4. Background Jobs (`/admin/jobs`)
- Real-time monitor of transcription and render worker tasks.
- Live progress percentages and error diagnostics.

### 5. Storage & Cleanup (`/admin/storage`)
- Breakdown of `uploads`, `exports`, `audio`, `temp`, and `captionstudio.db`.
- Safe cleanup actions to reclaim space without touching active project scripts.

### 6. System Diagnostics (`/admin/system`)
- Python version, FastAPI version, CPU thread count, RAM availability.
- Verification of local FFmpeg and FFprobe binary availability.

### 7. Server & Audit Logs (`/admin/logs`)
- Live viewer for server console output.
- Filter by level (`INFO`, `WARNING`, `ERROR`) and real-time text search.
- One-click log copy for diagnostics.

