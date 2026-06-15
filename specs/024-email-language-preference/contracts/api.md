# API Contracts: Email Language Preference

## Modified Endpoints

### GET /api/profile/notification-preferences

Returns the authenticated user's notification preferences, now including email language.

**Auth**: Session cookie required.

**Response 200**:

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "WEEKLY",
  "nextSendAt": "2026-06-22T10:00:00.000Z",
  "emailLanguage": "en"
}
```

| Field | Type | Notes |
|---|---|---|
| `summaryEmailEnabled` | `boolean` | Unchanged |
| `summaryEmailFrequency` | `"WEEKLY" \| "MONTHLY" \| null` | Unchanged |
| `nextSendAt` | `string \| null` | ISO 8601 UTC; unchanged |
| `emailLanguage` | `"en" \| "de"` | **New**. Always present; defaults to `"en"`. |

---

### PATCH /api/profile/notification-preferences

Updates one or more notification preferences. All body fields are optional; omitted fields leave stored values unchanged.

**Auth**: Session cookie required.

**Request body**:

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "MONTHLY",
  "emailLanguage": "de"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `summaryEmailEnabled` | `boolean` | No | Unchanged semantics |
| `summaryEmailFrequency` | `"WEEKLY" \| "MONTHLY"` | Conditional | Required when `summaryEmailEnabled` is `true` |
| `emailLanguage` | `"en" \| "de"` | No | **New**. Must be a supported locale. |

**Response 204**: No body. Preference saved.

**Response 400**: Validation error (invalid `emailLanguage` value, or `summaryEmailEnabled: true` without `summaryEmailFrequency`).

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid enum value. Expected 'en' | 'de', received 'it'"
}
```

---

## Locale Behaviour at Send Time

All email dispatch methods on `MailerService` accept a `locale: SupportedEmailLanguage` parameter (defaulting to `'en'`). The caller (route handler or `NotificationService`) is responsible for reading the recipient's stored `email_language` and forwarding it.

Callers that send to a known user:
- `sendEmailVerificationEmail` — route reads `email_language` for the requesting user
- `sendEmailChangeConfirmationEmail` — route reads `email_language` for the confirmed user
- `sendPasswordResetEmail` — auth route reads `email_language` for the target user
- `sendWelcomeEmail` — invitation route reads `email_language` (defaults `'en'` for new accounts)
- `sendInvitationEmail` — no stored user yet; always uses `'en'` (invited user has no preference)
- `sendSummaryEmail` — `NotificationService` reads `email_language` from the user row
- `sendTestEmail` — admin utility; always uses `'en'`
- `sendPasswordChangeEmail` — auth route reads `email_language` for the authenticated user

---

## Shared Constants

Defined in `packages/shared/src/types/user.ts`, consumed by both backend Zod schema and frontend selector:

```ts
export const SUPPORTED_EMAIL_LANGUAGES = ['en', 'de'] as const;
export type SupportedEmailLanguage = (typeof SUPPORTED_EMAIL_LANGUAGES)[number];
```
