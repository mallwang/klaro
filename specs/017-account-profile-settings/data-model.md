# Data Model: Account Profile Settings

**Branch**: `017-account-profile-settings` | **Date**: 2026-06-14

## Existing Entities (unchanged)

### `users` table

Relevant columns (no schema changes — the display name and email columns already exist):

| Column         | Type    | Constraint                | Notes                              |
|----------------|---------|---------------------------|------------------------------------|
| `id`           | TEXT    | PRIMARY KEY               | UUID                               |
| `email`        | TEXT    | UNIQUE, max 320 chars     | Updated by `confirmEmailChange`    |
| `display_name` | TEXT    | NOT NULL, max 100 chars   | Updated by `updateDisplayName`     |
| `role`         | TEXT    | CHECK ADMIN\|MEMBER       | Read-only from profile settings    |

---

## New Entity

### `email_verifications` table

Stores pending email-change requests. Only one row may exist per user (enforced by unique index). The row is deleted when the change is confirmed or when a new request supersedes it.

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

| Column       | Type | Notes                                      |
|--------------|------|--------------------------------------------|
| `token`      | TEXT | 64-char hex (randomBytes(32)), primary key |
| `user_id`    | TEXT | FK → users.id, CASCADE delete              |
| `new_email`  | TEXT | The proposed new email address             |
| `expires_at` | TEXT | ISO 8601 timestamp; token is valid until this time |
| `created_at` | TEXT | ISO 8601 timestamp                         |

**Lifecycle**:
1. Row inserted when user submits email change request.
2. If user submits again: old row deleted, new row inserted (within a transaction).
3. Row deleted when user clicks the verification link and `confirmEmailChange` succeeds.
4. Row deleted if expired (on next access by the `confirmEmailChange` method).
5. Row deleted automatically via `ON DELETE CASCADE` if the user account is removed.

---

## New Shared Schemas (`packages/shared/src/schemas/profile.ts`)

### `UpdateDisplayNameBodySchema`
```typescript
z.object({
  displayName: z.string().min(1).max(100),
})
```

### `RequestEmailChangeBodySchema`
```typescript
z.object({
  email: z.string().email().max(320),
})
```

### `PendingEmailChangeSchema`
```typescript
z.object({
  pendingEmail: z.string().email().nullable(),
})
```

---

## TypeScript Interfaces

### `EmailVerificationRow` (added to `packages/backend/src/db/client.ts`)
```typescript
export interface EmailVerificationRow {
  token: string;
  user_id: string;
  new_email: string;
  expires_at: string;
  created_at: string;
}
```

### `RequestEmailChangeResult` (defined in `profile.service.ts`)
```typescript
type RequestEmailChangeResult =
  | { outcome: 'requested'; token: string; expiresAt: string }
  | { outcome: 'duplicate' }
  | { outcome: 'not-found' };
```

### `ConfirmEmailChangeResult` (defined in `profile.service.ts`)
```typescript
type ConfirmEmailChangeResult = 'confirmed' | 'not-found' | 'expired';
```
