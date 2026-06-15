# Data Model: Email Language Preference

## Schema Change

### `users` table — new column

| Column           | Type   | Nullable | Default | Constraint                          |
|------------------|--------|----------|---------|-------------------------------------|
| `email_language` | `TEXT` | NOT NULL | `'en'`  | `CHECK(email_language IN ('en','de'))` |

The constraint is intentionally kept in sync with `SUPPORTED_EMAIL_LANGUAGES` in the shared package. When a new locale is added, both the constraint and the constant must be updated together.

**Migration guard** (matches existing pattern in `db/client.ts`):

```ts
const hasEmailLanguage = instance
  .prepare<[], { name: string }>(`PRAGMA table_info(users)`)
  .all()
  .some((col) => col.name === 'email_language');

if (!hasEmailLanguage) {
  instance.exec(
    `ALTER TABLE users ADD COLUMN email_language TEXT NOT NULL DEFAULT 'en'
       CHECK(email_language IN ('en','de'))`,
  );
}
```

The `schema.sql` `CREATE TABLE IF NOT EXISTS users` definition is also updated to include `email_language` so fresh databases get the column without a migration.

---

## Shared Package Changes

### New in `packages/shared/src/types/user.ts`

```ts
export const SUPPORTED_EMAIL_LANGUAGES = ['en', 'de'] as const;
export type SupportedEmailLanguage = (typeof SUPPORTED_EMAIL_LANGUAGES)[number];
```

### Extended `NotificationPreferences` interface

```ts
export interface NotificationPreferences {
  summaryEmailEnabled: boolean;
  summaryEmailFrequency: EmailSummaryFrequency | null;
  nextSendAt: string | null;
  emailLanguage: SupportedEmailLanguage;   // ← new
}
```

### Extended `UpdateNotificationPreferencesBodySchema`

```ts
export const UpdateNotificationPreferencesBodySchema = z
  .object({
    summaryEmailEnabled: z.boolean(),
    summaryEmailFrequency: z.enum(['WEEKLY', 'MONTHLY']).optional(),
    emailLanguage: z.enum(SUPPORTED_EMAIL_LANGUAGES).optional(),  // ← new
  })
  .superRefine(/* existing validation unchanged */);
```

---

## New Module: `packages/backend/src/services/mailer.strings.ts`

Contains locale-keyed string maps for every email type. Shape (illustrative; actual strings filled in during implementation):

```ts
export type LocaleStrings<TArgs extends Record<string, string>> = Record<
  SupportedEmailLanguage,
  (args: TArgs) => { subject: string; text: string; html: string }
>;

export const testEmailStrings: LocaleStrings<{ to: string }> = { en: ..., de: ... };
export const welcomeEmailStrings: LocaleStrings<{ link: string }> = { en: ..., de: ... };
export const passwordChangeEmailStrings: LocaleStrings<{ link: string }> = { en: ..., de: ... };
export const emailChangeConfirmationStrings: LocaleStrings<{ changedDate: string }> = { en: ..., de: ... };
export const emailVerificationStrings: LocaleStrings<{ link: string; expiryDate: string }> = { en: ..., de: ... };
export const invitationEmailStrings: LocaleStrings<{ link: string; expiryDate: string }> = { en: ..., de: ... };
export const passwordResetEmailStrings: LocaleStrings<{ link: string; expiryDate: string }> = { en: ..., de: ... };
export const summaryEmailStrings: LocaleStrings<SummaryEmailArgs> = { en: ..., de: ... };
```

The `Record<SupportedEmailLanguage, …>` type ensures TypeScript reports a compile error when a locale is missing from any map.

---

## API Shape

### `GET /api/profile/notification-preferences` — response

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "WEEKLY",
  "nextSendAt": "2026-06-22T10:00:00.000Z",
  "emailLanguage": "de"
}
```

### `PATCH /api/profile/notification-preferences` — request body

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "WEEKLY",
  "emailLanguage": "de"
}
```

All three fields remain independently optional; omitting `emailLanguage` leaves the stored value unchanged.

---

## Validation Rules

- `emailLanguage` must be a member of `SUPPORTED_EMAIL_LANGUAGES` (`'en' | 'de'`).
- An unknown stored value (e.g., a locale removed after a downgrade) falls back to `'en'` at send time.
- `emailLanguage` defaults to `'en'` for new users and for users who have never set a preference.
