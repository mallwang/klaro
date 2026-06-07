# Tasks: Multi-User Support

**Input**: Design documents from `/specs/013-multi-user-support/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: Included — Constitution Principle I (Test-First, NON-NEGOTIABLE) mandates failing tests before implementation, and plan.md's Constitution Check enumerates the specific test files below.

**Organization**: Tasks are grouped by user story (US1 sign-in P1, US2 data isolation P2, US3 admin account management P3) so each can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps the task to US1 / US2 / US3 for traceability
- File paths are exact, relative to the repository root

## Path Conventions

Existing monorepo layout (Option 2 — web application): `packages/backend/src`, `packages/frontend/src`, `packages/shared/src`, with tests under `packages/backend/tests` and `packages/frontend/tests/e2e`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency and the shared types/schemas every story builds on

- [ ] T001 Add `@fastify/cookie` to `packages/backend/package.json` and run `pnpm install` (per plan.md Technical Context — the only new dependency this feature introduces)
- [ ] T002 [P] Create `Role` (`ADMIN`|`MEMBER`) and `AccountStatus` (`ACTIVE`|`ARCHIVED`) enums in `packages/shared/src/types/user.ts`
- [ ] T003 [P] Create `User`, `SessionUser`, `SignInBody`, `ChangePasswordBody` Zod schemas in `packages/shared/src/schemas/auth.ts` (mirrors `schemas/contract.ts` snake_case-row ↔ camelCase-API mapping pattern)
- [ ] T004 [P] Create `CreateAccountBody`, `AccountListResponse` Zod schemas in `packages/shared/src/schemas/user.ts`
- [ ] T005 Export the new types and schemas from `packages/shared/src/index.ts`

**Checkpoint**: Shared types/schemas compile and are importable from both `packages/backend` and `packages/frontend`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, migration, session/auth machinery, and the global auth hook that every user story depends on

**⚠️ CRITICAL**: No user story phase can start until this phase is complete and its tests pass

### Tests for Foundational (write first, ensure they FAIL)

- [ ] T006 [P] Unit tests for password hashing/verification round-trip (`scrypt` + `timingSafeEqual`, salted, never plaintext) in `packages/backend/tests/unit/auth.service.test.ts`
- [ ] T007 [P] Unit tests for session lifecycle — create, validate, refresh `last_seen_at`, expiry by `expires_at`/inactivity, destroy — in `packages/backend/tests/unit/auth.service.test.ts`
- [ ] T008 [P] Extend `packages/backend/tests/unit/migration.test.ts` to assert: `users`/`sessions` tables are created, a bootstrap administrator account is created, and every pre-existing `contracts` row is backfilled with `user_id = <bootstrap-admin-id>` (FR-007/SC-002)

### Implementation for Foundational

- [ ] T009 Add `users` and `sessions` table definitions to `packages/backend/src/db/schema.sql` per data-model.md (uppercase `CHECK` enums, `TEXT` UUID PKs, ISO-8601 `TEXT` timestamps, `ON DELETE CASCADE` from `users`)
- [ ] T010 Add `contracts.user_id TEXT REFERENCES users(id)` column to `packages/backend/src/db/schema.sql`
- [ ] T011 Extend `runMigrations()` in `packages/backend/src/db/client.ts`: detect missing `users`/`sessions` tables, create them, create one bootstrap administrator account, add `contracts.user_id` via `ALTER TABLE`, and backfill every existing row to the bootstrap admin's id (depends on T009, T010; follows the existing step-detection/rebuild migration style, e.g. the `cancellation_period_unit` migration)
- [ ] T012 Add a startup retention-purge step alongside `runMigrations(db)` in `packages/backend/src/db/client.ts` (or `index.ts`, matching the existing call site) that permanently deletes any `ARCHIVED` user with `archived_at` more than 30 days in the past, cascading to sessions/contracts (FR-012/FR-013, research.md §4)
- [ ] T013 [P] Update `packages/backend/src/db/seed.ts` to seed a default `ADMIN` account and a `MEMBER` test account with known dev credentials, and to stamp seeded contracts with the appropriate `user_id`
- [ ] T014 Implement `packages/backend/src/services/auth.service.ts`: `hashPassword`/`verifyPassword` (scrypt + per-user random salt + `timingSafeEqual`), `createSession`/`validateSession`/`refreshSession`/`destroySession`, and failed-attempt/lockout helpers (`recordFailedAttempt`, `isLocked`, threshold + exponential `locked_until`) — makes T006/T007 pass (depends on T009)
- [ ] T015 Augment Fastify types via `declare module 'fastify'` (alongside the existing `fastify.db` decoration) to add `request.user: AuthenticatedUser | null` in `packages/backend/src/server.ts` or a new `packages/backend/src/types/fastify.d.ts`
- [ ] T016 Register `@fastify/cookie` and add a global `fastify.addHook('onRequest', ...)` in `buildServer` (`packages/backend/src/server.ts`) that resolves the session cookie → `sessions` row → `users` row, decorates `request.user`, refreshes `last_seen_at`/`expires_at`, deletes invalid/expired/archived-account sessions, and returns `401 { statusCode: 401, error: 'Unauthorized', message: 'Authentication required' }` for any `/api/*` request (other than `POST /api/auth/sign-in`) that does not resolve a valid user (depends on T014, T015; satisfies FR-001/FR-003/FR-004/SC-003)
- [ ] T017 Wire the startup retention-purge step (T012) into the server bootstrap sequence so it runs once alongside `runMigrations(db)` (depends on T012)

**Checkpoint**: Schema migrated, bootstrap admin exists with pre-existing contracts assigned to it, sessions/auth services pass their unit tests, and the global auth hook 401s every unauthenticated `/api/*` request — ready for user-story work

---

## Phase 3: User Story 1 - Family member signs in to a personal account (Priority: P1) 🎯 MVP

**Goal**: A family member can sign in with their own credentials, reach the dashboard under their own identity, sign out, have inactive sessions expire, and be redirected to sign-in when unauthenticated.

**Independent Test**: Create two accounts, sign in as each in turn, confirm each lands in the app under their own identity (e.g., display name in the header) and that signing out / session expiry returns them to the sign-in page — without needing US2 or US3 to exist.

### Tests for User Story 1 (write first, ensure they FAIL)

- [ ] T018 [P] [US1] Integration tests for `POST /api/auth/sign-in` (200 + Set-Cookie + body shape, 400 malformed body, 401 wrong credentials with generic message, 423 locked-out account) in `packages/backend/tests/integration/auth.route.test.ts`
- [ ] T019 [P] [US1] Integration tests for `POST /api/auth/sign-out` (204, deletes session row, clears cookie) and `GET /api/auth/me` (200 for valid session, 401 for none) in `packages/backend/tests/integration/auth.route.test.ts`
- [ ] T020 [P] [US1] Integration test asserting every `/api/*` route (e.g., `GET /api/contracts`, `GET /api/dashboard`) returns `401` without a valid session cookie, and `200` with one, in `packages/backend/tests/integration/auth.route.test.ts`
- [ ] T021 [P] [US1] Integration test for lockout: N consecutive wrong-password attempts against one account return `401` then switch to `423`, and the correct password is also refused while locked, in `packages/backend/tests/integration/auth.route.test.ts`

### Implementation for User Story 1

- [ ] T022 [US1] Implement `packages/backend/src/routes/auth.ts`: `POST /api/auth/sign-in` (public — validates body, checks lockout, verifies password via `auth.service`, creates session, sets HTTP-only `Secure` `SameSite=Lax` cookie, returns `{ id, email, displayName, role }`), `POST /api/auth/sign-out`, `GET /api/auth/me`, `POST /api/auth/password` per contracts/api-contracts.md (depends on T014, T016; makes T018–T021 pass)
- [ ] T023 [US1] Register the auth routes in `packages/backend/src/server.ts` (alongside existing route registrations)
- [ ] T024 [P] [US1] Create `packages/frontend/src/services/auth.ts`: typed fetch wrappers for `POST /api/auth/sign-in`, `POST /api/auth/sign-out`, `GET /api/auth/me`, `POST /api/auth/password`
- [ ] T025 [P] [US1] Create `packages/frontend/src/hooks/useAuth.ts`: TanStack Query wrapper around `GET /api/auth/me` (current user or `null`/401) plus sign-in/sign-out mutations that invalidate the query
- [ ] T026 [US1] Create `packages/frontend/src/pages/SignIn.tsx`: sign-in form posting to `/api/auth/sign-in`, displaying validation/401/423 error messages, redirecting to the dashboard on success (depends on T024, T025)
- [ ] T027 [US1] Create `packages/frontend/src/components/RequireAuth.tsx`: route guard that renders `SignIn` (or redirects to `/sign-in`) when `useAuth()` reports no current user, and renders children otherwise (depends on T025)
- [ ] T028 [US1] Wire `/sign-in` route and wrap existing authenticated routes with `RequireAuth` in `packages/frontend/src/main.tsx`; show the signed-in user's display name and a sign-out control in the app header (depends on T026, T027)
- [ ] T029 [P] [US1] Playwright e2e scaffold `packages/frontend/tests/e2e/multi-user-isolation.spec.ts`: sign in as a seeded account, assert the dashboard loads under that identity and sign-out returns to `/sign-in` (full cross-account isolation assertions land in US2 — see T040)

**Checkpoint**: User Story 1 is fully functional and independently testable — sign-in, sign-out, session expiry, lockout, and the redirect-to-sign-in behavior all work end-to-end

---

## Phase 4: User Story 2 - Each family member keeps their own private contracts (Priority: P2)

**Goal**: Every contract list, dashboard, search, export, and mutation is scoped to the signed-in user only — one member's data never appears in another's views under any circumstance.

**Independent Test**: Sign in as member A, create a contract; sign in as member B and confirm that contract appears nowhere — not in the list, dashboard, search, or exports; confirm B cannot fetch/edit/delete A's contract by id (404, not 403).

### Tests for User Story 2 (write first, ensure they FAIL)

- [ ] T030 [P] [US2] Extend `packages/backend/tests/integration/contracts.route.test.ts` with cross-account isolation cases: user A's `GET /api/contracts` never includes user B's contracts, `POST /api/contracts` stamps `user_id = request.user.id`, and `GET/PUT/DELETE /api/contracts/:id` return `404` (not `403`) for another user's contract id
- [ ] T031 [P] [US2] Add cross-account isolation cases to the dashboard route tests (`GET /api/dashboard` aggregates/totals/renewal panels reflect only the signed-in user's contracts) — extend the existing dashboard integration test file alongside `contracts.route.test.ts`
- [ ] T032 [P] [US2] Add cross-account isolation cases to the export/import route tests: exports never contain another user's contracts, and imports always attribute new rows to the importing user — extend the existing export/import integration test file
- [ ] T033 [US2] Complete `packages/frontend/tests/e2e/multi-user-isolation.spec.ts` (started in T029): sign in as two seeded accounts in separate browser contexts, create a contract as one, and assert it is invisible in the other's list, dashboard, and export — the direct end-to-end test of FR-005/FR-006/SC-004

### Implementation for User Story 2

- [ ] T034 [US2] Modify `packages/backend/src/services/contract.ts`: every method (list, get, create, update, delete, export, import) takes/uses an `ownerId: string` and adds `WHERE user_id = ?` to every query; `create` stamps `user_id = ownerId`; `get`/`update`/`delete` return "not found" for rows owned by a different user (so routes can map to `404`) — makes T030/T032 pass (depends on T010, T011)
- [ ] T035 [US2] Modify `packages/backend/src/services/dashboard.ts`: every aggregate query is scoped by `ownerId` — makes T031 pass (depends on T034)
- [ ] T036 [US2] Modify `packages/backend/src/routes/contracts.ts` to pass `request.user.id` into every `ContractService` call and map "not found for this owner" to `404 Not Found`
- [ ] T037 [US2] Modify `packages/backend/src/routes/dashboard.ts` to pass `request.user.id` into every `DashboardService` call
- [ ] T038 [US2] Verify `rowToContract` and the shared `ContractSchema` in `packages/shared/src/schemas/contract.ts` never serialize `user_id` into API responses (FR-014 — internal-only ownership; adjust the mapping function if it currently passes the column through)
- [ ] T039 [US2] Confirm the existing per-contract anonymization setting and global anonymize toggle continue to apply correctly within each user's now-isolated view (FR-017 / [[feedback_anonymization_invariant]]) — add a regression assertion to the anonymization test suite if the scoping change touches any shared query path
- [ ] T040 [US2] Run and pass the completed `multi-user-isolation.spec.ts` (T033) against the implemented isolation (depends on T034–T037)

**Checkpoint**: User Stories 1 AND 2 both work independently — signed-in users see, create, edit, delete, search, and export only their own contracts, with zero cross-account leakage on any surface

---

## Phase 5: User Story 3 - Administrator manages who has access to the household (Priority: P3)

**Goal**: An administrator can list accounts, create new member accounts with directly-issued credentials, archive (remove) accounts with immediate session invalidation, reactivate archived accounts within the retention window, and is blocked from ever leaving the household without an active administrator — all without touching the database directly, and without gaining any access to other members' contract data.

**Independent Test**: Sign in as the administrator, create a new member account through the UI, sign in as that new member, then have the administrator archive the account and confirm the removed member can no longer sign in; reactivate within the retention window and confirm the member regains access to their original contracts intact.

### Tests for User Story 3 (write first, ensure they FAIL)

- [ ] T041 [P] [US3] Integration tests for `GET /api/users` and `POST /api/users` (admin-only list/create, `201`/`400`/`409` duplicate-email, non-admin receives `403`) in `packages/backend/tests/integration/users.route.test.ts`
- [ ] T042 [P] [US3] Integration tests for `POST /api/users/:id/archive` (`204`, deletes the account's sessions immediately, sets `status=ARCHIVED`/`archived_at`, `404` unknown id, `409` last-admin guard) in `packages/backend/tests/integration/users.route.test.ts`
- [ ] T043 [P] [US3] Integration tests for `POST /api/users/:id/reactivate` (`204` restores `ACTIVE` + original contracts intact, `404` unknown/purged id, `409` not-archived) and `POST /api/users/:id/role` (`204` change, `409` last-admin demotion guard) in `packages/backend/tests/integration/users.route.test.ts`
- [ ] T044 [P] [US3] Integration test confirming an archived account's active session is invalidated immediately (subsequent authenticated requests with its old cookie return `401`) and sign-in attempts against it return `401`, in `packages/backend/tests/integration/auth.route.test.ts`
- [ ] T045 [P] [US3] Unit tests for `user.service.ts`: account create/list/archive/reactivate, the last-active-admin guard (rejects archiving and demoting the last admin), and the 30-day retention purge logic, in `packages/backend/tests/unit/user.service.test.ts`

### Implementation for User Story 3

- [ ] T046 [US3] Implement `packages/backend/src/services/user.service.ts`: account CRUD (create with hashed initial password via `auth.service`, list including archived, archive incl. session deletion, reactivate, role change, retention-purge query), with the last-active-admin guard enforced before every archive/demote operation — makes T045 pass (depends on T014)
- [ ] T047 [US3] Implement `packages/backend/src/routes/users.ts`: `GET /api/users`, `POST /api/users`, `POST /api/users/:id/archive`, `POST /api/users/:id/reactivate`, `POST /api/users/:id/role`, each requiring `request.user.role === 'ADMIN'` (else `403 { error: 'Forbidden', message: 'Administrator access required' }`) per contracts/api-contracts.md — makes T041–T043 pass (depends on T046)
- [ ] T048 [US3] Register the admin-only user routes in `packages/backend/src/server.ts`
- [ ] T049 [US3] Verify the global auth hook (T016) treats archived users' sessions as invalid immediately upon archive (no separate code path needed if `sessions` rows are deleted on archive — confirm and add a regression note/test if a gap is found) — makes T044 pass
- [ ] T050 [P] [US3] Create `packages/frontend/src/components/RequireAdmin.tsx`: route guard rendering a forbidden state / redirect for non-admin users (depends on T025)
- [ ] T051 [P] [US3] Create `packages/frontend/src/pages/admin/AccountsAdmin.tsx`: admin UI listing accounts (incl. archived/status), creating new accounts (email, display name, role, initial password), archiving, and reactivating, calling the `/api/users/*` wrappers (depends on T052)
- [ ] T052 [P] [US3] Extend `packages/frontend/src/services/auth.ts` (or add `packages/frontend/src/services/users.ts`) with typed fetch wrappers for `GET/POST /api/users`, `POST /api/users/:id/archive`, `POST /api/users/:id/reactivate`, `POST /api/users/:id/role`
- [ ] T053 [US3] Create `packages/frontend/src/pages/AccountSettings.tsx`: change-own-password form posting to `POST /api/auth/password` (FR-018) — every signed-in user, not admin-only
- [ ] T054 [US3] Wire `/account` and `/admin/accounts` routes in `packages/frontend/src/main.tsx`, wrapping the latter in `RequireAdmin` (depends on T050, T051, T053)

**Checkpoint**: All three user stories are independently functional — sign-in/sessions, per-user contract isolation, and full admin account lifecycle (create/list/archive/reactivate/role, with last-admin protection and immediate session invalidation) all work end-to-end

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation touches that span all three stories

- [ ] T055 [P] Run `pnpm --filter backend test` and `pnpm --filter frontend test` (incl. the Playwright e2e) and confirm the full suite is green with no `any` types and `strict: true` intact (Constitution Principles I & II)
- [ ] T056 Walk through every scenario in `specs/013-multi-user-support/quickstart.md` against a running dev instance (fresh DB for Scenario 1/2/3/4, a pre-013 DB copy for Scenario 5) and confirm each expected result
- [ ] T057 [P] Update `specs/012-docker-packaging/quickstart.md` or the bilingual user documentation (per the existing `acfba92 docs: add favicon and bilingual user documentation` work) to mention that the application now requires sign-in and how the bootstrap administrator account is provisioned on first run

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs the shared schemas/types from T002–T005) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion only
- **User Story 2 (Phase 4)**: Depends on Foundational completion; route/service changes are independent of US1's frontend work, but the Playwright e2e (T033/T040) needs the US1 sign-in flow (T026–T028) to drive the browser
- **User Story 3 (Phase 5)**: Depends on Foundational completion; its frontend pieces (T050, T051, T054) depend on US1's `useAuth`/route-guard scaffolding (T025, T027)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — the true MVP
- **User Story 2 (P2)**: Backend isolation work (T034–T039) is independent of US1's frontend; its e2e validation (T033/T040) depends on US1's sign-in UI existing
- **User Story 3 (P3)**: Backend account-management work (T046–T049) is independent of US1/US2; its frontend (T050, T051, T053, T054) depends on US1's `useAuth`/`RequireAuth` scaffolding

### Within Each User Story

- Tests written and failing before implementation (Constitution Principle I)
- Shared/service layer before routes; routes before frontend pages
- Story checkpoint reached before moving to the next priority

### Parallel Opportunities

- T002–T004 (shared schemas/types, different files) in parallel
- T006–T008 (foundational tests, different files/concerns) in parallel
- T013 alongside T014–T016 (seed script touches a different file than the auth service/server hook)
- T018–T021 (US1 route tests, same file but independent `describe` blocks — safe to draft in parallel, run sequentially)
- T024, T025, T029 (frontend service/hook/e2e scaffold, different files) in parallel once T022/T023 land
- T030–T032 (US2 isolation tests across different existing test files) in parallel
- T041–T045 (US3 tests across `users.route.test.ts`, `auth.route.test.ts`, `user.service.test.ts`) in parallel
- T050, T051, T052 (US3 frontend guard/page/service, different files) in parallel
- Once Foundational (Phase 2) completes, US1, US2(backend), and US3(backend) can proceed in parallel with separate developers

---

## Parallel Example: User Story 1

```bash
# Launch US1 route tests together (different describe blocks, same file — coordinate before merging):
Task: "Integration tests for POST /api/auth/sign-in in packages/backend/tests/integration/auth.route.test.ts"
Task: "Integration tests for sign-out/me in packages/backend/tests/integration/auth.route.test.ts"
Task: "Integration test for global 401-when-unauthenticated in packages/backend/tests/integration/auth.route.test.ts"
Task: "Integration test for lockout in packages/backend/tests/integration/auth.route.test.ts"

# Launch US1 frontend scaffolding together (independent files):
Task: "Create packages/frontend/src/services/auth.ts"
Task: "Create packages/frontend/src/hooks/useAuth.ts"
Task: "Scaffold packages/frontend/tests/e2e/multi-user-isolation.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; this is also where the bootstrap-admin migration that protects existing data lives)
3. Complete Phase 3: User Story 1 — sign-in, sign-out, session expiry, lockout, redirect-to-sign-in
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 and confirm SC-003
5. At this point the app is *safe to expose* (FR-001 satisfied) even before per-user data isolation lands — though note that until US2 ships, every signed-in account still sees the single shared (bootstrap-admin-owned) contract list, so US2 should follow immediately rather than ship to multiple real family members

### Incremental Delivery

1. Setup + Foundational → bootstrap admin exists, pre-existing data preserved, auth machinery ready
2. Add User Story 1 → validate via quickstart Scenario 1 → the app requires sign-in
3. Add User Story 2 → validate via quickstart Scenario 2 (and Scenario 5 for the migration) → contracts are now genuinely private per account
4. Add User Story 3 → validate via quickstart Scenarios 3 and 4 → administrators can onboard/offboard family members entirely through the UI
5. Polish → full quickstart walkthrough, test suite green, documentation updated

### Parallel Team Strategy

1. Team completes Setup + Foundational together (the migration and auth hook are the riskiest shared pieces — pair on T011 and T016)
2. Once Foundational is done:
   - Developer A: User Story 1 (auth routes + sign-in UI)
   - Developer B: User Story 2 backend (contract/dashboard scoping — highest-risk isolation work, pairs well with dedicated test review)
   - Developer C: User Story 3 backend (account-management routes/service)
3. Frontend pieces of US2 (e2e) and US3 (admin pages) integrate once US1's `useAuth`/`RequireAuth`/`RequireAdmin` scaffolding lands

---

## Notes

- [P] tasks touch different files (or independent concerns within a shared test file) and have no completed-task dependency between them
- [Story] labels trace every task back to its user story for independent delivery
- Tests precede implementation throughout (Constitution Principle I, NON-NEGOTIABLE) — write each test, watch it fail, then implement
- The riskiest task in the entire feature is T034 (per-user contract scoping) — give its tests (T030) and the e2e (T033/T040) the most scrutiny, per FR-006/SC-004's "zero instances… under any circumstance" bar
- Commit after each task or logical group; stop at each checkpoint to validate that story independently before moving on
