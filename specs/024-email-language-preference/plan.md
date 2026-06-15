# Implementation Plan: Email Language Preference

**Branch**: `024-email-language-preference` | **Date**: 2026-06-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/024-email-language-preference/spec.md`

## Summary

Allow authenticated users to select a per-account email language (English or German) in Account Settings, independent of the browser/UI language. All outgoing emails — transactional and scheduled — render their subject, body, and locale-formatted dates/amounts using the stored preference. Template coverage for every supported language is enforced by a CI Vitest test.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Node.js LTS

**Primary Dependencies**:
- Backend: Fastify, better-sqlite3, Nodemailer, Zod
- Frontend: React, Mantine UI, i18next, TanStack Query
- Shared: Zod, TypeScript types

**Storage**: SQLite — new `email_language TEXT NOT NULL DEFAULT 'en'` column on `users` table

**Testing**: Vitest (unit + integration, backend and frontend), Playwright (E2E)

**Target Platform**: Linux server (backend), browser (frontend)

**Project Type**: Web application — Fastify API + React SPA

**Performance Goals**: Standard web; no new performance-sensitive paths

**Constraints**: No new runtime dependencies; locale formatting via `Intl.DateTimeFormat` / `Intl.NumberFormat` (Node.js built-in)

**Scale/Scope**: Personal-use multi-user app; small user count

## Constitution Check

### Principle I — Test-First (NON-NEGOTIABLE)

**Status**: COMPLIANT

All new functions and schema changes must have failing tests written before implementation code is committed:
- `mailer.strings.test.ts` (coverage check) — written first, fails until strings exist
- `mailer.service.test.ts` extensions — locale variants written first
- `profile.route.test.ts` extension — `emailLanguage` field assertions written first
- `migration.test.ts` extension — new column guard written first
- `AccountSettings.test.tsx` extension — email language selector assertions written first

### Principle II — Type Safety (NON-NEGOTIABLE)

**Status**: COMPLIANT

- `SUPPORTED_EMAIL_LANGUAGES` constant drives both the Zod `z.enum()` schema (backend) and the frontend selector options — single source of truth.
- `Record<SupportedEmailLanguage, …>` for locale string maps: TypeScript reports compile error when a locale is missing.
- `SupportedEmailLanguage` added to shared types; imported by both packages.
- No `any`, no `@ts-ignore`.

### Principle III — Simplicity (YAGNI)

**Status**: COMPLIANT

- Locale strings live in a new `mailer.strings.ts` module (one level of indirection, no template engine, no file system dependency).
- Existing `PATCH /api/profile/notification-preferences` extended rather than a new endpoint added.
- No new npm dependencies introduced.

## Project Structure

### Documentation (this feature)

```text
specs/024-email-language-preference/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
packages/shared/src/
├── types/user.ts                          ← add SUPPORTED_EMAIL_LANGUAGES, SupportedEmailLanguage,
│                                             extend NotificationPreferences
└── schemas/profile.ts                     ← extend UpdateNotificationPreferencesBodySchema

packages/backend/src/
├── db/
│   ├── schema.sql                         ← add email_language column to CREATE TABLE users
│   └── client.ts                          ← add migration guard for email_language column
├── services/
│   ├── mailer.strings.ts                  ← NEW: locale-keyed string maps for all 8 email types
│   └── mailer.service.ts                  ← add locale param to all send* methods
│   └── notification.service.ts            ← pass email_language when calling mailer
└── routes/
    └── profile.ts                         ← read/write emailLanguage in GET + PATCH handlers

packages/backend/tests/
├── unit/
│   ├── mailer.strings.test.ts             ← NEW: CI coverage check (test-first anchor)
│   └── mailer.service.test.ts             ← extend with locale variant assertions
│   └── migration.test.ts                  ← extend with email_language column assertion
└── integration/
    ├── profile.route.test.ts              ← extend: emailLanguage in GET + PATCH responses
    └── notification-preferences.route.test.ts ← extend: emailLanguage field assertions

packages/frontend/src/
├── i18n/locales/en.json                   ← add emailLanguage.* keys
├── i18n/locales/de.json                   ← add emailLanguage.* keys
├── hooks/useNotificationPreferences.ts    ← surface emailLanguage from API response
└── pages/AccountSettings.tsx              ← add Email Language selector panel

packages/frontend/tests/
├── unit/AccountSettings.test.tsx          ← extend: email language selector assertions
└── unit/i18n/catalogue.test.ts           ← already validates key parity; new keys covered automatically
```

## Implementation Order

The tasks below follow the TDD Red-Green-Refactor cycle. Each task produces a failing test first, then implements only enough code to make it pass.

### Task Group 1: Foundation (Shared + DB)

1. **Shared: add `SupportedEmailLanguage` and extend `NotificationPreferences`**
   - In `packages/shared/src/types/user.ts`: add `SUPPORTED_EMAIL_LANGUAGES`, `SupportedEmailLanguage`, extend `NotificationPreferences` with `emailLanguage`.
   - In `packages/shared/src/schemas/profile.ts`: add optional `emailLanguage: z.enum(SUPPORTED_EMAIL_LANGUAGES)` to `UpdateNotificationPreferencesBodySchema`.

2. **DB migration: add `email_language` column**
   - Extend `migration.test.ts` with a test asserting that after `runMigrations`, the `users` table contains `email_language` with default `'en'`.
   - Update `schema.sql` `CREATE TABLE IF NOT EXISTS users` to include `email_language`.
   - Add migration guard to `db/client.ts` (same `PRAGMA table_info` pattern used for `summary_email_enabled`).

### Task Group 2: Backend Email Strings

3. **Write `mailer.strings.test.ts` (CI coverage check — test-first)**
   - Import `SUPPORTED_EMAIL_LANGUAGES` from shared.
   - Import each locale string map from `mailer.strings.ts` (which does not yet exist — test fails with import error).
   - For each locale × email type, assert the map returns a non-empty `{ subject, text, html }`.

4. **Implement `mailer.strings.ts`**
   - Create `packages/backend/src/services/mailer.strings.ts`.
   - For each of the 8 email types, define a `Record<SupportedEmailLanguage, (args) => { subject; text; html }>` constant.
   - Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for date and currency formatting within the string-builder functions.
   - English strings: adapt directly from the current inline strings in `mailer.service.ts`.
   - German strings: translate each email type.

5. **Extend `mailer.service.ts` to accept `locale` parameter**
   - Add `locale: SupportedEmailLanguage = 'en'` parameter to each public `send*` method.
   - Replace inline string construction with a call to the corresponding locale string map from `mailer.strings.ts`.
   - Remove the now-redundant inline subject/body strings from each method.
   - Extend `mailer.service.test.ts`: for each send method, add a test verifying German output when `locale = 'de'`.

### Task Group 3: Backend Routes

6. **Update profile routes to read/write `emailLanguage`**
   - `GET /api/profile/notification-preferences`: add `email_language` to the SELECT query; include `emailLanguage` in the response body.
   - `PATCH /api/profile/notification-preferences`: when `emailLanguage` is present in the validated body, update `email_language` in the DB (either standalone or as part of the existing UPDATE).
   - Extend `profile.route.test.ts` and `notification-preferences.route.test.ts` with assertions for the new field.

7. **Pass `email_language` to mailer at call sites**
   - `NotificationService.sendSummaryEmailForUser`: add `email_language` to the user SELECT query; pass it as `locale` when calling `mailer.sendSummaryEmail`.
   - `routes/profile.ts` (email change flow): after `requestEmailChange`, look up the requesting user's `email_language` and pass it to `sendEmailVerificationEmail`; similarly pass locale to `sendEmailChangeConfirmationEmail` on confirm.
   - `routes/auth.ts` (password reset): look up `email_language` for the target user and pass it to `sendPasswordResetEmail`.
   - `routes/auth.ts` (password change confirmation): look up `email_language` and pass it to `sendPasswordChangeEmail`.
   - `routes/invitations.ts` (welcome on accept): `sendWelcomeEmail` always uses `'en'` for newly invited users (no stored preference yet).
   - Write/extend integration tests for each route to assert the locale is forwarded correctly.

### Task Group 4: Frontend

8. **Add i18n keys for the email language selector**
   - In `en.json`: add `"emailLanguage": { "title": "Email Language", "label": "Language for emails", "en": "English", "de": "Deutsch", "save": "Save email language", "saved": "Email language saved" }`.
   - In `de.json`: add corresponding German translations.
   - The existing `catalogue.test.ts` key-parity test will automatically catch any missing key in either locale.

9. **Update `useNotificationPreferences` hook**
   - The `NotificationPreferences` type from shared already includes `emailLanguage` after Task 1; the hook requires no logic change. Verify the returned `data.emailLanguage` is accessible.

10. **Add Email Language selector to `AccountSettings.tsx`**
    - Add a new `<Paper>` section (between the Summary Email section and Display Name section, or grouped within notification preferences).
    - Use Mantine `SegmentedControl` with options built from `SUPPORTED_EMAIL_LANGUAGES` (same pattern as the frequency picker).
    - Local state: `const [emailLanguage, setEmailLanguage] = useState(notifPrefs?.emailLanguage ?? 'en')`.
    - Sync state from `notifPrefs` in `useEffect` (same pattern as `summaryEnabled`/`summaryFrequency`).
    - Save button calls `updatePreferences({ emailLanguage })` — the same mutation already handles partial updates.
    - Show success/error toast using `showSuccess(t('emailLanguage.saved'))` / `showError(t('accountSettings.errorGeneric'))`.
    - Extend `AccountSettings.test.tsx`: assert the selector renders, updates local state, and calls `updatePreferences` with the correct locale on save.

### Task Group 5: Documentation

11. **Update README.md and README.de.md** — document the email language preference feature.
12. **Update docs/user-guide.md and docs/user-guide.de.md** — explain how to find and change the email language setting and what it affects.

## Complexity Tracking

> No constitution violations to justify.
