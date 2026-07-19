---

description: "Task list for Admin Diagnostics Page implementation"
---

# Tasks: Admin Diagnostics Page

**Input**: Design documents from `/specs/037-admin-diagnostics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/diagnostics-api.md, quickstart.md

**Tests**: Included — the plan's Constitution Check (Principle I, Test-First) requires a failing
integration test for `GET /api/admin/diagnostics` and a failing unit test per check function
before implementation.

**Organization**: Tasks are grouped by user story (US1 versions overview, US2 deployment/
environment checks, US3 external connectivity checks) so each can be implemented and validated
independently on top of a shared foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps task to US1/US2/US3
- File paths are exact, relative to repo root

## Path Conventions

Existing three-package workspace: `packages/shared/src`, `packages/backend/src` (+`tests/`),
`packages/frontend/src` (+`tests/`). No new npm dependencies (per plan.md/research.md).

---

## Phase 1: Setup

**Purpose**: Confirm environment-variable surface for the feature; no new dependencies or
tooling changes required.

- [X] T001 [P] Document `DIAGNOSTICS_CHECK_TIMEOUT_MS` (default `5000`) and
      `DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS` (default `5000`) in
      `packages/backend/.env.example` with a short comment referencing their purpose

**Checkpoint**: No code changes yet; env var surface documented.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types/schema, the check-orchestration/timeout utility, and the route
skeleton (auth gate + registration) that every user story's checks plug into. No individual
check logic lives here — that belongs to each story's phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Define `CheckStatus`, `CheckResult`, `VersionsGroup`, `SystemChecksGroup`,
      `DiagnosticsReport` TypeScript interfaces in `packages/shared/src/types/diagnostics.ts`
      per `data-model.md`, re-exported from `packages/shared/src/index.ts`
- [X] T003 [P] Define the corresponding zod schema (`DiagnosticsReportSchema` and nested
      schemas) in `packages/shared/src/schemas/diagnostics.ts`, re-exported from
      `packages/shared/src/index.ts`, mirroring the type/schema split used in
      `packages/shared/src/types/invitation.ts` / `packages/shared/src/schemas/invitation.ts`
- [X] T004 Implement the per-check timeout + isolation utility (`runCheck(fn, timeoutMs)`
      wrapping a check in `Promise.race` against a timer, resolving to
      `{ status: 'timed-out', detail }` on timeout and `{ status: 'failed', detail }` on thrown
      error rather than rejecting) in `packages/backend/src/services/diagnostics.service.ts`;
      reads `DIAGNOSTICS_CHECK_TIMEOUT_MS` (default `5000`) from `process.env`
- [X] T005 Export `APP_VERSION` from `packages/backend/src/server.ts` (currently a module-local
      `const`, line ~27-30) so `diagnostics.service.ts` can import it instead of re-reading
      `package.json`
- [X] T006 Scaffold `buildDiagnosticsReport()` in
      `packages/backend/src/services/diagnostics.service.ts` returning a `DiagnosticsReport`
      with `generatedAt`, `versions.appVersion` (from T005), `versions.runtimeVersion`
      (`process.version`), and placeholder/`ok` stub values for all other fields (each story
      below replaces its stubs with real check logic) — uses `Promise.allSettled` per FR-017
- [X] T007 Create `packages/backend/src/routes/diagnostics.ts` with
      `GET /api/admin/diagnostics`, gated by an inline `onRequest` hook checking
      `request.user?.role !== 'ADMIN'` → `403 Forbidden`, mirroring
      `packages/backend/src/routes/admin.ts:29-34`; calls `buildDiagnosticsReport()` and returns
      it as JSON
- [X] T008 Register `diagnosticsRoutes` in `packages/backend/src/server.ts` (import + `await
      fastify.register(diagnosticsRoutes)` alongside the other route registrations at
      `server.ts:127-135`)
- [X] T009 [P] Integration test scaffold in
      `packages/backend/tests/integration/diagnostics.route.test.ts`: admin session → `200` with
      a body matching `DiagnosticsReportSchema`; non-admin session → `403`; unauthenticated →
      `401`; mirrors setup/fixtures from `packages/backend/tests/integration/admin.route.test.ts`
      (in-memory db via `createDb`/`runMigrations`, `buildServer`, `createAuthenticatedSession`,
      `app.inject`) — write first, confirm it fails before T006/T007 are complete, keep passing
      thereafter

**Checkpoint**: `GET /api/admin/diagnostics` returns `200` for an admin with versions populated
and all other fields as safe stubs; foundation ready for user stories to build on in parallel.

---

## Phase 3: User Story 1 - Admin views overall system health at a glance (Priority: P1) 🎯 MVP

**Goal**: Versions (app/db/runtime) and a two-section grouped layout (Versions / System Checks)
are real and visible on the diagnostics page.

**Independent Test**: Sign in as admin, open the diagnostics page, confirm application version,
database version, and runtime version are shown, grouped into labeled Versions / System Checks
sections (per quickstart.md "Validate: JSON endpoint, admin-only access" and "Validate: grouped
display").

### Tests for User Story 1 ⚠️

- [X] T010 [P] [US1] Unit test for the `dbVersion` check function (queries
      `SELECT sqlite_version()`, returns `failed` on query error) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails

### Implementation for User Story 1

- [X] T011 [US1] Implement `checkDbVersion(db)` in
      `packages/backend/src/services/diagnostics.service.ts`: runs
      `db.prepare('SELECT sqlite_version() AS version').get()` via the existing `fastify.db`
      decorator, returns `{ status: 'ok', detail: version }` or `{ status: 'failed', detail:
      '<reason>' }` on error; wire into `buildDiagnosticsReport()` replacing the `versions.dbVersion`
      stub from T006 (depends on T004, T010)
- [X] T012 [US1] Populate `systemChecks.platform` (`os.platform()`) and `systemChecks.architecture`
      (`os.arch()`) in `buildDiagnosticsReport()`, `packages/backend/src/services/diagnostics.service.ts`
      (depends on T006)
- [X] T013 [P] [US1] Create `packages/frontend/src/services/diagnostics.ts`: `fetchDiagnostics()`
      fetch wrapper (`credentials: 'include'`, parses response with
      `DiagnosticsReportSchema.parse`, throws `AuthError` via the `readErrorMessage` helper
      pattern from `packages/frontend/src/services/users.ts`) hitting `GET /api/admin/diagnostics`
- [X] T014 [P] [US1] Create `packages/frontend/src/hooks/useDiagnostics.ts`: TanStack Query
      `useQuery` hook wrapping `fetchDiagnostics()`, mirroring
      `packages/frontend/src/hooks/useAccounts.ts` (depends on T013)
- [X] T015 [US1] Create `packages/frontend/src/pages/admin/DiagnosticsAdmin.tsx`: renders two
      labeled sections ("Versions", "System Checks") from `useDiagnostics()`, with per-field
      loading/error states; Versions section shows `appVersion`, `dbVersion.detail`,
      `runtimeVersion` (depends on T014)
- [X] T016 [US1] Register the route in `packages/frontend/src/main.tsx`: import
      `DiagnosticsAdmin` (alongside the `AccountsAdmin` import, ~line 35) and add
      `<Route path="/admin/diagnostics" element={<RequireAdmin><DiagnosticsAdmin /></RequireAdmin>} />`
      inside the admin routes block (~lines 121-128) (depends on T015)
- [X] T017 [P] [US1] Frontend test in `packages/frontend/tests/unit/DiagnosticsAdmin.test.tsx`:
      mocks `useDiagnostics`, asserts both section headings render and versions display correctly,
      mirroring `packages/frontend/tests/unit/AccountsAdmin.test.tsx` (MantineProvider +
      Notifications + MemoryRouter + QueryClientProvider wrapper) (depends on T015)
- [X] T018 [US1] Implement `GET /admin/diagnostics` no-JS HTML fallback route in
      `packages/backend/src/routes/diagnostics.ts`: same admin `onRequest` gate as T007, calls
      `buildDiagnosticsReport()`, renders a hand-written HTML document (inline `<style>`, no
      `<script>`) with "Versions" and "System Checks" sections; register alongside the JSON route
      in T008 (depends on T006, T007)

**Checkpoint**: User Story 1 fully functional and independently testable — versions display
correctly in both the JS page and the no-JS fallback, grouped into two sections.

---

## Phase 4: User Story 2 - Admin diagnoses deployment/environment issues (Priority: P2)

**Goal**: Reverse-proxy detection, domain match, HTTPS status, container status, and WebSocket
support flag are real and visible.

**Independent Test**: Load the page directly (no proxy) → `reverseProxyDetected` shows "not
detected"; put a reverse proxy in front forwarding `X-Forwarded-For`/`X-Forwarded-Proto` → check
reports the header found and `https`/`domainMatch` reflect forwarded values; set `APP_URL` to a
mismatched domain → `domainMatch` shows `warning` with both values visible (per quickstart.md
"Validate: reverse proxy / domain / HTTPS checks").

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Unit tests for `checkContainerized()` (detects `/.dockerenv` or
      `docker`/`kubepods` in `/proc/1/cgroup` via `node:fs`, returns `false`-detail on read error)
      in `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails
- [X] T020 [P] [US2] Unit tests for `checkReverseProxy(headers)` (detects
      `x-forwarded-for`/`x-real-ip`/`x-forwarded-proto`/`x-forwarded-host`, reports "not detected"
      when none present) in `packages/backend/tests/unit/diagnostics.service.test.ts` — write
      first, confirm it fails
- [X] T021 [P] [US2] Unit tests for `checkDomainMatch(configuredUrl, hostHeader)` (warning on
      mismatch, ok on match, both values in detail) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails
- [X] T022 [P] [US2] Unit tests for `checkHttps(request)` (true when
      `x-forwarded-proto === 'https'` or `request.protocol === 'https'`) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement `checkContainerized()` in
      `packages/backend/src/services/diagnostics.service.ts` per research.md §6 (depends on T019)
- [X] T024 [P] [US2] Implement `checkReverseProxy(headers)` in
      `packages/backend/src/services/diagnostics.service.ts` per research.md §2 (depends on T020)
- [X] T025 [US2] Implement `checkDomainMatch(configuredUrl, hostHeader)` in
      `packages/backend/src/services/diagnostics.service.ts`, comparing `process.env.APP_URL`
      hostname against the request's `Host`/`x-forwarded-host` per research.md §3 (depends on
      T021)
- [X] T026 [US2] Implement `checkHttps(request)` in
      `packages/backend/src/services/diagnostics.service.ts` per research.md §3 (depends on T022)
- [X] T027 [US2] Implement the static `websocketSupport` check (env-var-driven `WEBSOCKET_ENABLED`
      constant, currently `false`) in `packages/backend/src/services/diagnostics.service.ts` per
      research.md §7
- [X] T028 [US2] Thread the Fastify `request` object into `buildDiagnosticsReport(request)` and
      wire T023–T027 into `systemChecks.containerized`, `reverseProxyDetected`, `domainMatch`,
      `https`, `websocketSupport`, replacing the T006 stubs, in
      `packages/backend/src/services/diagnostics.service.ts` and update the call sites in
      `packages/backend/src/routes/diagnostics.ts` (both JSON and HTML routes) (depends on
      T023-T027)
- [X] T029 [US2] Update `packages/frontend/src/pages/admin/DiagnosticsAdmin.tsx` System Checks
      section to render `platform`, `architecture`, `containerized`, `reverseProxyDetected`,
      `domainMatch`, `https`, `websocketSupport` with status-colored badges (ok/warning/failed/
      timed-out) (depends on T028, T015)

**Checkpoint**: User Stories 1 AND 2 both work independently — environment/deployment checks
are visible and correctly flag misconfiguration in both the JS page and no-JS fallback.

---

## Phase 5: User Story 3 - Admin diagnoses external connectivity issues (Priority: P3)

**Goal**: Internet access, DNS resolution, server time, and clock-drift checks are real, with
per-check timeout isolation so a slow/unresponsive external check never blocks the rest of the
page (FR-016/FR-017, SC-002/SC-003).

**Independent Test**: With normal connectivity, `internetAccess`/`dnsResolution` report `ok`;
with outbound egress blocked, they report `failed`/`timed-out` while versions and proxy/domain
checks still render within the 6s budget (per quickstart.md "Validate: external connectivity
checks").

### Tests for User Story 3 ⚠️

- [X] T030 [P] [US3] Unit tests for `checkInternetAccess()` (HTTPS HEAD to `example.com`, wrapped
      in the T004 timeout utility; success/failure/timeout paths) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails
- [X] T031 [P] [US3] Unit tests for `checkDnsResolution()` (`node:dns/promises` `lookup()` against
      `example.com`, resolved IP in detail on success, `failed` on lookup error) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails
- [X] T032 [P] [US3] Unit tests for `checkClockDrift(remoteDateHeader)` (drift computed from the
      HTTPS response `Date` header vs. local time, `warning` when drift exceeds
      `DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS`) in
      `packages/backend/tests/unit/diagnostics.service.test.ts` — write first, confirm it fails
- [X] T033 [P] [US3] Integration test in
      `packages/backend/tests/integration/diagnostics.route.test.ts`: simulate a slow/hanging
      external check (mock or stub the outbound call) and assert the endpoint still responds
      `200` within the timeout budget with that check marked `timed-out` while other fields
      remain populated (FR-017/SC-003) — write first, confirm it fails

### Implementation for User Story 3

- [X] T034 [P] [US3] Implement `checkInternetAccess()` in
      `packages/backend/src/services/diagnostics.service.ts` using `node:https` HEAD request,
      wrapped via the T004 `runCheck` timeout utility, per research.md §4 (depends on T004, T030)
- [X] T035 [P] [US3] Implement `checkDnsResolution()` in
      `packages/backend/src/services/diagnostics.service.ts` using `node:dns/promises`
      `lookup()`, wrapped via the T004 `runCheck` timeout utility, per research.md §4 (depends
      on T004, T031)
- [X] T036 [US3] Implement `checkClockDrift(remoteDateHeader)` in
      `packages/backend/src/services/diagnostics.service.ts`, reusing the `Date` response header
      from T034's HTTPS request per research.md §5; reads
      `DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS` (default `5000`) from `process.env` (depends on
      T034, T032)
- [X] T037 [US3] Compute `systemChecks.serverTime` (`{ utc, local }` ISO strings) in
      `buildDiagnosticsReport()`, `packages/backend/src/services/diagnostics.service.ts`
- [X] T038 [US3] Wire T034–T037 into `buildDiagnosticsReport()` replacing the `internetAccess`,
      `dnsResolution`, `clockDrift`, `serverTime` stubs from T006, run via `Promise.allSettled`
      alongside the US2 checks (depends on T034-T037, T033)
- [X] T039 [US3] Update `packages/frontend/src/pages/admin/DiagnosticsAdmin.tsx` System Checks
      section to render `internetAccess`, `dnsResolution`, `serverTime`, `clockDrift` with
      status-colored badges, completing the full grouped layout (depends on T038, T029)

**Checkpoint**: All three user stories independently functional; full diagnostics report
(versions + all system checks) renders correctly in both JS and no-JS views within the 6s
budget, with failure isolation per check.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quickstart validation, and quality gates across all three stories.

- [X] T040 [P] Update `README.md` and `README.de.md` with a short Admin Diagnostics feature
      mention (consistent between both files, per repo documentation requirements)
- [X] T041 [P] Add a new section to `docs/user-guide.md` and `docs/user-guide.de.md` documenting
      the diagnostics page (what it shows, how to reach `/admin/diagnostics`, that it's
      admin-only, and the no-JS fallback), consistent between both files
- [X] T042 [P] Add/verify JSDoc on every new/changed function in
      `packages/backend/src/services/diagnostics.service.ts`,
      `packages/backend/src/routes/diagnostics.ts`,
      `packages/frontend/src/services/diagnostics.ts`,
      `packages/frontend/src/hooks/useDiagnostics.ts`, and file-level JSDoc blocks on each new
      module, per CLAUDE.md documentation requirements
- [X] T043 Run `pnpm --filter backend test -- diagnostics` and
      `pnpm --filter frontend test -- Diagnostics`, confirm all tests pass
- [X] T044 Run through `quickstart.md` manually end-to-end (admin-only access, grouped display,
      proxy/domain/HTTPS checks, external connectivity checks, no-JS fallback) and confirm every
      validation step passes
- [X] T045 Verify no secret values (SMTP credentials, DB path, tokens) appear anywhere in the
      diagnostics JSON or HTML output (FR-015/SC-005) by inspecting a full response

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only; T029 also touches the
  `DiagnosticsAdmin.tsx` file created in US1 (T015) — sequence after T015, not after all of US1
- **User Story 3 (Phase 5)**: Depends on Foundational only; T039 also touches
  `DiagnosticsAdmin.tsx` — sequence after T029 to avoid file conflicts
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on US2/US3 — independently testable as soon as Foundational is
  done
- **US2 (P2)**: Independently testable on its own JSON fields; its one frontend task (T029)
  shares a file with US1's T015, so run after US1's page exists
- **US3 (P3)**: Same pattern — independently testable via API; its frontend task (T039) shares a
  file with T029, so run after US2's frontend task

### Within Each User Story

- Tests written first and confirmed failing before implementation (Constitution Principle I)
- Shared service functions before route wiring before frontend service/hook before frontend page
- Backend check functions marked [P] where they touch different, independent functions in the
  same file (safe to author in parallel by different people, but note: all live in
  `diagnostics.service.ts`, so merge/apply serially if working solo)

### Parallel Opportunities

- T002/T003 (shared types/schema) in parallel — different files
- T010, T019-T022, T030-T033 (unit test-writing) in parallel within their phase — same file
  target but independent test cases, safe to draft in parallel and merge
- T013/T014 (frontend service/hook) in parallel with backend check implementation once the
  shared schema (T003) exists
- T023/T024 in parallel (different check functions); T034/T035 in parallel (different check
  functions)
- T040/T041/T042 (docs/JSDoc polish) in parallel — different files

---

## Parallel Example: User Story 2

```bash
# Tests first (same file, independent cases — draft together, run once written):
Task: "Unit tests for checkContainerized() in packages/backend/tests/unit/diagnostics.service.test.ts"
Task: "Unit tests for checkReverseProxy(headers) in packages/backend/tests/unit/diagnostics.service.test.ts"
Task: "Unit tests for checkDomainMatch(configuredUrl, hostHeader) in packages/backend/tests/unit/diagnostics.service.test.ts"
Task: "Unit tests for checkHttps(request) in packages/backend/tests/unit/diagnostics.service.test.ts"

# Independent check implementations in parallel:
Task: "Implement checkContainerized() in packages/backend/src/services/diagnostics.service.ts"
Task: "Implement checkReverseProxy(headers) in packages/backend/src/services/diagnostics.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1 — versions + grouped layout, JSON and no-JS HTML
4. **STOP and VALIDATE**: run quickstart.md's US1 validation steps independently
5. Deploy/demo if ready — this alone already satisfies SC-001 for version info and SC-004/SC-006
   for access control and no-JS readability

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → deploy/demo (MVP!)
3. Add User Story 2 → validate independently → deploy/demo
4. Add User Story 3 → validate independently → deploy/demo
5. Polish (docs, JSDoc, full quickstart pass, secret-leak check)

### Parallel Team Strategy

With multiple developers, after Foundational is done: Developer A takes US1, Developer B takes
US2's backend checks (T019-T028) while US1's frontend page is being built (T029 waits on both
T015 and T028), Developer C takes US3's backend checks similarly. Frontend page edits (T015,
T029, T039) must land sequentially since they touch the same file.

---

## Notes

- [P] tasks = different files or independently-addable logic; verify no shared-file conflicts
  before running truly in parallel
- [Story] label maps task to specific user story for traceability
- Tests written and confirmed failing before their corresponding implementation task
  (Constitution Principle I)
- No new npm dependencies anywhere in this feature (Constitution Principle III / research.md)
- All check functions must return a result object (`{ status, detail }`) rather than throwing,
  per FR-017 — verified by the unit tests in each story
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
</content>
