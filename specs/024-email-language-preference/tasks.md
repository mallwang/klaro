# Tasks: Email Language Preference

**Input**: Design documents from `specs/024-email-language-preference/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: TDD is mandatory (Constitution Principle I). Test tasks are written first and must FAIL before implementation begins.

**Organization**: Tasks grouped by user story. US1 (language selector) is the MVP; US2–US4 build on it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent files, no blocking dependencies)
- **[Story]**: User story label (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: No new project scaffolding required — this is an extension of an existing monorepo. Only a new module file needs to be bootstrapped.

- [X] T001 Create empty module file `packages/backend/src/services/mailer.strings.ts` (needed so Phase 2 imports compile; initially exports nothing)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, DB migration, and Zod schema changes that ALL user stories depend on. No user story work can begin until this phase is complete.

> **⚠️ CRITICAL**: Write tests FIRST (T002, T005) and confirm they FAIL before writing implementation code (T003, T004, T006, T007).

- [X] T002 Write failing migration test: assert `users` table contains `email_language` column after `runMigrations` in `packages/backend/tests/unit/migration.test.ts`
- [X] T003 Update `packages/backend/src/db/schema.sql` — add `email_language TEXT NOT NULL DEFAULT 'en' CHECK(email_language IN ('en','de'))` to the `CREATE TABLE IF NOT EXISTS users` definition
- [X] T004 Add migration guard to `packages/backend/src/db/client.ts` — `PRAGMA table_info(users)` check for `email_language`; `ALTER TABLE users ADD COLUMN email_language TEXT NOT NULL DEFAULT 'en' CHECK(email_language IN ('en','de'))` when absent (matches existing guard pattern for `summary_email_enabled`)
- [X] T005 Write failing schema test: assert `UpdateNotificationPreferencesBodySchema` accepts and rejects `emailLanguage` in `packages/backend/tests/unit/notification-preferences.schema.test.ts`
- [X] T006 [P] Add `SUPPORTED_EMAIL_LANGUAGES = ['en', 'de'] as const` and `type SupportedEmailLanguage` to `packages/shared/src/types/user.ts`
- [X] T007 [P] Extend `NotificationPreferences` interface in `packages/shared/src/types/user.ts` with `emailLanguage: SupportedEmailLanguage`
- [X] T008 Extend `UpdateNotificationPreferencesBodySchema` in `packages/shared/src/schemas/profile.ts` — add optional `emailLanguage: z.enum(SUPPORTED_EMAIL_LANGUAGES)` field (import `SUPPORTED_EMAIL_LANGUAGES` from `./user` — note: may need to re-export from shared index or import directly)

**Checkpoint**: Migration test passes. Schema test passes. Shared type exports compile without errors across both packages.

---

## Phase 3: User Story 1 — Select Email Language in Account Settings (Priority: P1) 🎯 MVP

**Goal**: Users can open Account Settings, see a language selector for emails, change it, save it, and see the correct value on reload. No email is sent in this story.

**Independent Test**: Navigate to Account Settings → change email language to Deutsch → save → reload page → selector shows Deutsch. Confirm via `GET /api/profile/notification-preferences` that `emailLanguage` is `"de"`.

> **Write tests FIRST (T009, T010, T013) — confirm they FAIL before implementing T011, T012, T014, T015, T016.**

- [X] T009 Write failing integration test: `GET /api/profile/notification-preferences` returns `emailLanguage: "en"` (default) in `packages/backend/tests/integration/notification-preferences.route.test.ts`
- [X] T010 Write failing integration test: `PATCH /api/profile/notification-preferences` with `{ emailLanguage: "de" }` persists value and subsequent GET returns `"de"` in `packages/backend/tests/integration/notification-preferences.route.test.ts`
- [X] T011 Update `GET /api/profile/notification-preferences` handler in `packages/backend/src/routes/profile.ts` — add `email_language` to the SELECT query and include `emailLanguage` in the JSON response
- [X] T012 Update `PATCH /api/profile/notification-preferences` handler in `packages/backend/src/routes/profile.ts` — when `body.data.emailLanguage` is present, include `email_language = ?` in the UPDATE statement
- [X] T013 Write failing unit test: `AccountSettings` renders an "Email Language" section with "English" and "Deutsch" options, saves correctly via `updatePreferences` in `packages/frontend/tests/unit/AccountSettings.test.tsx`
- [X] T014 [P] Add `emailLanguage` i18n keys to `packages/frontend/src/i18n/locales/en.json`: `"emailLanguage": { "title": "Email Language", "label": "Language for emails", "en": "English", "de": "Deutsch", "save": "Save email language", "saved": "Email language saved" }`
- [X] T015 [P] Add `emailLanguage` i18n keys to `packages/frontend/src/i18n/locales/de.json` with German translations (title: "E-Mail-Sprache", label: "Sprache für E-Mails", en: "Englisch", de: "Deutsch", save: "E-Mail-Sprache speichern", saved: "E-Mail-Sprache gespeichert")
- [X] T016 Add Email Language selector panel to `packages/frontend/src/pages/AccountSettings.tsx` — new `<Paper>` section using Mantine `SegmentedControl` with options from `SUPPORTED_EMAIL_LANGUAGES`; local `emailLanguage` state synced from `notifPrefs.emailLanguage`; save button calls `updatePreferences({ emailLanguage })` with success/error toasts using `showSuccess(t('emailLanguage.saved'))` / `showError(t('accountSettings.errorGeneric'))`

**Checkpoint**: Unit test and integration tests pass. `GET` returns `emailLanguage`. `PATCH` with `emailLanguage` persists correctly. Frontend selector visible and functional.

---

## Phase 4: User Story 2 — Transactional Emails in Preferred Language (Priority: P2)

**Goal**: When a user with email language set to German triggers an email-address change or password reset, the received email is in German with locale-formatted dates and amounts.

**Independent Test**: Set `emailLanguage = "de"` via Account Settings. Request an email change. Verify received email is in German with `DD.MM.YYYY` date format.

> **Write tests FIRST (T017, T019) — confirm they FAIL before implementing T018, T020, T021, T022, T023.**

- [X] T017 Write failing CI coverage test in `packages/backend/tests/unit/mailer.strings.test.ts`: import each string map from `mailer.strings.ts` and assert every `SupportedEmailLanguage` entry produces a non-empty `{ subject, text, html }` for all 8 email types (test will fail with import error until T018)
- [X] T018 Write failing unit tests for locale variants in `packages/backend/tests/unit/mailer.service.test.ts`: for each `send*` method, assert that passing `locale: 'de'` produces German subject and body (will fail until T020)
- [X] T019 [P] Implement `packages/backend/src/services/mailer.strings.ts` — define `Record<SupportedEmailLanguage, (args) => { subject: string; text: string; html: string }>` for all 8 email types: `testEmailStrings`, `welcomeEmailStrings`, `passwordChangeEmailStrings`, `emailChangeConfirmationStrings`, `emailVerificationStrings`, `invitationEmailStrings`, `passwordResetEmailStrings`, `summaryEmailStrings`. English strings: extracted from existing inline strings in `mailer.service.ts`. German strings: translated equivalents with `Intl.DateTimeFormat('de')` and `Intl.NumberFormat('de')` for date/currency values.
- [X] T020 Refactor `packages/backend/src/services/mailer.service.ts` — add `locale: SupportedEmailLanguage = 'en'` parameter to each `send*` method; replace inline subject/body string construction with a call to the corresponding locale string map from `mailer.strings.ts`
- [X] T021 Write failing integration test: email change request for a user with `email_language = 'de'` triggers German verification email (spy on mailer) in `packages/backend/tests/integration/profile.route.test.ts`
- [X] T022 Look up and forward `email_language` in email-change call sites in `packages/backend/src/routes/profile.ts`: (a) in `POST /api/profile/email-change`: query `email_language` for `request.user!.id`, pass as `locale` to `sendEmailVerificationEmail`; (b) in `POST /api/profile/email-change/:token/confirm`: use `email_language` from the confirmed user row, pass to `sendEmailChangeConfirmationEmail`
- [X] T023 Look up and forward `email_language` in `packages/backend/src/routes/auth.ts`: (a) password reset request — query `email_language` for target user, pass to `sendPasswordResetEmail`; (b) password change confirmation — query `email_language` for `request.user!.id`, pass to `sendPasswordChangeEmail`
- [X] T024 Use default `'en'` locale for invitation accept welcome email in `packages/backend/src/routes/invitations.ts` — new user has no stored preference; pass `locale: 'en'` explicitly to `sendWelcomeEmail`

**Checkpoint**: `mailer.strings.test.ts` passes for all locales × email types. `mailer.service.test.ts` German locale assertions pass. Profile and auth route integration tests assert locale is forwarded.

---

## Phase 5: User Story 3 — Summary Emails in Preferred Language (Priority: P3)

**Goal**: Weekly and monthly summary emails are generated and sent in each user's stored language with locale-formatted dates and amounts.

**Independent Test**: Set email language to German for a test user. Run `npx tsx src/scripts/send-summary-email.ts WEEKLY <user-id>`. Verify received email is entirely in German with `DD.MM.YYYY` dates and German number formatting.

> **Write tests FIRST (T025) — confirm they FAIL before implementing T026.**

- [X] T025 Write failing unit test in `packages/backend/tests/unit/notification.service.test.ts`: when a user has `email_language = 'de'`, `sendSummaryEmailForUser` calls `mailer.sendSummaryEmail` with `locale: 'de'` (spy/mock assertion)
- [X] T026 Update `sendSummaryEmailForUser` in `packages/backend/src/services/notification.service.ts` — add `email_language` to the user SELECT query; pass it as `locale` when calling `mailer.sendSummaryEmail`; also update `sendSummaryEmails` to ensure `email_language` is available per user in the batch path

**Checkpoint**: Notification service test passes. Running `send-summary-email.ts WEEKLY <german-user-id>` produces a German email verified via mail inbox.

---

## Phase 6: User Story 4 — Email Templates Kept in Sync Across Languages (Priority: P4)

**Goal**: The CI check (`mailer.strings.test.ts`, written in Phase 4) already asserts full locale × email-type coverage. This phase ensures the guard also detects when a NEW language is added without matching templates.

**Independent Test**: Temporarily add `'it'` to `SUPPORTED_EMAIL_LANGUAGES`, run `mailer.strings.test.ts` without adding Italian strings — test must fail with a clear message. Revert after confirming.

> **T017 (written in Phase 4) already provides this guard. This phase adds one additional structural assertion.**

- [X] T027 Extend `packages/backend/tests/unit/mailer.strings.test.ts` with a structural test: assert that the set of keys in each locale string map exactly equals `new Set(SUPPORTED_EMAIL_LANGUAGES)` — this catches the case where a locale is added to the constant but no string entry is added to the map

**Checkpoint**: Adding a new language to `SUPPORTED_EMAIL_LANGUAGES` without adding string maps causes `mailer.strings.test.ts` to fail immediately, blocking CI.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, README updates, and final validation run.

- [X] T028 [P] Update `README.md` — add section describing the email language preference feature (where to find it, what it affects, independence from browser language)
- [X] T029 [P] Update `README.de.md` — German equivalent of T028, consistent with English version
- [X] T030 [P] Update `docs/user-guide.md` — add user-facing documentation for email language preference: how to find and change the setting, what emails are affected, fallback behaviour
- [X] T031 [P] Update `docs/user-guide.de.md` — German equivalent of T030, consistent with English version
- [X] T032 Run all quickstart.md validation scenarios (Scenarios 1–8) and confirm each passes; fix any regressions found

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational) ──────────────────────────────────────────────┐
        └─► Phase 3 (US1 - Language Selector) ────────────────────────┐   │
              └─► Phase 4 (US2 - Transactional Emails) ───────────┐   │   │
                    └─► Phase 5 (US3 - Summary Emails) ────────┐   │   │   │
                          └─► Phase 6 (US4 - CI Check) ─────┐  │   │   │   │
                                                             └──┴───┴───┴───┘
                                                             Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2. Unblocks US2, US3, US4.
- **US2 (P2)**: Requires Phase 2 + US1 (shares `email_language` DB column and API).
- **US3 (P3)**: Requires Phase 2 + US1 (reads `email_language` from user row). Can be implemented in parallel with US2.
- **US4 (P4)**: The CI check test (T017) is written as part of US2 Phase 4. T027 is a standalone extension. No blocking dependency on US2/US3 completion — it can be verified independently once `mailer.strings.ts` exists.

### Within Each Phase

1. Failing tests written and confirmed to fail **before** implementation tasks begin
2. DB/schema changes before route changes
3. Shared types before frontend and backend consumers
4. `mailer.strings.ts` before `mailer.service.ts` refactor
5. Backend API complete before frontend hook/component changes
6. Implementation before polish/docs

### Parallel Opportunities

**Within Phase 2**:
- T006 and T007 can run in parallel (both edit `types/user.ts` but different lines — or batch into one commit)
- T003 and T008 can run in parallel (different files)

**Within Phase 3**:
- T014 and T015 can run in parallel (different JSON files)
- T009 and T010 can be written together (same test file, same session)

**Within Phase 4**:
- T019 (`mailer.strings.ts`) can be started once T017 exists (need the import to exist)
- T022 and T023 can run in parallel (different route files)

**Phase 7**: All polish tasks (T028–T031) can run in parallel.

---

## Parallel Example: Phase 4 (US2)

```text
# Step 1: Write tests first (sequential, same file):
T017 — mailer.strings.test.ts (coverage check, fails immediately)
T018 — mailer.service.test.ts (locale variant assertions)

# Step 2: Once tests exist, these can run in parallel:
T019 — mailer.strings.ts (new file, independent)
  ↓ (once T019 exists)
T020 — mailer.service.ts (depends on T019)

# Step 3: Route call-site updates in parallel:
T022 — routes/profile.ts (email change)
T023 — routes/auth.ts (password reset/change)
T024 — routes/invitations.ts (welcome email)
```

---

## Implementation Strategy

### MVP (User Story 1 Only — Phases 1–3)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T008)
3. Complete Phase 3: User Story 1 (T009–T016)
4. **VALIDATE**: Run backend integration tests + AccountSettings unit test. Confirm `GET` and `PATCH` work. Confirm selector renders and saves.

MVP delivers: users can set and persist an email language preference. Emails not yet localized.

### Incremental Delivery

- Phases 1–3 → Language preference saved (MVP)
- Phase 4 → Transactional emails localized
- Phase 5 → Summary emails localized
- Phase 6 → CI guard enforced for future locales
- Phase 7 → Docs complete

---

## Notes

- `[P]` tasks operate on different files and have no blocking dependencies within their phase
- Every `[Story]` task maps directly to one of the 4 user stories in spec.md
- The existing `catalogue.test.ts` in the frontend automatically validates i18n key parity between `en.json` and `de.json` — no separate key-parity test needed for T014/T015
- `Intl.DateTimeFormat` and `Intl.NumberFormat` are Node.js built-ins — no new dependency needed
- `sendTestEmail` always uses `'en'` (admin utility, no user preference to look up)
- `sendInvitationEmail` always uses `'en'` (invited user has no account yet)
- Fallback to `'en'` for unknown stored locale is handled inside each send method (check if locale is in `SUPPORTED_EMAIL_LANGUAGES`, default to `'en'` and log a warning if not)
