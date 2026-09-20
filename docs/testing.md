# CaptionStudio — Testing & Verification Guide

## Test Suite Structure
The test suite validates backend API endpoints, security layers, database migrations, and frontend builds.

```
tests/
├── backend/
│   ├── test_phase3_auth_admin.py     # Auth, admin, security, project isolation tests
│   ├── test_phase2_editor_api.py     # Split/merge, templates, style updates
│   ├── test_projects_api.py          # Project lifecycle and asset uploads
│   └── test_transcription_engine.py  # Audio extraction and Whisper pipeline
└── conftest.py                       # Fixtures, test database, mock client
```

## Running Tests

### 1. Run All Backend Tests
```bash
python -m pytest tests/backend -v
```

### 2. Run Phase 3 Specific Test Suite
```bash
python -m pytest tests/backend/test_phase3_auth_admin.py -v
```

### 3. Run End-to-End Live Verification Script
```bash
python scripts/verify_phase3_e2e.py
```

### 4. Verify Frontend TypeScript & Production Build
```bash
pnpm --filter @captionstudio/web exec tsc --noEmit
pnpm --filter @captionstudio/web build
```

