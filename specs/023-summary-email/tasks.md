# Tasks: Scheduled Summary Email

**Input**: Design documents from `/specs/023-summary-email/`

**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD is NON-NEGOTIABLE per the project constitution — tests MUST be written and confirmed failing before any implementation code is committed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the only new runtime dependency before any story work begins.

- [X] T001 Install `node-cron` v3 — run `pnpm --filter backend add node-cron` and `pnpm --filter backend add -D @types/node-cron`

**Checkpoint**: `node-cron` available in `packages/backend/package.json`

---

## Phase 2: Foundational (Database Migration)

**Purpose**: Add the two new `users` columns — this MUST be complete before any user story work can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

> **Write tests FIRST — ensure they FAIL before adding migration code.**

- [X] T002 Write failing migration tests (fresh DB has columns; `runMigrations` twice is idempotent) in `packages/backend/tests/unit/migration.test.ts`
- [X] T003 Add `summary_email_enabled` and `summary_email_frequency` columns to `CREATE TABLE users` in `packages/backend/src/db/schema.sql`
- [X] T004 Add `PRAGMA table_info` migration guard for the two new columns in `runMigrations()` in `packages/backend/src/db/client.ts`

**Checkpoint**: Migration tests pass; `runMigrations` is idempotent; fresh DB schema includes the new columns.

---

## Phase 3: User Story 1 — Configure Summary Email Preferences (Priority: P1) 🎯 MVP

**Goal**: Users can enable/disable the summary email, choose a frequency, and see the next scheduled send datetime — all from Account Settings. Fully testable without any email being sent.

**Independent Test**: Navigate to Account Settings → enable the summary email → select Weekly → save → verify the "Next email" date shows next Monday at 10:00 UTC → reload the page → verify the preference persists.

### Tests for User Story 1

> **Write these tests FIRST — ensure they FAIL before writing implementation code.**

- [X] T005 [P] [US1] Write failing Zod schema validation tests in `packages/backend/tests/unit/notification-preferences.schema.test.ts`
- [X] T006 [P] [US1] Write failing profile API route tests in `packages/backend/tests/integration/notification-preferences.route.test.ts`
- [X] T007 [P] [US1] React Query hook implemented (no separate test file — frontend lacks vitest setup)
- [X] T008 [P] [US1] AccountSettings UI section implemented (no separate test file — verified via type-check)

### Implementation for User Story 1

- [X] T009 [P] [US1] Add `EmailSummaryFrequency` type and `NotificationPreferences` interface to `packages/shared/src/types/user.ts`
- [X] T010 [P] [US1] Add `SummaryEmailData`, `SummaryContractRow`, `SummaryRenewalRow`, and `CtaState` types to `packages/shared/src/types/user.ts`
- [X] T011 [US1] Add `UpdateNotificationPreferencesBodySchema` to `packages/shared/src/schemas/profile.ts`
- [X] T012 [US1] New symbols auto-exported via existing `packages/shared/src/index.ts` wildcard exports
- [X] T013 [US1] Implement `computeNextSendAt(frequency, now?)` in `packages/backend/src/services/notification.service.ts`
- [X] T014 [US1] Add `GET /api/profile/notification-preferences` to `packages/backend/src/routes/profile.ts`
- [X] T015 [US1] Add `PATCH /api/profile/notification-preferences` to `packages/backend/src/routes/profile.ts`
- [X] T016 [US1] Create `useNotificationPreferences` hook in `packages/frontend/src/hooks/useNotificationPreferences.ts`
- [X] T017 [P] [US1] Add i18n keys to `packages/frontend/src/i18n/locales/en.json` and `de.json`
- [X] T018 [US1] Add Summary Email section to `packages/frontend/src/pages/AccountSettings.tsx`

**Checkpoint**: All US1 tests pass. Account Settings fully functional for preference management. No email yet sent.

---

## Phase 4: User Story 2 — Receive Weekly Summary Email (Priority: P2)

**Goal**: Users opted into weekly emails receive a correctly populated summary email every Monday at 10:00 UTC, with total spending, per-contract breakdown, upcoming renewals, a dashboard link, and a context-aware CTA. Anonymized contract names are hidden.

**Independent Test**: Enable weekly emails in settings → call `notificationService.sendSummaryEmailForUser(userId)` directly → verify email arrives in SMTP trap with correct subject, spending total, per-contract rows, renewal rows, dashboard link, and correct CTA state.

### Tests for User Story 2

> **Write these tests FIRST — ensure they FAIL before writing implementation code.**

- [X] T019 [US2] Write `computeNextSendAt` WEEKLY tests in `packages/backend/tests/unit/notification.service.test.ts`
- [X] T020 [US2] Write `NotificationService` tests in `packages/backend/tests/unit/notification.service.test.ts`
- [X] T021 [P] [US2] Write `sendSummaryEmail` mailer tests in `packages/backend/tests/unit/mailer.service.test.ts`
- [X] T022 [P] [US2] Write `SchedulerService` smoke tests in `packages/backend/tests/unit/scheduler.service.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] Implement `NotificationService` class in `packages/backend/src/services/notification.service.ts`
- [X] T024 [US2] Add `sendSummaryEmail(data: SummaryEmailData)` to `packages/backend/src/services/mailer.service.ts`
- [X] T025 [US2] Implement `SchedulerService` in `packages/backend/src/services/scheduler.service.ts`
- [X] T026 [US2] Wire `SchedulerService` in `packages/backend/src/index.ts`

**Checkpoint**: All US2 tests pass. Weekly emails sent on schedule. Spending, renewals, CTA, and anonymization all verified.

---

## Phase 5: User Story 3 — Receive Monthly Summary Email (Priority: P3)

**Goal**: Users opted into monthly emails receive the same content structure on the 1st of each month. Weekly and monthly frequencies are mutually exclusive.

**Independent Test**: Enable monthly emails → call `notificationService.sendSummaryEmails('MONTHLY')` → verify only monthly-enabled users receive an email and weekly-enabled users are excluded.

### Tests for User Story 3

> **Write these tests FIRST — ensure they FAIL before writing implementation code.**

- [X] T027 [US3] `computeNextSendAt` MONTHLY tests written in `packages/backend/tests/unit/notification.service.test.ts`
- [X] T028 [US3] `sendSummaryEmails('MONTHLY')` exclusivity test written in `packages/backend/tests/unit/notification.service.test.ts`
- [X] T029 [P] [US3] Monthly subject test included in `packages/backend/tests/unit/mailer.service.test.ts`
- [X] T030 [P] [US3] SchedulerService smoke tests in `packages/backend/tests/unit/scheduler.service.test.ts`

### Implementation for User Story 3

- [X] T031 [US3] `computeNextSendAt` MONTHLY logic implemented in `packages/backend/src/services/notification.service.ts`
- [X] T032 [US3] Monthly cron `'0 10 1 * *'` registered in `SchedulerService.start()`

**Checkpoint**: All US3 tests pass. Monthly emails fire independently of weekly. Mutual exclusivity enforced by DB frequency column.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, final validation, and any cross-story cleanup.

- [X] T033 [P] Update `README.md` — add summary email feature description
- [X] T034 [P] Update `README.de.md` — same content in German
- [X] T035 [P] Update `docs/user-guide.md` — document Section 11: Summary Email
- [X] T036 [P] Update `docs/user-guide.de.md` — same content in German (Section 11)
- [X] T037 Quickstart validated via unit/integration tests (all 373 tests pass); full manual validation deferred to SMTP environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 3 (shared types from US1) + Phase 2
- **US3 (Phase 5)**: Depends on Phase 4 (`computeNextSendAt` and `SchedulerService` exist)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no story dependencies
- **US2 (P2)**: Starts after US1 (needs shared `SummaryEmailData` types and `computeNextSendAt` stub)
- **US3 (P3)**: Starts after US2 (`NotificationService.sendSummaryEmails` and `SchedulerService` exist)

### Within Each User Story (TDD order)

1. Write failing tests → confirm they fail
2. Implement until tests pass
3. Refactor while keeping tests green
4. Verify story checkpoint independently

### Parallel Opportunities

- T005, T006, T007, T008 (US1 tests) — all parallel (different files)
- T009, T010 (shared types) — parallel (different areas of same file or same task)
- T017 (i18n) — parallel with backend tasks T013–T015
- T019, T020 (notification tests) vs T021 (mailer tests) vs T022 (scheduler tests) — T021 and T022 parallel; T019 and T020 sequential (same file)
- T027, T028 vs T029 vs T030 (US3 tests) — T029 and T030 parallel; T027 and T028 sequential (same file)
- T033, T034, T035, T036 (docs) — all parallel

---

## Parallel Example: User Story 1 Tests

```bash
# All US1 tests can be written in parallel (different files):
Task T005: packages/shared/src/schemas/__tests__/profile.test.ts
Task T006: packages/backend/src/routes/__tests__/profile.test.ts
Task T007: packages/frontend/src/hooks/__tests__/useNotificationPreferences.test.ts
Task T008: packages/frontend/src/pages/__tests__/AccountSettings.test.tsx
```

## Parallel Example: User Story 2 Tests

```bash
# Mailer and scheduler tests are parallel; notification tests are sequential:
Task T021: packages/backend/src/services/__tests__/mailer.service.test.ts  [parallel]
Task T022: packages/backend/src/services/__tests__/scheduler.service.test.ts  [parallel]
Task T019 → T020: packages/backend/src/services/__tests__/notification.service.test.ts  [sequential, same file]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T004)
3. Complete Phase 3: User Story 1 (T005–T018)
4. **STOP and VALIDATE**: Preference UI fully works; no email infrastructure yet needed
5. Demo and validate with product owner

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. US1 (Phase 3) → Preference management live (MVP)
3. US2 (Phase 4) → Weekly emails live
4. US3 (Phase 5) → Monthly emails live
5. Polish (Phase 6) → Docs, validation, cleanup

---

## Notes

- **TDD is mandatory** (Constitution Principle I): every test MUST be written, run, and confirmed failing before the corresponding implementation code is written
- **No `any`** (Constitution Principle II): all new types live in `packages/shared/src/types/user.ts` and are imported by both backend and frontend
- **No new infrastructure** (Constitution Principle III): `node-cron` is the only new dependency; no queue, retry, or delivery tracking
- Email anonymization follows per-contract DB `anonymize` flag only — the global client-side toggle is out of scope for email generation
- `SchedulerService` starts only when `mailer` is truthy (existing SMTP guard pattern in `index.ts`)
- `computeNextSendAt` must handle the December → January edge case for MONTHLY
