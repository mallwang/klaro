# Tasks: Account Profile Settings

**Input**: Design documents from `specs/017-account-profile-settings/`

**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/profile-api.md ✓, quickstart.md ✓

**Constitution**: TDD is NON-NEGOTIABLE — every failing test MUST be committed and confirmed to fail before implementation code is written. `tsc --noEmit` must pass at every phase boundary.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: Maps to user story from spec.md (US1–US4)
- Exact file paths included in every task

---

## Phase 1: Setup (Shared Schemas)

**Purpose**: Create the shared Zod schemas that both backend (validation) and frontend (typing) depend on. Must be complete before any backend or frontend work starts.

- [X] T001 Create packages/shared/src/schemas/profile.ts with UpdateDisplayNameBodySchema, RequestEmailChangeBodySchema, PendingEmailChangeSchema; export all three from packages/shared/src/index.ts

**Checkpoint**: `pnpm --filter shared build` must succeed before proceeding.

---

## Phase 2: Foundational (Database Migration)

**Purpose**: Extend the DB schema with the `email_verifications` table. All ProfileService methods for US3/US4 depend on this.

- [X] T002 Add email_verifications CREATE TABLE + idx_email_verifications_user CREATE UNIQUE INDEX migration to runMigrations in packages/backend/src/db/client.ts; add EmailVerificationRow interface to same file

**Checkpoint**: Every subsequent integration test's `beforeEach` will exercise this migration automatically.

---

## Phase 3: User Story 1 — Update Display Name (Priority: P1) 🎯 MVP

**Goal**: Any authenticated user can change their display name from `/account`; the sidebar reflects the change immediately.

**Independent Test**: Sign in → navigate to `/account` → update display name → confirm sidebar updates without page reload → refresh and confirm persistence.

### Tests for User Story 1 (TDD: Write and confirm FAILING before implementation)

- [X] T003 [P] [US1] Write failing ProfileService.updateDisplayName unit tests (valid user → 'updated' with DB check; unknown user → 'not-found') in packages/backend/tests/unit/profile.service.test.ts
- [X] T004 [P] [US1] Write failing integration tests for PATCH /api/profile (204 for valid body; name updated in DB; 400 for empty name; 401 without auth) in packages/backend/tests/integration/profile.route.test.ts
- [X] T005 [P] [US1] Write failing frontend unit tests for AccountSettings display name section (pre-filled input; valid submit calls updateDisplayName + shows success; empty submit blocked client-side) in packages/frontend/tests/unit/AccountSettings.test.tsx

### Implementation for User Story 1

- [X] T006 [P] [US1] Implement ProfileService class with updateDisplayName method in packages/backend/src/services/profile.service.ts (depends on T003)
- [X] T007 [P] [US1] Create packages/frontend/src/services/profile.ts with typed updateDisplayName fetch wrapper following auth.ts/users.ts pattern (depends on T005)
- [X] T008 [US1] Implement PATCH /api/profile route with UpdateDisplayNameBodySchema validation in packages/backend/src/routes/profile.ts (depends on T004, T006)
- [X] T009 [US1] Register profileRoutes in packages/backend/src/server.ts via `fastify.register(profileRoutes)` (depends on T008)
- [X] T010 [US1] Add Display Name section (`<Paper>`) to packages/frontend/src/pages/AccountSettings.tsx with pre-filled input, save button calling updateDisplayName + invalidating CURRENT_USER_QUERY_KEY, success/error alerts, and i18n keys accountSettings.displayNameLabel + accountSettings.displayNameSuccess in locale files (depends on T005, T007)

**Checkpoint**: US1 independently functional and testable. `pnpm --filter backend test` and `pnpm --filter frontend test` must pass.

---

## Phase 4: User Story 2 — Display User Info in Sidebar (Priority: P1)

**Goal**: The bottom-left sidebar permanently shows a user avatar icon, the current user's display name, and their role label (Admin / Member) on every authenticated page.

**Independent Test**: Sign in as any user → observe sidebar footer contains avatar icon, display name, and correct role label — no navigation required.

### Tests for User Story 2 (TDD: Write and confirm FAILING before implementation)

- [X] T011 [P] [US2] Write failing unit tests for NavbarSegmented user section in packages/frontend/tests/unit/AppShell.test.tsx: renders avatar element; renders "Admin" role label for ADMIN user; renders "Member" for MEMBER user

### Implementation for User Story 2

- [X] T012 [P] [US2] Add nav.roleAdmin and nav.roleMember i18n keys to all locale files (e.g. packages/frontend/src/locales/en.json)
- [X] T013 [US2] Update userSection in packages/frontend/src/components/AppShell/NavbarSegmented.tsx: wrap display name in `<Group>` with `<Avatar size="sm" radius="xl" color="teal"><IconUser size={14} /></Avatar>` and a role label `<Text size="xs" c="dimmed">` using nav.roleAdmin/nav.roleMember; add Avatar to Mantine imports (depends on T011, T012)

**Checkpoint**: US2 independently functional. Sidebar visible on every authenticated page with avatar + name + role.

---

## Phase 5: User Story 3 — Request Email Address Change (Priority: P2)

**Goal**: An authenticated user can submit a new email address from `/account`; the system sends a verification email to the new address and shows a pending-verification notice on return.

**Independent Test**: Navigate to `/account` → enter new email → submit → receive "check inbox" message → return to `/account` → see pending notice; also test 409 for duplicate email.

### Tests for User Story 3 (TDD: Write and confirm FAILING before implementation)

- [X] T014 [P] [US3] Add failing unit tests for ProfileService.requestEmailChange (available email → 'requested' + row inserted; re-request supersedes old token; email used by active user → 'duplicate') and getPendingEmailChange (fresh token → pending email; expired → null; no row → null) to packages/backend/tests/unit/profile.service.test.ts
- [X] T015 [P] [US3] Add failing integration tests for POST /api/profile/email-change (202 + token row created; 409 for duplicate; 400 for invalid format; 401 without auth) and GET /api/profile/email-change/pending (returns pendingEmail; null when none) to packages/backend/tests/integration/profile.route.test.ts
- [X] T016 [P] [US3] Add failing frontend unit tests for AccountSettings email change section (renders current email read-only; renders pending notice when pendingEmail non-null; valid submit calls requestEmailChange + shows "check inbox"; 409 shown as conflict error) to packages/frontend/tests/unit/AccountSettings.test.tsx

### Implementation for User Story 3

- [X] T017 [US3] Add requestEmailChange (randomBytes token, 24h expiry, delete+insert in transaction, duplicate check) and getPendingEmailChange (returns non-expired pending email or null) methods to packages/backend/src/services/profile.service.ts (depends on T014)
- [X] T018 [P] [US3] Add sendEmailVerificationEmail(to, link, expiresAt) method to packages/backend/src/services/mailer.service.ts following sendInvitationEmail pattern (depends on T017 for route wiring; can be coded in parallel with T017)
- [X] T019 [US3] Add POST /api/profile/email-change (202 on success, 409 on duplicate, 502 on mailer failure with token rollback) and GET /api/profile/email-change/pending routes to packages/backend/src/routes/profile.ts (depends on T015, T017, T018)
- [X] T020 [US3] Add requestEmailChange and getPendingEmailChange typed fetch wrappers to packages/frontend/src/services/profile.ts (depends on T007)
- [X] T021 [US3] Add Email Address section (`<Paper>`) to packages/frontend/src/pages/AccountSettings.tsx: read-only current email display; pending notice when getPendingEmailChange returns non-null; new-email input + submit calling requestEmailChange + "check inbox" message on 202; inline 409 conflict error; i18n keys accountSettings.emailSectionTitle, accountSettings.pendingEmailNotice, accountSettings.newEmailLabel, accountSettings.emailChangeSubmitLabel, accountSettings.emailChangeSent, accountSettings.emailChangeConflict in locale files (depends on T016, T020)

**Checkpoint**: US3 independently functional. POST /api/profile/email-change and GET pending work end-to-end. All unit + integration tests pass.

---

## Phase 6: User Story 4 — Confirm Email Address Change (Priority: P2)

**Goal**: Clicking the verification link at `/email-change/confirm/:token` updates the user's email and shows a success, expired, or not-found state — no session required.

**Independent Test**: Complete US3 flow → open verification link in incognito window → confirm success page; also test expired and unknown-token states.

### Tests for User Story 4 (TDD: Write and confirm FAILING before implementation)

- [X] T022 [P] [US4] Add failing unit tests for ProfileService.confirmEmailChange (valid token → 'confirmed' + users.email updated + row deleted; expired → 'expired' + row deleted; unknown → 'not-found') to packages/backend/tests/unit/profile.service.test.ts
- [X] T023 [P] [US4] Add failing integration tests for POST /api/profile/email-change/:token/confirm (200 confirmed; 410 expired; 404 unknown token; no session required) to packages/backend/tests/integration/profile.route.test.ts
- [X] T024 [P] [US4] Write failing unit tests for EmailVerifyConfirm page (shows loading state; shows success message on resolve; shows expired message on 410; shows not-found message on 404) in packages/frontend/tests/unit/EmailVerifyConfirm.test.tsx

### Implementation for User Story 4

- [X] T025 [US4] Add confirmEmailChange method (lookup token; return 'not-found' if absent; delete + return 'expired' if past expires_at; update users.email + delete row in transaction for valid token) to packages/backend/src/services/profile.service.ts (depends on T022)
- [X] T026 [US4] Add POST /api/profile/email-change/:token/confirm route (200/'confirmed', 410/'expired', 404/'not-found') to packages/backend/src/routes/profile.ts (depends on T023, T025)
- [X] T027 [US4] Add confirm path regex `(m, p) => m === 'POST' && /^\/api\/profile\/email-change\/[^/]+\/confirm$/.test(p)` to PUBLIC_ROUTES in packages/backend/src/server.ts (depends on T026)
- [X] T028 [US4] Add confirmEmailChange typed fetch wrapper to packages/frontend/src/services/profile.ts (depends on T020)
- [X] T029 [US4] Create packages/frontend/src/pages/EmailVerifyConfirm.tsx mirroring AcceptInvitation.tsx: reads token from router params, POSTs on mount, shows loading/success/expired/not-found states with i18n keys emailVerify.loading, emailVerify.success, emailVerify.expired, emailVerify.notFound in locale files (depends on T024, T028)
- [X] T030 [US4] Add `<Route path="/email-change/confirm/:token" element={<EmailVerifyConfirm />} />` to public routes in packages/frontend/src/main.tsx (depends on T029)

**Checkpoint**: US4 independently functional. Verification link works in incognito (no session). All four user stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation gates before merge.

- [X] T031 [P] Run `tsc --noEmit` in packages/backend, packages/frontend, and packages/shared; confirm zero type errors with strict mode
- [X] T032 [P] Run full test suites (`pnpm --filter backend test` and `pnpm --filter frontend test`); confirm zero regressions in existing tests
- [ ] T033 Validate all quickstart.md scenarios (sections 3–9) in a running application: sidebar widget, display name update, email change request, verification link confirm, re-request supersedes old token, unauthenticated confirmation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: No dependencies on Phase 1 (different package) — can run concurrently with T001
- **Phase 3 (US1)**: Requires T001 (shared schemas) + T002 (DB migration) to be complete
- **Phase 4 (US2)**: Requires T001 — independent of Phase 3 but shares app shell; best started after Phase 3 checkpoint
- **Phase 5 (US3)**: Requires Phase 3 complete (extends profile.service.ts and profile.ts frontend service)
- **Phase 6 (US4)**: Requires Phase 5 complete (extends same files)
- **Phase 7 (Polish)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 complete — no dependency on other user stories
- **US2 (P1)**: Starts after T001 — no dependency on other user stories (frontend only)
- **US3 (P2)**: Starts after US1 complete (adds to profile.service.ts and frontend profile.ts)
- **US4 (P2)**: Starts after US3 complete (adds to same backend service and frontend service files)

### Within Each User Story

1. Tests MUST be written and confirmed to FAIL before implementation (RED step)
2. Models/interfaces before services
3. Services before routes
4. Backend route before frontend service
5. Frontend service before frontend component

### Parallel Opportunities

- T001 and T002 can run simultaneously (different packages)
- T003, T004, T005 can run simultaneously (writing tests in different files)
- T006 and T007 can run simultaneously (different packages)
- T011 and T012 can run simultaneously (test vs. locale file)
- T014, T015, T016 can run simultaneously (writing tests in different files)
- T017 and T018 can run simultaneously (different service files)
- T022, T023, T024 can run simultaneously (writing tests in different files)
- T031 and T032 can run simultaneously (read-only validation)

---

## Parallel Example: User Story 1 Tests

```bash
# Run all three test tasks in parallel — each touches a different file:
Task T003: packages/backend/tests/unit/profile.service.test.ts
Task T004: packages/backend/tests/integration/profile.route.test.ts
Task T005: packages/frontend/tests/unit/AccountSettings.test.tsx
```

## Parallel Example: User Story 3 Tests

```bash
# Run all three test tasks in parallel:
Task T014: packages/backend/tests/unit/profile.service.test.ts (extend existing)
Task T015: packages/backend/tests/integration/profile.route.test.ts (extend existing)
Task T016: packages/frontend/tests/unit/AccountSettings.test.tsx (extend existing)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1 + Phase 2 (Setup + Foundational)
2. Complete Phase 3 (US1 — display name)
3. Complete Phase 4 (US2 — sidebar widget)
4. **STOP and VALIDATE**: Both P1 stories working independently
5. Demo/deploy if sufficient

### Incremental Delivery

1. Phase 1 + Phase 2 → prerequisites complete
2. Phase 3 → US1 live (display name editing)
3. Phase 4 → US2 live (sidebar widget)
4. Phase 5 → US3 live (email change request)
5. Phase 6 → US4 live (email confirm link)
6. Phase 7 → quality gates passed, ready to merge

---

## Notes

- **[P]** means the task touches different files from other [P] tasks in the same batch — safe to run concurrently
- **[Story]** label maps each task to a specific user story for traceability
- Each user story checkpoint must be validated before the next story begins (single developer)
- TDD is enforced by the constitution: no `git commit` containing implementation without a prior failing test commit
- `tsc --noEmit` must pass before committing any TypeScript file (CI gate)
- The mailer degrades gracefully when SMTP is not configured — same pattern as invitation emails
