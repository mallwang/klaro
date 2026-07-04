
# Tasks: Public Self-Service Sign-Up with Admin Approval

**Input**: Design documents from `/specs/036-self-service-signup/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-contracts.md](contracts/api-contracts.md), [quickstart.md](quickstart.md)

**Tests**: Included — Constitution Principle I (Test-First, NON-NEGOTIABLE) requires failing tests before each implementation piece; see plan.md's Constitution Check.

**Organization**: Tasks are grouped by user story (US1–US4, per spec.md priorities P1/P1/P1/P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before touching shared infrastructure. No new dependencies are introduced (per plan.md Principle III — YAGNI).

- [ ] T001 Run the existing backend and frontend test suites (`pnpm --filter backend test`, `pnpm --filter frontend test`) on a clean `036-self-service-signup` checkout to confirm a passing baseline before adding signup code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema/types, the new table, and the service-file skeleton that every user story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Create `SignupRequestStatus` enum in `packages/shared/src/types/signup.ts` (`UNVERIFIED`/`PENDING_REVIEW`/`REJECTED`, mirroring `types/invitation.ts`)
- [ ] T003 [P] Create `SignupRequestSchema`, `CreateSignupRequestBodySchema`, `RejectSignupRequestBodySchema` in `packages/shared/src/schemas/signup.ts` (snake_case-row ↔ camelCase-API mapping, mirroring `schemas/invitation.ts`)
- [ ] T004 Export the new types/schemas from `packages/shared/src/index.ts` (depends on T002, T003)
- [ ] T005 Add the `signup_requests` table DDL and `idx_signup_requests_email` unique index to `packages/backend/src/db/schema.sql` per [data-model.md](data-model.md)
- [ ] T006 Add the `signup_requests` migration and `SignupRequestRow` type to `packages/backend/src/db/client.ts` (depends on T005)
- [ ] T007 Create `packages/backend/src/services/signup-request.service.ts` with a shared blacklist-lookup helper that checks `users` (active/archived), `invitations` (`PENDING`), and `signup_requests` (any status) for a given email (depends on T004, T006)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Public visitor requests an account (Priority: P1) 🎯 MVP

**Goal**: An unauthenticated visitor can submit an email + password and receive a "check your email" confirmation, with duplicate/blacklisted/weak-password submissions rejected.

**Independent Test**: Visit the welcome page signed out, choose "Sign up", submit a new email + password, confirm the UI shows a "check your email" confirmation and no request is created for a duplicate/blacklisted address or a weak password.

### Tests for User Story 1 ⚠️

> Write these tests FIRST; ensure they FAIL before implementation

- [ ] T008 [P] [US1] Write failing tests for `POST /api/signup` in `packages/backend/tests/integration/signup.route.test.ts` (201 success; 409 duplicate/blacklisted email; 400 weak password; 502 when the verification email fails to send)
- [ ] T009 [P] [US1] Write failing tests for `create()` in `packages/backend/tests/unit/signup-request.service.test.ts` (token generation/expiry, blacklist lookup across users/invitations/signup_requests, duplicate rejection)
- [ ] T010 [P] [US1] Write failing test for `sendSignupVerificationEmail` in `packages/backend/tests/unit/mailer.service.test.ts` (stub-transport pattern, per-locale content, link format)

### Implementation for User Story 1

- [ ] T011 [US1] Implement `sendSignupVerificationEmail` in `packages/backend/src/services/mailer.service.ts` (depends on T010)
- [ ] T012 [US1] Implement `create()` in `packages/backend/src/services/signup-request.service.ts`: run the blacklist check, generate `randomBytes(32).toString('hex')` token + expiry, hash the password via `password.ts`, insert the row (depends on T007, T009)
- [ ] T013 [US1] Create `packages/backend/src/routes/signup.ts` with the `POST /api/signup` handler calling `create()` and `sendSignupVerificationEmail` (depends on T011, T012)
- [ ] T014 [US1] Register `signupRoutes` and add `/api/signup` to the auth hook's public-route allowlist in `packages/backend/src/server.ts` (depends on T013)
- [ ] T015 [P] [US1] Create `packages/frontend/src/services/signup.ts` with a `submitSignup()` fetch wrapper (mirrors `services/invitations.ts`)
- [ ] T016 [US1] Create `packages/frontend/src/hooks/useSignupRequests.ts` with a submit mutation (depends on T015)
- [ ] T017 [US1] Add the `'sign-up'` view (email + password form, confirmation state, duplicate/blacklist/weak-password error display) to `packages/frontend/src/pages/AuthPage.tsx` (depends on T016)

**Checkpoint**: User Story 1 is fully functional and independently testable (backend via `curl` per quickstart.md Scenario 1, frontend via the welcome page's "Sign up" entry point)

---

## Phase 4: User Story 2 - Visitor verifies their email address (Priority: P1)

**Goal**: Opening the verification link marks the request verified, moves it into the admin review queue, and notifies every administrator by email.

**Independent Test**: Complete Story 1, open the verification link, confirm status moves from "unverified" to "awaiting admin approval" and that reusing/expired links show the correct error.

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Write failing tests for `POST /api/signup/:token/verify` in `packages/backend/tests/integration/signup.route.test.ts` (200 success + admin notification sent; 410 already-used; 410 expired; 404 unknown token)
- [ ] T019 [P] [US2] Write failing tests for `verify()` and the expired-`UNVERIFIED` sweep in `packages/backend/tests/unit/signup-request.service.test.ts`
- [ ] T020 [P] [US2] Write failing test for `sendAdminSignupNotificationEmail` in `packages/backend/tests/unit/mailer.service.test.ts` (one email per active admin, linking to `/admin/accounts`)

### Implementation for User Story 2

- [ ] T021 [US2] Implement `sendAdminSignupNotificationEmail` in `packages/backend/src/services/mailer.service.ts` (depends on T020)
- [ ] T022 [US2] Implement `verify()` in `packages/backend/src/services/signup-request.service.ts`: validate token (not-found/already-used/expired), transition `UNVERIFIED` → `PENDING_REVIEW`, set `verified_at`, query `role = 'ADMIN' AND status = 'ACTIVE'` users (depends on T012, T019)
- [ ] T023 [US2] Add the expired-`UNVERIFIED` sweep to backend startup in `packages/backend/src/db/client.ts`, alongside the existing invitation sweep (FR-016) (depends on T006)
- [ ] T024 [US2] Add the `POST /api/signup/:token/verify` handler to `packages/backend/src/routes/signup.ts`, calling `verify()` then `sendAdminSignupNotificationEmail` per admin (failures logged, not rolled back) (depends on T021, T022)
- [ ] T025 [US2] Add `/api/signup/:token/verify` to the auth hook's public-route allowlist and wire the startup sweep call in `packages/backend/src/server.ts` (depends on T023, T024)
- [ ] T026 [P] [US2] Create `packages/frontend/src/pages/SignupVerifyConfirm.tsx` (loading → success/expired/not-found states, structurally parallel to `EmailVerifyConfirm.tsx`)
- [ ] T027 [US2] Add `verifySignup()` to `packages/frontend/src/services/signup.ts` and a verify mutation to `packages/frontend/src/hooks/useSignupRequests.ts` (depends on T015, T016)
- [ ] T028 [US2] Add the public `/signup/verify/:token` route (outside `RequireAuth`) in `packages/frontend/src/main.tsx` (depends on T026, T027)

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Admin reviews and approves a sign-up (Priority: P1)

**Goal**: An admin sees verified sign-up requests in a distinct table and can approve one, creating an active user who receives the existing welcome email.

**Independent Test**: Complete Stories 1–2, open the admin accounts page, approve the verified sign-up, confirm a new user account exists and a welcome email was sent.

### Tests for User Story 3 ⚠️

- [ ] T029 [P] [US3] Write failing tests for `GET /api/signup-requests` and `POST /api/signup-requests/:token/approve` in `packages/backend/tests/integration/signup.route.test.ts` (list shape incl. status/submission date; approve creates user + sends welcome email; non-admin forbidden; unverified request cannot be approved → 409)
- [ ] T030 [P] [US3] Write failing tests for `list()` and `approve()` in `packages/backend/tests/unit/signup-request.service.test.ts` (only `PENDING_REVIEW` approvable; transaction creates user + deletes row)

### Implementation for User Story 3

- [ ] T031 [US3] Add a create-from-verified-signup helper to `packages/backend/src/services/user.service.ts` that reuses the existing `create()` path with the request's already-hashed password (no re-hashing) (depends on T030)
- [ ] T032 [US3] Implement `list()` and `approve()` in `packages/backend/src/services/signup-request.service.ts`: `approve()` re-checks `status === 'PENDING_REVIEW'` inside the transaction, creates the `users` row via T031's helper, and deletes the `signup_requests` row (depends on T022, T031)
- [ ] T033 [US3] Add `GET /api/signup-requests` and `POST /api/signup-requests/:token/approve` handlers to `packages/backend/src/routes/signup.ts` (admin-only), calling the existing `sendWelcomeEmail` on approval (depends on T032)
- [ ] T034 [US3] Add `listSignupRequests()`/`approveSignupRequest()` to `packages/frontend/src/services/signup.ts` and corresponding query/mutation to `packages/frontend/src/hooks/useSignupRequests.ts` (depends on T027)
- [ ] T035 [US3] Add the "Sign-up requests" table (email, status, submission date, approve action; unverified rows visibly non-actionable) to `packages/frontend/src/pages/admin/AccountsAdmin.tsx` (depends on T034)

**Checkpoint**: User Stories 1–3 complete — this is the MVP (self-service sign-up with admin approval works end-to-end)

---

## Phase 6: User Story 4 - Admin rejects a sign-up (Priority: P2)

**Goal**: An admin can reject a verified sign-up with an optional reason; the requester is notified and the address is blacklisted until the entry is deleted.

**Independent Test**: Complete Stories 1–2, reject the verified sign-up with a reason, confirm the rejection email and blacklist, confirm resubmission is blocked, then delete the entry and confirm resubmission succeeds.

### Tests for User Story 4 ⚠️

- [ ] T036 [P] [US4] Write failing tests for `POST /api/signup-requests/:token/reject` and `DELETE /api/signup-requests/:token` in `packages/backend/tests/integration/signup.route.test.ts` (reject with/without reason; reject-then-resubmit-blocked 409; delete-clears-blacklist; concurrent double-decision → 409)
- [ ] T037 [P] [US4] Write failing tests for `reject()` and `delete()` in `packages/backend/tests/unit/signup-request.service.test.ts`
- [ ] T038 [P] [US4] Write failing test for `sendSignupRejectionEmail` in `packages/backend/tests/unit/mailer.service.test.ts` (reason present vs. absent wording)

### Implementation for User Story 4

- [ ] T039 [US4] Implement `sendSignupRejectionEmail` in `packages/backend/src/services/mailer.service.ts` (depends on T038)
- [ ] T040 [US4] Implement `reject()` and `delete()` in `packages/backend/src/services/signup-request.service.ts`: `reject()` re-checks `status === 'PENDING_REVIEW'` inside the transaction and sets `REJECTED`/`rejection_reason`/`decided_at`; `delete()` removes the row unconditionally (depends on T032, T037)
- [ ] T041 [US4] Add `POST /api/signup-requests/:token/reject` and `DELETE /api/signup-requests/:token` handlers to `packages/backend/src/routes/signup.ts` (admin-only), calling `sendSignupRejectionEmail` on reject (depends on T039, T040)
- [ ] T042 [US4] Add `rejectSignupRequest()`/`deleteSignupRequest()` to `packages/frontend/src/services/signup.ts` and corresponding mutations to `packages/frontend/src/hooks/useSignupRequests.ts` (depends on T034)
- [ ] T043 [US4] Add reject (with reason prompt) and delete actions to the "Sign-up requests" table in `packages/frontend/src/pages/admin/AccountsAdmin.tsx` (depends on T035, T042)

**Checkpoint**: All four user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and required documentation updates (per project CLAUDE.md)

- [ ] T044 [P] Write `packages/frontend/tests/e2e/signup-flow.spec.ts` (extends `invitation-flow.spec.ts`'s pattern): visitor signs up → verifies via captured stub-mail link → admin approves → new user signs in (Stories 1–3); a second, shorter test covers reject → resubmission-blocked → delete → resubmission-allowed (Story 4)
- [ ] T045 [P] Update `README.md` and `README.de.md` to document public sign-up + admin approval
- [ ] T046 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` to document sign-up, verification, and admin approve/reject/blacklist behavior, including the sole-admin-style blocking conditions (e.g. unverified rows cannot be approved/rejected)
- [ ] T047 Run all `quickstart.md` scenarios end-to-end against a dev server to confirm the full spec is validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends only on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational; `verify()` (T022) depends on `create()` (T012) existing, so Phase 3 should land first even though nothing else in US2 needs US1's frontend
- **User Story 3 (Phase 5)**: Depends on Foundational; `approve()` (T032) depends on `verify()` (T022) since only `PENDING_REVIEW` rows are approvable
- **User Story 4 (Phase 6)**: Depends on Foundational; `reject()`/`delete()` (T040) depend on `approve()` (T032) sharing the same status-recheck pattern in the same service file
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- Tests written and failing before implementation (T008–T010 before T011–T017, etc.)
- Shared-file edits (`signup-request.service.ts`, `routes/signup.ts`, `mailer.service.ts`, `AccountsAdmin.tsx`, `useSignupRequests.ts`, `services/signup.ts`) are sequential within and across stories since each story appends to the same file
- Backend route/service work precedes the frontend wiring that consumes it

### Parallel Opportunities

- T002/T003 (shared types/schemas) in parallel
- All three test-writing tasks within a story's test phase (e.g., T008/T009/T010) in parallel — different files
- T015 (frontend service stub) can start alongside backend work within a story since it only needs the contract, not the implementation

---

## Parallel Example: User Story 1

```bash
# Tests (different files):
Task: "Write failing tests for POST /api/signup in packages/backend/tests/integration/signup.route.test.ts"
Task: "Write failing tests for create() in packages/backend/tests/unit/signup-request.service.test.ts"
Task: "Write failing test for sendSignupVerificationEmail in packages/backend/tests/unit/mailer.service.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1 — visitors can submit requests
4. Complete Phase 4: User Story 2 — requests reach the admin queue
5. Complete Phase 5: User Story 3 — admins can approve, producing real users
6. **STOP and VALIDATE**: run quickstart.md Scenarios 1–3
7. Deploy/demo — this is a complete, usable self-service sign-up feature (rejection can ship later)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → US2 → US3 → validate each with quickstart.md → MVP reached at end of US3
3. US4 (rejection + blacklist) → validate with quickstart.md Scenario 4
4. Polish: e2e test, docs, full quickstart.md pass

---

## Notes

- Tests are included per Constitution Principle I (NON-NEGOTIABLE) — every route/service change is preceded by a failing test in the same phase
- `signup-request.service.ts`, `routes/signup.ts`, and `mailer.service.ts` are touched by every story — treat same-file tasks across stories as sequential even though they carry different `[Story]` labels
- No new dependencies, packages, or background jobs are introduced (plan.md Principle III)
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
