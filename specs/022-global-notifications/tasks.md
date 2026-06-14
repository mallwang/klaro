# Tasks: Global Notification System

**Input**: Design documents from `specs/022-global-notifications/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**TDD**: Tests are written and must FAIL before each corresponding implementation task (constitution mandate).

**Organization**: Grouped by user story. US4 (global infrastructure) is foundational and blocks all migration work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no inter-dependency)
- **[US#]**: Maps to user story from spec.md

---

## Phase 1: Setup

**Purpose**: Add the new package dependency before any code is written.

- [ ] T001 Add `@mantine/notifications: "^7.17.0"` to `packages/frontend/package.json` dependencies and run `pnpm install` from repo root

**Checkpoint**: `node_modules/@mantine/notifications` exists in `packages/frontend`

---

## Phase 2: Foundational — US4 (Global Notification Infrastructure)

**Goal**: Notification provider mounted globally; helper utility and shared test wrapper ready. All migration phases depend on this.

**Independent Test**: Navigate to Account Settings, trigger a password save success — a green toast appears top-right and dismisses after 5 seconds.

**⚠️ CRITICAL**: No migration task (T006+) can begin until T005 is complete.

### Tests for US4 ⚠️ Write FIRST — ensure they FAIL before T004/T005

- [ ] T002 Write failing unit tests for `showSuccess` and `showError` in `packages/frontend/tests/unit/notifications.test.ts` — assert each call renders the notification message string in the DOM (wrap with `<MantineProvider><Notifications /></MantineProvider>`)
- [ ] T003 [P] Create shared test helper `packages/frontend/tests/unit/test-utils.tsx` exporting a `renderWithNotifications(ui)` function that wraps the given element in `<QueryClientProvider><MantineProvider><Notifications />{ui}</MantineProvider></QueryClientProvider>` with a fresh `QueryClient`; add `notifications.clean()` call in the exported `afterEach` helper

### Implementation for US4

- [ ] T004 Create `packages/frontend/src/lib/notifications.ts` with file-level JSDoc, and two typed exported functions `showSuccess(message: string): void` and `showError(message: string): void` each calling `notifications.show()` from `@mantine/notifications` with the correct `color` and `autoClose: 5000`
- [ ] T005 Add `import { Notifications } from '@mantine/notifications'` to `packages/frontend/src/main.tsx` and render `<Notifications position="top-right" />` as the first child inside `<MantineProvider>`, before `<QueryClientProvider>`; add file-level JSDoc block update if it changes

**Checkpoint**: `T002` tests now pass. `main.tsx` type-checks. Ready for migration phases.

---

## Phase 3: US1 + US2 — AccountSettings Migration (Priority: P1)

**Goal**: All success and API-error feedback in Account Settings delivered as toast notifications; no inline Alert for action results.

**Independent Test**: Open Account Settings → submit wrong current password → red toast appears; submit correct password → green toast appears. No Alert element visible inside the form.

### Tests for US1+US2 — AccountSettings ⚠️ Write FIRST — ensure they FAIL before T007–T009

- [ ] T006 Update `packages/frontend/tests/unit/AccountSettings.test.tsx`:
  - Replace `renderAccountSettings` wrapper to include `<Notifications />` (or use `renderWithNotifications` from T003)
  - Add `notifications.clean()` in `beforeEach`/`afterEach`
  - Change `'shows a success alert after saving display name'` to assert the toast text appears via `screen.findByText` and assert no `role="status"` Alert inside the form
  - Add test: display name mutation error shows error toast text
  - Change email-change success assertion to assert toast text (not inline Alert)
  - Change email-change 409 conflict assertion to assert toast text (not inline Alert)
  - Add tests for password change success toast and password change error toast
  - Confirm tests FAIL (Alert assertions fail) before proceeding

### Implementation for US1+US2 — AccountSettings

- [ ] T007 [US1] [US2] Migrate display name feedback in `packages/frontend/src/pages/AccountSettings.tsx`: remove inline Alert JSX for display name success and error; add `showSuccess(t('accountSettings.displayNameSuccess'))` in `displayNameMutation.onSuccess` and `showError(t('accountSettings.displayNameError'))` in `displayNameMutation.onError`; update JSDoc on changed functions
- [ ] T008 [US1] [US2] Migrate email change feedback in `packages/frontend/src/pages/AccountSettings.tsx`: remove `emailChangeMutation.isSuccess` Alert and `emailChangeErrorMessage()` Alert JSX; add `showSuccess(t('accountSettings.emailChangeSent'))` in `emailChangeMutation.onSuccess`; add `showError(emailChangeErrorMessage() ?? t('accountSettings.emailChangeError'))` in `emailChangeMutation.onError`; keep the blue pending-email `<Alert color="blue">` intact; update JSDoc
- [ ] T009 [US1] [US2] Migrate password change feedback in `packages/frontend/src/pages/AccountSettings.tsx`: remove `passwordSuccess` state and both Alert JSX blocks; add `showSuccess(t('accountSettings.success'))` in the `onSuccess` callback of `doChangePassword`; add `showError(passwordErrorMessage() ?? t('accountSettings.errorGeneric'))` in the `onError` callback; remove `passwordSuccess` state variable entirely; update JSDoc

**Checkpoint**: T006 tests now pass. No inline success/error Alert in AccountSettings. Blue pending-email notice still renders inline.

---

## Phase 4: US1 + US2 — AccountsAdmin Migration (Priority: P1)

**Goal**: All action success/error feedback in the Admin Accounts page delivered as toasts.

**Independent Test**: Invite a duplicate email as admin → red error toast appears. Send a test email successfully → green toast appears. No Alert blocks visible on the page after these actions.

### Tests for US1+US2 — AccountsAdmin ⚠️ Write FIRST — ensure they FAIL before T011–T013

- [ ] T010 Update `packages/frontend/tests/unit/AccountsAdmin.test.tsx`:
  - Update render wrapper to include `<Notifications />` (or use `renderWithNotifications`)
  - Add `notifications.clean()` in `beforeEach`
  - Update invite-success assertion to look for toast text instead of inline Alert
  - Update invite-error (409/502) assertions to look for toast text
  - Update test-email success and error assertions to look for toast text
  - Confirm tests FAIL before proceeding

### Implementation for US1+US2 — AccountsAdmin

- [ ] T011 [US1] [US2] Migrate `InviteForm` sub-component in `packages/frontend/src/pages/admin/AccountsAdmin.tsx`: remove `success` state and both Alert JSX blocks; add `showSuccess(t('accountsAdmin.inviteSuccess'))` call in `onSuccess` callback; replace `errorMessage()` Alert JSX with `showError(errorMessage() ?? t('accountsAdmin.inviteError'))` in `onError` callback; keep `errorMessage()` helper function for message resolution; update JSDoc
- [ ] T012 [P] [US1] [US2] Migrate `TestEmailForm` sub-component in `packages/frontend/src/pages/admin/AccountsAdmin.tsx`: remove `success` and `error` states and both Alert JSX blocks; replace try/catch success/error paths with `showSuccess(t('accountsAdmin.testEmailSuccess'))` and `showError(errorMessage() ?? t('accountsAdmin.testEmailError'))`; update JSDoc
- [ ] T013 [US1] [US2] Migrate account action errors in `packages/frontend/src/pages/admin/AccountsAdmin.tsx` (`AccountsAdmin` component): remove the combined `(archiveError || reactivateError || deleteError || roleError)` Alert block; add `onError` callbacks to each mutation hook (`useArchiveAccount`, `useReactivateAccount`, `useDeleteAccount`, `useChangeAccountRole`) calling `showError(actionErrorMessage(err) ?? t('accountsAdmin.actionError'))`; replace `isError` load Alert with a `useEffect(() => { if (isError) showError(t('accountsAdmin.loadError')); }, [isError])` pattern; update JSDoc

**Checkpoint**: T010 tests now pass. No inline success/error Alert in AccountsAdmin page.

---

## Phase 5: US1 + US2 — ContractList Migration (Priority: P1)

**Goal**: Contract delete error and list load error delivered as toasts.

**Independent Test**: Delete a contract while backend is unreachable → red toast appears; no inline Alert in the list. Load contracts with backend unreachable → red toast appears.

### Tests for US1+US2 — ContractList ⚠️ Write FIRST — ensure they FAIL before T015

- [ ] T014 Create `packages/frontend/tests/unit/ContractList.test.tsx` with tests:
  - Mock `useContracts` and `useDeleteContract` from `../../src/services/contracts.js`
  - Render with `<Notifications />` and `<MemoryRouter>`
  - Test: when `useDeleteContract` triggers `onError`, toast error text appears and no inline Alert is present
  - Test: when `useContracts` returns `isError: true`, toast load-error text appears
  - Confirm tests FAIL before proceeding

### Implementation for US1+US2 — ContractList

- [ ] T015 [US1] [US2] Migrate error feedback in `packages/frontend/src/pages/ContractList.tsx`: remove `deleteError` inline Alert; add `onError` callback to `useDeleteContract()` calling `showError(t('contractList.deleteError'))`; remove `isError` load Alert and add `useEffect(() => { if (isError) showError(t('contractList.loadError')); }, [isError])` pattern; update JSDoc on `ContractList` function

**Checkpoint**: T014 tests now pass. No inline error Alert in ContractList.

---

## Phase 6: US1 + US2 — ContractForm / ContractNew / ContractEdit Migration (Priority: P1)

**Goal**: Contract save/update errors delivered as toasts; `ContractForm` no longer accepts or renders an `error` prop.

**Independent Test**: Open a contract edit form, submit while backend is unreachable → red toast appears; no inline Alert inside the form.

### Tests for US1+US2 — ContractForm/ContractEdit ⚠️ Write FIRST — ensure they FAIL before T018–T020

- [ ] T016 Update `packages/frontend/tests/unit/ContractForm.test.tsx`: remove all test cases that assert on the `error` prop rendering an inline Alert (these test cases will become invalid once the prop is removed); confirm remaining tests still compile
- [ ] T017 Update `packages/frontend/tests/unit/ContractEdit.test.tsx`: update render wrapper to include `<Notifications />`; add a test that when the update mutation fails, a toast error message appears and no inline Alert is present inside the form; confirm test FAILS before proceeding

### Implementation for US1+US2 — ContractForm / ContractNew / ContractEdit

- [ ] T018 [US1] [US2] Remove the `error` prop from `ContractForm` in `packages/frontend/src/components/ContractForm.tsx`: delete `error?: string | null` from props interface; remove `error` parameter from function signature; remove `(validationError ?? error)` Alert JSX block (leave the `validationError`-only case if it still applies, otherwise remove the whole block); update JSDoc on the `ContractForm` function
- [ ] T019 [P] [US1] [US2] Update `packages/frontend/src/pages/ContractNew.tsx`: remove `error` state derivation from mutation; remove `error={...}` prop on `<ContractForm>`; add `onError: (err: Error) => showError(err.message)` to the `createContract` mutation call options; import `showError` from `../lib/notifications.js`; update JSDoc
- [ ] T020 [P] [US1] [US2] Update `packages/frontend/src/pages/ContractEdit.tsx`: remove `error={error instanceof Error ? error.message : null}` prop on `<ContractForm>`; add `onError: (err: Error) => showError(err.message)` to the `updateContract` mutation call options; import `showError` from `../lib/notifications.js`; keep the existing inline `isError` load Alert (it renders the whole page — appropriate since the page cannot function without data); update JSDoc

**Checkpoint**: T016/T017 tests now pass. ContractForm has no `error` prop. Submit errors show as toasts.

---

## Phase 7: US1 + US2 — DeleteAccountModal Migration (Priority: P1)

**Goal**: Account self-deletion error delivered as toast; sole-admin blocking warning stays inline.

**Independent Test**: Trigger delete while backend returns an error → red toast appears; the sole-admin orange Alert still renders when user is sole admin.

### Tests for US1+US2 — DeleteAccountModal ⚠️ Write FIRST — ensure they FAIL before T022

- [ ] T021 Update `packages/frontend/tests/unit/DeleteAccountModal.test.tsx`: update render wrapper to include `<Notifications />`; update the test asserting on `deleteMutation.isError` Alert to instead assert toast error text appears and no `role="alert"` Alert is present; confirm test FAILS before proceeding; also add assertion that the sole-admin orange Alert still renders when `isSoleAdmin={true}`

### Implementation for US1+US2 — DeleteAccountModal

- [ ] T022 [US1] [US2] Migrate delete error feedback in `packages/frontend/src/components/DeleteAccountModal.tsx`: remove `deleteMutation.isError` Alert JSX block; add `onError: () => showError(t('deleteModal.deleteError'))` to `useMutation` options; import `showError` from `../lib/notifications.js`; keep the `isSoleAdmin` orange Alert intact; update JSDoc on `DeleteAccountModal`

**Checkpoint**: T021 tests now pass. Delete error shows as toast. Sole-admin warning still inline.

---

## Phase 8: US3 — Public Pages Regression Verification (Priority: P2)

**Goal**: Confirm all public pages retain their inline feedback and produce no toast notifications.

**Independent Test**: Visit `/forgot-password`, submit — inline confirmation text appears; no toast element in DOM.

- [ ] T023 [P] [US3] Verify `packages/frontend/tests/unit/pages/ForgotPassword.test.tsx`: ensure existing inline feedback assertions still pass without adding `<Notifications />`; add an assertion that no element with `data-notifications-wrapper` attribute exists in the rendered output; run test and confirm it passes unchanged
- [ ] T024 [P] [US3] Verify `packages/frontend/tests/unit/pages/ResetPassword.test.tsx`: same as T023 — inline feedback assertions pass; no toast element present; run test and confirm it passes unchanged
- [ ] T025 [P] [US3] Inspect `packages/frontend/src/pages/AcceptInvitation.tsx`, `EmailVerifyConfirm.tsx`, and `SignIn.tsx` to confirm no `showSuccess`/`showError` imports were accidentally introduced during migration; confirm no import of `notifications.ts` exists in these files

**Checkpoint**: All public-page tests green. No notification imports in public pages.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T026 Run `pnpm --filter @pcm/frontend build` (TypeScript strict check + Vite build) and fix any type errors introduced by the `error` prop removal or new imports
- [ ] T027 Run full unit test suite `pnpm --filter @pcm/frontend test` and ensure all tests pass (zero failures, zero skipped)
- [ ] T028 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` to note that success and error messages now appear as toast notifications in the top-right corner (brief mention under UX/Feedback section)
- [ ] T029 [P] Update `README.md` and `README.de.md` to reflect the global notification system if user-facing feature summary sections exist
- [ ] T030 Run quickstart.md validation scenarios manually (scenarios 1–11) and confirm all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 (package installed)
- **Phases 3–7 (Migration)**: All depend on T002–T005 (foundational complete); can proceed in any order after that
- **Phase 8 (Regression)**: Can run in parallel with phases 3–7 (public pages untouched)
- **Phase 9 (Polish)**: Depends on all migration phases complete

### User Story Dependencies

- **US4 (P1)**: Start after T001 — no dependency on other stories
- **US1 + US2 per component (P1)**: Start after US4 complete (T002–T005) — independent per component
- **US3 (P2)**: Independent — public pages untouched, can verify at any time

### Within Each Migration Phase

- Test task MUST be written and confirmed FAILING before implementation task begins (Red-Green-Refactor)
- Implementation tasks within a phase that touch different files are marked [P] and can run in parallel

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T007, T008, T009 are the same file (AccountSettings.tsx) — run sequentially
- T011 and T012 touch the same file but different sub-components — can be parallelized carefully if worked in separate blocks; otherwise run sequentially
- T019 and T020 are parallel (ContractNew.tsx vs ContractEdit.tsx)
- T023, T024, T025 are fully parallel (Phase 8)
- T028 and T029 are parallel (docs updates)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T001, run these in parallel:
Task T002: "Write failing tests for notifications.ts in packages/frontend/tests/unit/notifications.test.ts"
Task T003: "Create test-utils.tsx with renderWithNotifications helper"
# Then sequentially:
Task T004: "Create packages/frontend/src/lib/notifications.ts"
Task T005: "Add <Notifications /> to packages/frontend/src/main.tsx"
```

## Parallel Example: Phase 6 (ContractForm migration)

```bash
# After T018 (ContractForm error prop removed):
Task T019: "Update packages/frontend/src/pages/ContractNew.tsx"
Task T020: "Update packages/frontend/src/pages/ContractEdit.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (T001) + Phase 2 (T002–T005) — infrastructure ready
2. Complete Phase 3 (T006–T009) — AccountSettings fully migrated
3. **STOP and VALIDATE**: run tests, manually check Account Settings
4. Continue migration phases 4–7 component by component

### Incremental Delivery

Each migration phase (3–7) is independently completable and verifiable. Complete and test one component before moving to the next. Phase 8 (regression) can be verified incrementally alongside each migration phase.

---

## Notes

- `[P]` = different files, no dependency on an incomplete sibling task
- Tests marked ⚠️ must FAIL before the implementation task starts (constitution TDD mandate)
- `notifications.clean()` in test `beforeEach`/`afterEach` prevents state bleeding between tests
- `ContractEdit.tsx` load-error Alert is intentionally NOT migrated — it renders when the page has no data at all (not an action result)
- `DeleteAccountModal` sole-admin `<Alert color="orange">` is intentionally NOT migrated — blocking condition, not an error
- `AccountSettings` pending-email `<Alert color="blue">` is intentionally NOT migrated — persistent informational state
- Import paths use `.js` extension (ESM module convention for this project)
