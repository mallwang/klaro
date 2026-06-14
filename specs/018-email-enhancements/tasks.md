# Tasks: Email Enhancements

**Input**: Design documents from `specs/018-email-enhancements/`

**Prerequisites**: [plan.md](plan.md) | [spec.md](spec.md) | [research.md](research.md) | [data-model.md](data-model.md) | [contracts/api.md](contracts/api.md)

**TDD note**: Per project constitution (Principle I — NON-NEGOTIABLE), all tests MUST be
written and confirmed failing BEFORE the implementation tasks in each phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No new packages or project structure required — the monorepo, mailer service,
and test infrastructure all exist. Phase 1 is intentionally minimal.

- [X] T001 Confirm all tests currently pass: `pnpm --filter backend test` and `pnpm --filter backend test:integration`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared foundational prerequisites exist — all three user stories are
fully independent and touch separate files. Proceed directly to User Story phases.

*(Phase intentionally empty — no cross-story blocking prerequisites identified.)*

---

## Phase 3: User Story 1 — Admin Test Email (Priority: P1) 🎯 MVP

**Goal**: Admin can send a test email to verify SMTP is working, and sees clear
success/failure feedback in the UI.

**Independent Test**: Sign in as admin, open Accounts admin page, enter an email address,
click "Send test email", confirm email arrives in mail sink (or error is shown). Verify
that a non-admin `POST /api/admin/email/test` request returns 403.

### Tests for User Story 1

> **Write these tests FIRST — they MUST fail before any implementation begins.**

- [X] T002 [P] [US1] Write failing unit tests for `sendTestEmail` in `packages/backend/tests/unit/mailer.service.test.ts` — cover: correct recipient/subject, transport failure throws `MailerError`
- [X] T003 [P] [US1] Write failing integration tests for `POST /api/admin/email/test` in `packages/backend/tests/integration/admin.route.test.ts` — cover: 200 success (mock mailer), 400 bad input, 403 non-admin, 502 mailer error

### Implementation for User Story 1

- [X] T004 [P] [US1] Add `SendTestEmailBodySchema` (and exported `SendTestEmailBody` type) to `packages/shared/src/schemas/profile.ts` and re-export from `packages/shared/src/index.ts`
- [X] T005 [P] [US1] Add `sendTestEmail(to: string): Promise<void>` method to `MailerService` in `packages/backend/src/services/mailer.service.ts` (after T002 is failing)
- [X] T006 [US1] Create `packages/backend/src/routes/admin.ts` — admin-only `onRequest` guard (403 for non-admin) and `POST /api/admin/email/test` handler using `SendTestEmailBodySchema` and `fastify.mailer.sendTestEmail` (depends on T004, T005)
- [X] T007 [US1] Register `adminRoutes` in `packages/backend/src/server.ts` (depends on T006)
- [X] T008 [P] [US1] Add `sendTestEmail(email: string): Promise<void>` function to `packages/frontend/src/services/users.ts` — calls `POST /api/admin/email/test`, throws `AuthError` on non-2xx
- [X] T009 [US1] Add `TestEmailForm` component (pre-fills recipient with signed-in admin's email, shows success/error alert) and its section to `packages/frontend/src/pages/admin/AccountsAdmin.tsx` (depends on T008)

**Checkpoint**: `POST /api/admin/email/test` is live, guarded by ADMIN role, and the admin UI form works end-to-end. Unit and integration tests pass.

---

## Phase 4: User Story 2 — Welcome Email After Invitation Acceptance (Priority: P2)

**Goal**: Invited user automatically receives a welcome confirmation email after their
account is activated, without blocking or rolling back the activation.

**Independent Test**: Complete an invitation acceptance flow (via seeded token or fresh
invitation), confirm account is activated, and verify a welcome email arrives in the mail
sink. Confirm that with SMTP disabled, activation still succeeds and the error is logged.

### Tests for User Story 2

> **Write these tests FIRST — they MUST fail before any implementation begins.**

- [X] T010 [P] [US2] Write failing unit tests for `sendWelcomeEmail` in `packages/backend/tests/unit/mailer.service.test.ts` — cover: correct recipient/subject/body, transport failure throws `MailerError`
- [X] T011 [P] [US2] Write failing integration test in `packages/backend/tests/integration/invitations.route.test.ts` — assert that `POST /api/invitations/:token/accept` calls mock mailer's `sendWelcomeEmail` after successful activation; assert activation still returns 200 when mailer throws

### Implementation for User Story 2

- [X] T012 [P] [US2] Add `sendWelcomeEmail(to: string): Promise<void>` method to `MailerService` in `packages/backend/src/services/mailer.service.ts` (after T010 is failing)
- [X] T013 [US2] Add fire-and-forget `sendWelcomeEmail` call after `acceptAndActivate()` in `packages/backend/src/routes/invitations.ts` — wrap in try/catch, log error, never surface to invitee (depends on T012)

**Checkpoint**: Welcome email is sent on every successful invitation acceptance. Activation is never blocked by a mailer error. Tests pass.

---

## Phase 5: User Story 3 — Confirmation Email After Email Change (Priority: P2)

**Goal**: User automatically receives a confirmation email at their new address after a
successful email-change verification, without blocking the update.

**Independent Test**: Initiate and complete an email-change flow (initiate → verify link →
confirm), and verify a confirmation email arrives at the new address in the mail sink.
Confirm that with SMTP disabled, the email change still completes and the error is logged.

### Tests for User Story 3

> **Write these tests FIRST — they MUST fail before any implementation begins.**

- [X] T014 [P] [US3] Write failing unit tests for `sendEmailChangeConfirmationEmail` in `packages/backend/tests/unit/mailer.service.test.ts` — cover: correct recipient/date in body, transport failure throws `MailerError`
- [X] T015 [P] [US3] Update `packages/backend/tests/unit/profile.service.test.ts` — update `confirmEmailChange` test to expect `{ outcome: 'confirmed', newEmail: string }` return shape (should fail against current implementation)
- [X] T016 [P] [US3] Write failing integration test in `packages/backend/tests/integration/profile.route.test.ts` — assert that `POST /api/profile/email-change/:token/confirm` calls mock mailer's `sendEmailChangeConfirmationEmail` with the new email; assert the change still returns 200 when mailer throws

### Implementation for User Story 3

- [X] T017 [P] [US3] Widen `ConfirmEmailChangeResult` type and update `confirmEmailChange` method to return `{ outcome: 'confirmed'; newEmail: string }` (instead of `'confirmed'`) in `packages/backend/src/services/profile.service.ts` — the `new_email` value is already on the row (after T015 is failing)
- [X] T018 [P] [US3] Add `sendEmailChangeConfirmationEmail(to: string, changedAt: string): Promise<void>` method to `MailerService` in `packages/backend/src/services/mailer.service.ts` (after T014 is failing)
- [X] T019 [US3] Update `POST /api/profile/email-change/:token/confirm` handler in `packages/backend/src/routes/profile.ts` — destructure `result.newEmail` from widened return type and add fire-and-forget `sendEmailChangeConfirmationEmail` call with current timestamp (depends on T017, T018)

**Checkpoint**: Confirmation email is sent on every successful email-change confirmation. The email update is never blocked by a mailer error. Tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] Run full backend test suite and confirm all tests pass: `pnpm --filter backend test` and `pnpm --filter backend test:integration`
- [X] T021 [P] Run type-check across all packages: `pnpm tsc --noEmit` (or per-package equivalent)
- [ ] T022 Run quickstart.md validation scenarios A, B, and C manually against a running app with Mailpit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Empty — no blocking prerequisites
- **Phase 3 (US1)**: No dependencies on US2 or US3 — start after Phase 1
- **Phase 4 (US2)**: No dependencies on US1 or US3 — can start in parallel with Phase 3
- **Phase 5 (US3)**: No dependencies on US1 or US2 — can start in parallel with Phases 3 and 4
- **Phase 6 (Polish)**: Depends on all desired user story phases completing

### User Story Dependencies

- **US1 (P1)**: Independent — no dependencies on US2 or US3
- **US2 (P2)**: Independent — no dependencies on US1 or US3
- **US3 (P2)**: Independent — no dependencies on US1 or US2

### Within Each User Story

- Test tasks (T00x, T01x) MUST be written and confirmed **failing** before implementation tasks begin
- `MailerService` method → route handler (services before callers)
- `SendTestEmailBodySchema` (shared) → backend route → frontend service → frontend UI (US1 only)
- `ProfileService` return type widen → route handler update (US3 only)

### Parallel Opportunities

Within US1: T002 and T003 (test writing) can run in parallel; T004 and T005 (schema + service method) can run in parallel; T008 and T009 are frontend-only and can run in parallel with backend work after T004

Within US2: T010 and T011 (test writing) can run in parallel; T012 and T013 can run in parallel with earlier backend tasks

Within US3: T014, T015, and T016 (test writing) can all run in parallel; T017 and T018 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Step 1 — Write failing tests in parallel:
Task T002: "Write failing unit tests for sendTestEmail in packages/backend/tests/unit/mailer.service.test.ts"
Task T003: "Write failing integration tests in packages/backend/tests/integration/admin.route.test.ts"

# Step 2 — Implement schema + service method in parallel (tests must be failing first):
Task T004: "Add SendTestEmailBodySchema to packages/shared/src/schemas/profile.ts"
Task T005: "Add sendTestEmail to MailerService in packages/backend/src/services/mailer.service.ts"

# Step 3 — Route + frontend service in parallel:
Task T006: "Create packages/backend/src/routes/admin.ts"
Task T008: "Add sendTestEmail to packages/frontend/src/services/users.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify tests pass baseline
2. Complete Phase 3: US1 — admin test email endpoint + UI
3. **STOP and VALIDATE**: Use quickstart.md Scenario A to confirm end-to-end delivery
4. Admin can now diagnose SMTP problems before relying on email for real users

### Incremental Delivery

1. Phase 3 (US1) → Admin can verify SMTP works → MVP delivered
2. Phase 4 (US2) → Invitees receive welcome email → enhanced onboarding
3. Phase 5 (US3) → Users receive email-change confirmation → security/audit signal
4. Each phase is independently shippable without breaking the others

---

## Notes

- `[P]` tasks touch different files and have no blocking dependencies within the same step
- Each story is independently completable, testable, and shippable
- Constitution Principle I: all test tasks MUST be written and confirmed failing before the matched implementation task
- Fire-and-forget pattern (log error, never block): applies to T013 (US2) and T019 (US3)
- No new npm packages required — nodemailer and Zod are already in the project
- No database migrations required
