# Research: Email Language Preference

## Decision 1: Email Template Storage Strategy

**Decision**: Keep email content as locale-keyed string maps within the mailer service (no external template files, no template engine).

**Rationale**: The current `mailer.service.ts` already holds all email body strings inline. The codebase values YAGNI and simplicity (Constitution III). Introducing Handlebars, Mjml, or file-system templates would add complexity with no benefit at current scale. Locale strings for each email type will be modelled as a typed constant map (e.g., `Record<SupportedEmailLanguage, { subject: string; text: string; html: string }>`), kept in a dedicated `mailer.strings.ts` module so that coverage tests and the mailer service can import them independently.

**Alternatives considered**:
- External `.hbs` / `.mjml` template files — rejected: adds file-system dependency, complicates CI coverage check, no current tooling set up.
- i18next on the backend — rejected: i18next is a frontend library here, and loading the full translation JSON on the backend to render emails is excessive and couples the two packages unnecessarily.

---

## Decision 2: Where to Store the Email Language Preference

**Decision**: Add an `email_language` column (`TEXT NOT NULL DEFAULT 'en'`) to the `users` table in SQLite, using the same incremental migration guard pattern established in `db/client.ts`.

**Rationale**: The preference is per-user and persistent, exactly like `summary_email_enabled` and `summary_email_frequency`. No separate entity or table is needed.

**Alternatives considered**:
- Storing preference in a JSON blob alongside other profile settings — rejected: no such blob exists; `users` table is the canonical profile store.
- Client-side storage (localStorage) — rejected: email is sent server-side; the server must know the preference.

---

## Decision 3: API Surface for the New Preference

**Decision**: Extend the existing `GET /api/profile/notification-preferences` and `PATCH /api/profile/notification-preferences` endpoints to include `emailLanguage`. No new endpoint is needed.

**Rationale**: Email language is a notification-adjacent preference; grouping it here is natural and keeps the API surface small. The `PATCH` body already uses Zod with `superRefine`, making it straightforward to add an optional `emailLanguage` field.

**Alternatives considered**:
- Separate `PATCH /api/profile/email-language` endpoint — rejected: unnecessary endpoint proliferation for a single field.

---

## Decision 4: Passing Locale to the Mailer

**Decision**: Add a `locale: SupportedEmailLanguage` parameter to every `send*` method on `MailerService`, defaulting to `'en'` when the caller omits it (the test-email helper). The caller is responsible for reading the user's stored `email_language` and passing it through.

**Rationale**: This keeps `MailerService` stateless and the locale choice explicit at the call site. For `NotificationService.sendSummaryEmailForUser`, the user row already fetched from the DB will include `email_language`. For transactional emails sent from route handlers (email change, password reset, invitation), the route handler will look up the user's preference.

**Alternatives considered**:
- Inject locale into `MailerService` constructor — rejected: the same mailer instance handles emails to multiple users; per-call locale is the right granularity.

---

## Decision 5: Supported Language Constant

**Decision**: Define `SUPPORTED_EMAIL_LANGUAGES = ['en', 'de'] as const` and `SupportedEmailLanguage = 'en' | 'de'` in `packages/shared/src/types/user.ts`, so both the backend Zod schema and the frontend locale selector can import a single source of truth.

**Rationale**: Avoids duplicate arrays in frontend and backend. When a new UI language is added, updating this one constant triggers compile errors wherever it needs to be handled (the string map exhaustiveness check via `Record<SupportedEmailLanguage, …>`).

---

## Decision 6: CI Template Coverage Check

**Decision**: Implement the coverage check as a Vitest unit test (`packages/backend/tests/unit/mailer.strings.test.ts`) that imports `SUPPORTED_EMAIL_LANGUAGES` from shared and the locale string map from `mailer.strings.ts`, then asserts every language has a non-empty entry for every email type.

**Rationale**: A test file is simpler than a standalone CI script, runs automatically with `pnpm test`, and produces a clear failure message pointing to exactly which locale × email-type combination is missing. TypeScript's `Record<SupportedEmailLanguage, …>` type already enforces exhaustiveness at compile time; the Vitest assertion provides a runtime safety net with a human-readable error.

---

## Locale Formatting Reference

| Locale | Date format  | Currency thousands sep | Currency decimal sep |
|--------|-------------|------------------------|----------------------|
| `en`   | MM/DD/YYYY  | `,`                    | `.`                  |
| `de`   | DD.MM.YYYY  | `.`                    | `,`                  |

`Intl.DateTimeFormat` and `Intl.NumberFormat` (Node.js built-ins, no extra dependency) will be used with the locale code to format dates and currency values inside email strings.
