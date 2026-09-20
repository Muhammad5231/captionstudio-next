# CaptionStudio — Local Authentication & Security

## Architecture
CaptionStudio utilizes a 100% on-device authentication system. No third-party OAuth, external identity providers, or cloud email services are used.

## Cryptographic Security
- **Algorithm**: PBKDF2-HMAC-SHA256
- **Iterations**: 100,000 rounds
- **Salt**: 16 cryptographically secure random bytes generated via `secrets.token_bytes(16)`
- **Comparison**: Constant-time `hmac.compare_digest` to prevent timing attacks.

## Session Management
- **Session Tokens**: 32-byte cryptographically secure hex tokens generated via `secrets.token_hex(32)`.
- **Persistence**: Stored in the SQLite `sessions` table and verified on every authenticated request.
- **Duration**: 30 days default expiration.
- **Cookies**: Set via HTTP-only, `SameSite=Lax` cookie `session_id`, alongside standard `Authorization: Bearer <token>` support.

## Default Credentials
Upon initial database bootstrap, CaptionStudio seeds two default accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@captionstudio.local` | `admin123` |
| Creator | `user@captionstudio.local` | `user123` |

## Roles & Permissions
1. **USER (Creator)**:
   - Create, edit, and duplicate video caption projects.
   - Access the Creator Dashboard, custom font loader, and exports.
   - Favorite templates and update own profile credentials.
2. **ADMIN**:
   - Everything granted to `USER`.
   - Full access to `/admin` panel.
   - View global project and user lists, modify user roles, and trigger storage cleanup.
3. **SUPER_ADMIN**:
   - Unrestricted system-wide control and audit log inspection.

