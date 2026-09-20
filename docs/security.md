# CaptionStudio — Security Architecture Guide

## Security Model
CaptionStudio is designed with a defense-in-depth model for confidential video workflows.

## Threat Mitigations

### 1. Zero Cloud Egress
- All transcription inference and video rendering are conducted in-process on the local machine.
- No external APIs, cloud webhooks, or remote analytics endpoints are called.

### 2. Multi-User Isolation
- All project and export queries enforce `user_id == current_user.id`.
- Non-admin users cannot read, edit, or delete another user's project records or files.

### 3. Path Traversal & Safe File Handling
- User-supplied filenames are sanitized using `Path(filename).name` and UUID prefixes.
- Storage lookups verify that resolved filepaths reside strictly within `settings.storage_root`.
- Attempts to pass paths containing `..` or leading slashes are blocked.

### 4. Cryptographic Standards
- Password hashing: PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte random salts.
- Sessions: 32-byte cryptographically secure hex tokens stored in SQLite with expiration timestamps.
- Time-constant string comparisons (`hmac.compare_digest`) for all secret verifications.

