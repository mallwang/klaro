# Research: Forgot Password (021)

## 1. Existing Email Verification System

The codebase has an email verification flow for email changes:
- **Token generation**: `randomBytes(32).toString('hex')` — 64-character hex string
- **Storage**: `email_verifications` table with `token` (PK), `user_id` (FK, unique), `new_email`, `expires_at`, `created_at`
- **Expiry**: 24 hours (`EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000`)
- **Single-use**: Token deleted after confirmation
- **One per user**: `UNIQUE INDEX` on `user_id`
- **Invalidation**: Previous token deleted before inserting new one

**Key pattern**: The system generates a token, stores it in the database, sends an email with a link containing the token, and confirms the action when the user clicks the link.

## 2. Password Handling

- **Hashing**: scrypt with random 16-byte salt, 64-byte key
- **Storage**: Separate `password_hash` and `password_salt` columns on `users` table
- **Change**: Requires current password, authenticated endpoint
- **Lockout**: 5 failed attempts → exponential lockout up to 60 minutes

## 3. Sign-In Page Structure

- **Component**: `/packages/frontend/src/pages/SignIn.tsx`
- **Form fields**: email, password, submit button
- **No forgot password link** exists
- **Public route**: Wrapped in `PublicLayout`

## 4. Authentication System

- **Session-based**: httpOnly cookies
- **Public routes whitelist**: `POST /api/auth/sign-in`, `POST /api/invitations/:token/accept`, `POST /api/profile/email-change/:token/confirm`
- **Auth service**: Handles sign-in, password change, session management

## 5. Existing Tables

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `email_verifications` | `token` (PK), `user_id` (FK, unique), `new_email`, `expires_at` | Email change verification |
| `invitations` | `token` (PK), `email`, `status`, `expires_at` | Account invitations |
| `sessions` | `id` (PK), `user_id`, `expires_at` | User sessions |

## 6. Frontend Patterns

- **Public pages**: `AcceptInvitation.tsx`, `EmailVerifyConfirm.tsx` use `PublicLayout`
- **API client**: Functions in `services/auth.ts`, `services/profile.ts`
- **Hooks**: TanStack Query hooks in `hooks/useAuth.ts`
- **i18n**: Translation keys in `en.json`, `de.json`

## 7. Test Patterns

- **Unit tests**: Vitest with in-memory SQLite (`createDb(':memory:')`)
- **Integration tests**: Vitest with full Fastify server
- **Test helpers**: `insertUser()` helper functions for creating test users
- **Mock pattern**: Stub transport for mailer tests

## 8. Key Decisions

### Why extend `email_verifications` instead of creating a new table?

1. **Spec compliance**: FR-008 requires reusing existing email verification approach
2. **Simplicity**: One table is simpler than two tables with similar schemas
3. **Consistency**: Same token generation, storage, and confirmation patterns
4. **Migration**: Additive change (ALTER TABLE ADD COLUMN) — no data loss

### Why 1-hour expiry for password reset?

1. **Security**: Password reset is higher-risk than email verification
2. **Standard practice**: GitHub, Google, etc. use 1-hour expiry for password reset
3. **Balance**: Long enough for email delivery, short enough to limit exposure

### Why no rate limiting for forgot-password endpoint?

1. **Existing protection**: Brute-force lockout already protects sign-in
2. **Limited attack surface**: Forgot-password only sends emails, doesn't reveal account existence
3. **YAGNI**: Personal-use app with small user base — overkill for dedicated rate limiting

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Email enumeration | Generic success messages, same response for valid/invalid emails |
| Token reuse | Single-use tokens, deleted after use |
| Expired tokens | 1-hour expiry, lazy cleanup on access |
| Brute-force tokens | 32-byte random token (256 bits entropy) |
| Email delivery failure | Rollback token on failure (existing pattern) |

## 10. Open Questions

None — all decisions resolved.
