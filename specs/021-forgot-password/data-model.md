# Data Model: Forgot Password (021)

## Schema Change: `email_verifications` table

### Current schema

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email   TEXT NOT NULL CHECK(length(new_email) <= 320),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_user
  ON email_verifications(user_id);
```

### New schema

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email   TEXT NOT NULL CHECK(length(new_email) <= 320),
  purpose     TEXT NOT NULL DEFAULT 'email-change'
                CHECK(purpose IN ('email-change', 'password-reset')),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_user
  ON email_verifications(user_id, purpose);
```

### Migration

```sql
-- Add purpose column with default value
ALTER TABLE email_verifications ADD COLUMN purpose TEXT NOT NULL DEFAULT 'email-change'
  CHECK(purpose IN ('email-change', 'password-reset'));

-- Recreate unique index to include purpose
DROP INDEX IF EXISTS idx_email_verifications_user;
CREATE UNIQUE INDEX idx_email_verifications_user
  ON email_verifications(user_id, purpose);
```

### Rationale

- **Additive change**: No data loss — existing rows get `purpose = 'email-change'`
- **Backward compatible**: Existing `requestEmailChange` and `confirmEmailChange` methods work unchanged (they don't filter by purpose)
- **One per user per purpose**: `UNIQUE INDEX` on `(user_id, purpose)` enforces single active token per user per purpose
- **Clean separation**: Email-change and password-reset tokens coexist without interference

---

## Updated `EmailVerificationRow` interface

```typescript
export interface EmailVerificationRow {
  token: string;
  user_id: string;
  new_email: string;
  purpose: 'email-change' | 'password-reset';
  expires_at: string;
  created_at: string;
}
```

---

## New shared schemas

### `RequestPasswordResetBodySchema`

| Field  | Type              | Constraints       |
|--------|-------------------|-------------------|
| email  | string (email)    | valid RFC 5321 address |

Added to `packages/shared/src/schemas/auth.ts`.

### `ResetPasswordBodySchema`

| Field    | Type              | Constraints       |
|----------|-------------------|-------------------|
| password | string            | min 8, max 200 chars |

Added to `packages/shared/src/schemas/auth.ts`.

---

## New `AuthService` methods

### `requestPasswordReset(email: string): RequestPasswordResetResult`

```typescript
type RequestPasswordResetResult =
  | { outcome: 'requested'; token: string; expiresAt: string }
  | { outcome: 'not-found' };
```

- Generates 32-byte random token
- Stores in `email_verifications` with `purpose = 'password-reset'`
- Deletes any previous password-reset token for the user
- Returns token and expiry (caller sends email)
- Returns `'not-found'` for non-existent email (caller returns generic success anyway)

### `resetPassword(token: string, password: string): ResetPasswordResult`

```typescript
type ResetPasswordResult =
  | 'success'
  | 'not-found'
  | 'expired';
```

- Validates token exists and is not expired
- Updates user's `password_hash` and `password_salt`
- Deletes token (single-use)
- Returns `'success'`, `'not-found'`, or `'expired'`

---

## New `MailerService` method

### `sendPasswordResetEmail(to: string, link: string, expiresAt: string): Promise<void>`

- Sends password reset email with link
- Subject: "Reset your password"
- Content: "You requested a password reset. Click the link below to set a new password."
- Throws `MailerError` on transport failure

---

## No new database tables

This feature reuses the existing `email_verifications` table with an added `purpose` column. No new tables are needed.
