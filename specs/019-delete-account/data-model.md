# Data Model: Delete Account

**Branch**: `019-delete-account` | **Date**: 2026-06-14

## No new entities

This feature performs destructive operations on existing entities only. No new tables,
columns, or migrations are required.

## Deletion Cascade

When a user row is deleted from `users`, SQLite `ON DELETE CASCADE` automatically removes
all dependent rows:

| Table | FK Column | Cascade behaviour |
|-------|-----------|-------------------|
| `sessions` | `user_id REFERENCES users(id) ON DELETE CASCADE` | All sessions deleted — user is signed out everywhere |
| `contracts` | `user_id REFERENCES users(id) ON DELETE CASCADE` | All contracts deleted |
| `invitations` | `invited_by REFERENCES users(id) ON DELETE CASCADE` | Invitations sent by the user are deleted |

The cascade is handled entirely by the database engine; the application only needs to issue
`DELETE FROM users WHERE id = ?`.

## Sole-Admin Guard

Before deletion, `ProfileService.deleteSelf()` checks the active admin count:

```sql
SELECT COUNT(*) AS count
FROM users
WHERE role = 'ADMIN' AND status = 'ACTIVE'
```

If `count <= 1` and the requesting user is an ADMIN, deletion is rejected with outcome
`'last-admin'`. This mirrors the existing guard in `UserService.archive()` and
`UserService.changeRole()`.

## Service Result Type

```typescript
// packages/shared/src/schemas/profile.ts (addition)
export type DeleteSelfResult = 'deleted' | 'last-admin';
```

This type is defined in `@pcm/shared` so it can be referenced by both the backend service
and any future callers without creating a cross-package dependency on backend internals.
