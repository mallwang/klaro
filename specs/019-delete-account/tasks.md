# Tasks: Delete Account

**Input**: Design documents from `specs/019-delete-account/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/delete-account-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Constitution Principle I (TDD): tests MUST be written and confirmed failing before implementation

---

## Phase 1: Setup (Shared Type)

**Purpose**: Publish the shared result type that both the backend service and frontend service contract depend on. Unblocks all subsequent work.

- [ ] T001 Add `DeleteSelfResult` type (`'deleted' | 'last-admin'`) to `packages/shared/src/schemas/profile.ts` and re-export from `packages/shared/src/index.ts`

**Checkpoint**: `pnpm --filter @pcm/shared build` succeeds; `DeleteSelfResult` is importable from `@pcm/shared`

---

## Phase 2: Foundational (Backend — blocks all frontend user stories)

**Purpose**: Implement and test the backend service method and route. No frontend work can be verified without this.

**⚠️ CRITICAL**: No frontend user story work can be verified end-to-end until this phase is complete.

- [ ] T002 Write failing unit tests for `ProfileService.deleteSelf()` in `packages/backend/tests/unit/profile.service.test.ts` — 3 cases: (1) MEMBER → returns `'deleted'` and user row is gone; (2) sole ADMIN → returns `'last-admin'` and user row unchanged; (3) one-of-multiple ADMINs → returns `'deleted'`
- [ ] T003 Implement `deleteSelf(userId: string): DeleteSelfResult` on `ProfileService` in `packages/backend/src/services/profile.service.ts` — inline active-admin-count SQL check; if sole admin return `'last-admin'`; otherwise `DELETE FROM users WHERE id = ?` inside a transaction (cascade handles sessions, contracts, invitations)
- [ ] T004 Write failing integration tests for `DELETE /api/profile` in `packages/backend/tests/integration/profile.route.test.ts` — 3 cases: (1) unauthenticated → 401; (2) authenticated MEMBER → 204, user row gone, `Set-Cookie` clears session cookie; (3) authenticated sole ADMIN → 409 with message referencing last-admin restriction
- [ ] T005 Add `DELETE /api/profile` route handler to `packages/backend/src/routes/profile.ts` — call `profileService.deleteSelf(request.user!.id)`; on `'deleted'`: clear session cookie via `reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' })` then return 204; on `'last-admin'`: return 409

**Checkpoint**: `pnpm --filter backend test` passes; `DELETE /api/profile` behaves per API contract in `contracts/delete-account-api.md`

---

## Phase 3: User Story 1 — Delete Account with Data Export Warning (Priority: P1) 🎯 MVP

**Goal**: Account Settings page has a Danger Zone section; clicking "Delete Account" opens a modal that shows the export advisory with a JSON download button and a skip option; the modal can be dismissed at any point without deleting anything.

**Independent Test**: Navigate to Account Settings, see Danger Zone section, open the modal, verify the export warning and download button are present, close the modal, confirm the account still exists.

### Tests for User Story 1 (Constitution Principle I — write FIRST, confirm FAILING)

- [ ] T006 [US1] Write failing Vitest unit tests for `DeleteAccountModal` component in `packages/frontend/tests/unit/DeleteAccountModal.test.tsx` — covers: (a) renders export warning text; (b) renders "Download contracts as JSON" button when contracts array is non-empty; (c) renders "no contracts to export" notice when array is empty; (d) clicking download button calls `exportToJson` with the contracts prop; (e) clicking skip advances to step 2 (stub); (f) clicking the modal close button calls `onClose` without calling `deleteSelf`; props interface: `{ opened: boolean; onClose: () => void; onDeleted: () => void; contracts: ContractData[]; isSoleAdmin: boolean }`
- [ ] T007 [US1] Write failing Playwright E2E test in `packages/frontend/tests/e2e/delete-account.spec.ts` — test "Danger Zone section is visible on Account Settings page" and "Delete Account button opens modal with export warning and export + skip buttons"

### Implementation for User Story 1

- [ ] T008 [P] [US1] Add `deleteSelf()` function to `packages/frontend/src/services/profile.ts` — `DELETE /api/profile` with `credentials: 'include'`; throw `AuthError(res.status, ...)` on non-204 responses
- [ ] T009 [P] [US1] Add Danger Zone and modal step-1 i18n keys to `packages/frontend/src/i18n/locales/en.json` — keys: `dangerZone.title`, `dangerZone.description`, `dangerZone.deleteButton`, `deleteModal.title`, `deleteModal.warningText`, `deleteModal.exportButton`, `deleteModal.skipButton`, `deleteModal.emptyContractsNotice`
- [ ] T010 [US1] Create `packages/frontend/src/components/DeleteAccountModal.tsx` — Mantine `Modal` with props `{ opened, onClose, onDeleted, contracts: ContractData[], isSoleAdmin: boolean }`; step 1 renders: warning text, "Download contracts as JSON" button (calls `exportToJson(contracts)` from `services/export.ts`), skip button that advances to step 2 stub; if `contracts.length === 0` omit download button and show notice instead
- [ ] T011 [US1] Add Danger Zone section to `packages/frontend/src/pages/AccountSettings.tsx` — add `useState` for `modalOpen`; add `useContracts()` call; render red-bordered Mantine `Paper` at bottom of the settings stack with description text and "Delete Account" `Button` (color `red`); render `<DeleteAccountModal>` wired to modal state

**Checkpoint**: Danger Zone section renders on Account Settings; modal opens; export advisory and download/skip buttons are visible; modal closes without side effects

---

## Phase 4: User Story 2 — Explicit Deletion Confirmation (Priority: P2)

**Goal**: Step 2 of the modal shows a clearly-labelled permanent-deletion confirm button. Clicking it calls the API, shows a loading state, redirects to sign-in on success, and shows an error alert on failure. Cancel at any point leaves the account intact.

**Independent Test**: Open the modal, skip the export step, see the confirmation button labelled to convey permanence, click it, verify the user is signed out and on the sign-in page. Then repeat but click cancel — verify account intact.

### Tests for User Story 2 (Constitution Principle I — write FIRST, confirm FAILING)

- [ ] T012 [US2] Write failing Vitest unit tests for the confirmation step in `packages/frontend/tests/unit/DeleteAccountModal.test.tsx` — covers: (a) after skip: confirmation button is visible and labelled; (b) clicking confirm calls `deleteSelf()` and then calls `onDeleted` on success; (c) loading spinner/disabled state shown while mutation is in-flight; (d) error alert rendered when `deleteSelf()` rejects; (e) cancel button at step 2 calls `onClose` and does not call `deleteSelf()`
- [ ] T013 [US2] Expand Playwright E2E test in `packages/frontend/tests/e2e/delete-account.spec.ts` — test "happy path: skip export, click confirm, redirected to /sign-in and session cookie cleared" and "cancel at confirmation step: account and session intact"

### Implementation for User Story 2

- [ ] T014 [P] [US2] Add confirmation step i18n keys to `packages/frontend/src/i18n/locales/en.json` — keys: `deleteModal.confirmTitle`, `deleteModal.confirmButton`, `deleteModal.cancelButton`, `deleteModal.deleteError`, `deleteModal.deleting`
- [ ] T015 [US2] Add step 2 (confirmation) to `DeleteAccountModal` in `packages/frontend/src/components/DeleteAccountModal.tsx` — step 2 shows: confirm button (`deleteModal.confirmButton`, color `red`), cancel button, error `Alert` when mutation fails, loading/disabled state on the confirm button while mutation is pending; on mutation success call `onDeleted()`
- [ ] T016 [US2] Wire post-deletion side effects in `packages/frontend/src/pages/AccountSettings.tsx` — implement `handleDeleted` callback: call `queryClient.clear()` then `navigate('/sign-in')`; pass as `onDeleted` prop to `<DeleteAccountModal>`

**Checkpoint**: Full delete flow works end-to-end; redirect happens after deletion; cancel is always safe

---

## Phase 5: User Story 3 — Admin Account Protection (Priority: P3)

**Goal**: If the current user is the only active administrator, the confirmation button in the modal is disabled and an explanatory message is shown directing the user to promote another account to admin first.

**Independent Test**: Sign in as the sole admin, open the delete modal, reach the confirmation step, verify the button is disabled with an explanatory message. Promote another user to admin, reopen the modal, verify the button is now enabled.

### Tests for User Story 3 (Constitution Principle I — write FIRST, confirm FAILING)

- [ ] T017 [US3] Write failing Vitest unit test for sole-admin disabled state in `packages/frontend/tests/unit/DeleteAccountModal.test.tsx` — when `isSoleAdmin=true`: confirm button has `disabled` attribute and the sole-admin explanatory message is visible; when `isSoleAdmin=false`: button is enabled and message is absent
- [ ] T018 [US3] Expand Playwright E2E test in `packages/frontend/tests/e2e/delete-account.spec.ts` — test "sole admin: confirm button disabled with explanatory message" and "after promoting another user to admin: confirm button becomes enabled"

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add sole-admin i18n key to `packages/frontend/src/i18n/locales/en.json` — key: `deleteModal.soleAdminWarning`
- [ ] T020 [US3] Add `isSoleAdmin` disabled state to step 2 in `DeleteAccountModal` in `packages/frontend/src/components/DeleteAccountModal.tsx` — when `isSoleAdmin=true`: disable confirm button and render `deleteModal.soleAdminWarning` text above it
- [ ] T021 [US3] Compute `isSoleAdmin` in `packages/frontend/src/pages/AccountSettings.tsx` — use `useQuery<Account[]>({ queryKey: ACCOUNTS_QUERY_KEY, queryFn: fetchAccounts, enabled: user?.role === 'ADMIN', staleTime: 30_000 })` directly (not the hook, to support the `enabled` option); compute `isSoleAdmin = user?.role === 'ADMIN' && (accounts ?? []).filter(a => a.role === 'ADMIN' && a.status === 'ACTIVE').length <= 1`; pass result to `<DeleteAccountModal isSoleAdmin={isSoleAdmin}>`

**Checkpoint**: Sole admin sees disabled confirm button with message; non-sole admin and members always see enabled button

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Add German translations for all new i18n keys to `packages/frontend/src/i18n/locales/de.json` (all keys added in T009, T014, T019)
- [ ] T023 [P] Expand i18n catalogue test in `packages/frontend/tests/unit/i18n/catalogue.test.ts` to assert all new keys are present in both `en.json` and `de.json`
- [ ] T024 [P] Expand `packages/frontend/tests/unit/AccountSettings.test.tsx` — add test that Danger Zone `Paper` section is rendered and the "Delete Account" button is present
- [ ] T025 Run quickstart.md validation scenarios — Scenario 1 (happy path), Scenario 3 (cancel), Scenario 4 (sole admin), Scenario 5 (API contract)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (shared type) — BLOCKS all frontend E2E tests
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (service and route must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (modal must exist to add step 2)
- **User Story 3 (Phase 5)**: Depends on Phase 4 completion (confirmation step must exist to add disabled state)
- **Polish (Phase 6)**: Depends on Phases 3–5 completion (all i18n keys must be finalized)

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (backend) — modal structure and Danger Zone UI
- **US2 (P2)**: Depends on US1 (extends the modal with step 2)
- **US3 (P3)**: Depends on US2 (extends step 2 with disabled state)

### Within Each Phase

- Tests MUST be written and confirmed FAILING before implementation (Constitution Principle I)
- Tasks marked [P] within a phase can be executed in parallel
- T008 and T009 can run in parallel with T006 and T007 (different files)

### Parallel Opportunities

```bash
# Phase 2: write tests in parallel with shared type build
Task T002 (failing backend unit tests)
Task T004 (failing backend route tests)
# → then implement T003, T005

# Phase 3: after tests written (T006, T007):
Task T008  # services/profile.ts
Task T009  # en.json
# → then T010 (modal component), T011 (AccountSettings)

# Phase 6: all polish tasks are independent
Task T022 (de.json)
Task T023 (catalogue test)
Task T024 (AccountSettings test)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 minimum)

1. Complete Phase 1: Shared type (T001)
2. Complete Phase 2: Backend tests + implementation (T002–T005)
3. Complete Phase 3: Danger Zone UI + modal step 1 (T006–T011)
4. Complete Phase 4: Confirmation + post-deletion flow (T012–T016)
5. **STOP and VALIDATE**: Full delete flow works end-to-end (Quickstart Scenario 1–3)

### Incremental Delivery

1. Phase 1 + 2 → Backend API ready
2. Phase 3 → Modal opens, export advisory works (shippable with a "coming soon" confirm step)
3. Phase 4 → Full deletion flow works (shippable without sole-admin guard)
4. Phase 5 → Sole-admin protection added (all spec user stories satisfied)
5. Phase 6 → Polish and German localization

---

## Notes

- `deleteSelf` (in `services/profile.ts`) is distinct from `deleteAccount` (admin-level, in `services/users.ts`) — do not confuse the two
- The backend `ON DELETE CASCADE` on `users.id` handles cleanup of `sessions`, `contracts`, and `invitations` automatically — no additional deletion logic needed
- German translations (T022) can be drafted by any contributor; i18n catalogue test (T023) will catch missing keys
- [P] tasks = work in different files, no dependency on in-progress tasks in the same phase
