# Tasks: Admin Account Page Overhaul

**Input**: Design documents from `specs/028-admin-account-page-overhaul/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**TDD**: The project constitution (Principle I) mandates Test-First. All failing tests must be
written and confirmed to fail BEFORE any implementation code in `AccountsAdmin.tsx` is changed.

**Organization**: Tasks are grouped by user story priority. Because all user stories touch the
same single source file (`AccountsAdmin.tsx`), implementation phases are sequential rather than
parallel. Test-writing tasks for all stories are batched in Phase 2 so the full set of failing
tests can be confirmed before implementation begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent scope, no in-flight dependency)
- **[Story]**: User story label (US1–US5) from spec.md

## Path Conventions

```text
packages/frontend/src/pages/admin/AccountsAdmin.tsx   ← sole changed source file
packages/frontend/tests/unit/AccountsAdmin.test.tsx   ← test file updated
docs/user-guide.md, docs/user-guide.de.md             ← user guide
README.md, README.de.md                               ← readme files
```

---

## Phase 1: Setup

**Purpose**: Confirm no new dependencies or files are needed before starting.

- [ ] T001 Verify `AccountsAdmin.tsx` and `AccountsAdmin.test.tsx` are the only files that need changes (cross-check plan.md §Source Code against the spec — no new packages, hooks, or shared types are introduced)

---

## Phase 2: Failing Tests (TDD — All Stories)

**Purpose**: Write ALL failing tests before touching `AccountsAdmin.tsx`. Confirm each test
fails for the right reason before proceeding to Phase 3.

> **⚠️ CRITICAL — Constitution Principle I**: Every test in this phase MUST be run and
> confirmed to FAIL before any implementation code is written.

### Tests for US1 — Accounts Table First

- [ ] T002 [US1] Add `describe('AccountsAdmin – layout order')` block to `packages/frontend/tests/unit/AccountsAdmin.test.tsx` with a test that calls `renderPage()`, then uses `compareDocumentPosition` to assert that the accounts table (identified by the row containing `'Alice'`) appears before the invite email input (`getByLabelText(/email/i)` scoped to the invite form) in the DOM. Run — confirm FAIL.

### Tests for US2 — Inline Invite Row (no standalone InviteForm Paper)

- [ ] T003 [US2] In the same `describe` block in `packages/frontend/tests/unit/AccountsAdmin.test.tsx`, add a test that asserts the invite email input is rendered directly inside the invitations section — verified by checking that the `<form>` ancestor of the invite input does NOT contain a `Text` element with the text matching `t('accountsAdmin.inviteTitle')` (i.e., the standalone card heading is gone). Run — confirm FAIL.

### Tests for US5 — Section Heading Outside the Table Paper

- [ ] T004 [US5] In the same `describe` block in `packages/frontend/tests/unit/AccountsAdmin.test.tsx`, add a test that asserts the `pendingInvitationsTitle` text is rendered as a `heading` element (e.g., `getByRole('heading', { name: /pending invitations/i })`), confirming it is a `Title` component rather than a `Text fw={600}` inside the `Paper`. Run — confirm FAIL.

**Checkpoint — Phase 2 complete**: All three tests (T002, T003, T004) confirmed failing. Implementation may now begin.

---

## Phase 3: User Story 1 — Accounts Table First (P1) 🎯 MVP

**Goal**: Move the accounts table to the top of the page, immediately below the page heading.

**Independent Test**: Navigate to Manage Accounts — the accounts table (with names, emails, roles, status badges) is the first content visible without scrolling on a 1280 px viewport.

### Implementation for US1

- [ ] T005 [US1] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, move the accounts `Paper` + `Table.ScrollContainer` block (currently at the bottom of the `Stack`) to immediately after the page title `<div>` block, before the invite form and test email sections. Keep all account-row JSX, the loading spinner, and the delete-confirmation `Modal` unchanged. Run `pnpm --filter @pcm/frontend test --run` — T002 must now pass.

**Checkpoint — Phase 3 complete**: Accounts table visible first; T002 green; all pre-existing tests still pass.

---

## Phase 4: User Story 2 — Compact Invitations Section (P2)

**Goal**: Replace the standalone `InviteForm` card with an inline invite row above the invitations table, grouped under a single "Invitations" section.

**Independent Test**: In the Invitations section, the email input and "Send Invitation" button appear as an inline row directly above the invitations table (or empty-state message) with no intervening `Paper` card between them.

### Implementation for US2

- [ ] T006 [US2] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, dissolve the `InviteForm` sub-component: lift its `email` state (`useState('')`), the `useSendInvitation` hook call, `resolveInviteError`, and `handleSubmit` into the body of `AccountsAdmin`. Update the JSDoc comment on each moved function. Delete the `InviteForm` function entirely.

- [ ] T007 [US2] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, render the inline invite row in the Invitations section — a `<form onSubmit={handleSubmit}>` containing a `Group align="flex-end" gap="sm"` with the `TextInput` (id `"invite-email"`, type email, label `t('accountsAdmin.emailLabel')`, flex: 1) and the `Button` (type submit) — placed directly above the `<InvitationsTable />` call, inside the Stack, without a wrapping standalone `Paper` card.

- [ ] T008 [US2] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, remove the `Text fw={600}` heading from inside `InvitationsTable`'s wrapping `Paper` (the `pendingInvitationsTitle` text inside the `Paper` above the `Table.ScrollContainer`). The section `Title order={3}` rendered in the parent (added in Phase 6) will replace it. Run `pnpm --filter @pcm/frontend test --run` — T003 must now pass and all existing invite-form tests (success toast, 409 error, 502 error) must remain green.

**Checkpoint — Phase 4 complete**: Inline invite row rendered; T003 green; invite-form functionality tests green.

---

## Phase 5: User Story 3 — Page Width Constraint (P2)

**Goal**: Constrain the page content to `maw={900} mx="auto"`, matching the My Account page width.

**Independent Test**: With a viewport wider than 900 px, the page content is centred and does not stretch to full width — visually matching the My Account (`AccountSettings`) page.

### Implementation for US3

- [ ] T009 [US3] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, change the outermost `<Stack gap="lg">` to `<Stack gap="lg" maw={900} mx="auto">`. Confirm via `pnpm --filter @pcm/frontend tsc --noEmit` (no type errors) and `pnpm --filter @pcm/frontend test --run` (all tests still green). Visual verification per `quickstart.md` Scenario 2 is required before marking complete.

**Checkpoint — Phase 5 complete**: Width constraint applied; all tests green; visual check done.

---

## Phase 6: User Story 5 — Aligned Section Headings (P2)

**Goal**: Add `Title order={3}` section headings outside the table Papers, and add `Divider` separators, so the "Pending Invitations" heading aligns with the table content.

**Independent Test**: The "Pending Invitations" heading and the "Email" column header share the same left content boundary when rendered — no visual offset from nested padding.

### Implementation for US5

- [ ] T010 [US5] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, add the following structure to the Stack between the accounts table block and the `InvitationsTable` / inline invite row:
  ```
  <Divider my="md" />
  <Title order={3}>{t('accountsAdmin.pendingInvitationsTitle')}</Title>
  {/* inline invite row (form) */}
  <InvitationsTable />
  <Divider my="md" />
  <Title order={3}>{t('accountsAdmin.testEmailTitle')}</Title>
  <Text size="sm" c="dimmed">{t('accountsAdmin.testEmailDescription')}</Text>
  <TestEmailForm />
  ```
  Remove the `Text fw={600}` / `Text size="sm" c="dimmed"` heading block from inside `TestEmailForm`'s `Paper` (since the section `Title` + description `Text` are now outside it).

- [ ] T011 [US5] Run `pnpm --filter @pcm/frontend test --run` — T004 (`heading` role for "Pending Invitations") must now pass. Confirm visual alignment per `quickstart.md` Scenario 3.

**Checkpoint — Phase 6 complete**: Section titles outside Papers; T004 green; alignment visually confirmed.

---

## Phase 7: User Story 4 — Test Email at the Bottom (P3)

**Goal**: Ensure the test email section is the last section on the page.

**Independent Test**: Scrolling to the bottom of the page reveals the test email form as the final content section.

### Implementation for US4

- [ ] T012 [US4] Verify the current JSX order in `packages/frontend/src/pages/admin/AccountsAdmin.tsx` after Phases 3–6: accounts table → Divider → Invitations heading + invite row + InvitationsTable → Divider → Test Email heading + description + TestEmailForm. If `TestEmailForm` is already last (it should be after Phase 6), no code change is needed — mark as confirmed. Visual verification per `quickstart.md` Scenario 1 (step "scroll to bottom") is the acceptance gate.

**Checkpoint — Phase 7 complete**: Test email section confirmed last; all tests green.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: JSDoc, docs, and final verification.

- [ ] T013 [P] Update the file-level JSDoc block in `packages/frontend/src/pages/admin/AccountsAdmin.tsx` to reflect the new section structure (accounts first, invitations section with inline invite row, test email last).

- [ ] T014 [P] Add/update JSDoc on all functions in `packages/frontend/src/pages/admin/AccountsAdmin.tsx` whose implementation changed during Phases 3–7: `AccountsAdmin` (return JSX restructured), `resolveInviteError` (moved from `InviteForm`), `handleSubmit` (moved from `InviteForm`). Verify `handleSubmit` for the test email form also has a JSDoc if it changed.

- [ ] T015 [P] Update `README.md` and `README.de.md` to note that the admin Manage Accounts page now shows the accounts list first, with the invitations and test email sections below in a constrained, centred layout consistent with the My Account page.

- [ ] T016 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` to document the new page layout: accounts table at top, Invitations section with inline invite form below, Test Email at the bottom; note the improved alignment in the Invitations section.

- [ ] T017 Run full test suite and type-check: `pnpm --filter @pcm/frontend test --run && pnpm --filter @pcm/frontend tsc --noEmit`. All tests must pass, zero type errors.

- [ ] T018 Run all six quickstart.md validation scenarios manually in the browser to confirm end-to-end correctness before closing the feature branch.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Failing Tests)**: Depends on Phase 1 — all tests must be confirmed FAILING before Phase 3.
- **Phase 3 (US1)**: Depends on Phase 2 — first implementation change.
- **Phase 4 (US2)**: Depends on Phase 3 — invitations section shape assumes accounts are already moved.
- **Phase 5 (US3)**: Depends on Phase 4 — width constraint can be applied once section structure is stable.
- **Phase 6 (US5)**: Depends on Phase 4 — section headings reference the same Invitations block restructured in Phase 4.
- **Phase 7 (US4)**: Depends on Phase 6 — test email position confirmed after full section structure is in place.
- **Phase 8 (Polish)**: Depends on Phases 3–7 — all implementation complete.

### User Story Dependencies

All stories touch the same file. Sequential order is enforced:

```
US1 (accounts first) → US2 (compact invitations) → US3 (width) → US5 (alignment) → US4 (test email last)
```

US4 is last in implementation (P3) despite US5 being P2 because US4 is a positional check that is implicitly satisfied once US5's section structure is in place.

### Parallel Opportunities

Within Phase 8, T013, T014, T015, T016 are all marked [P] and may be executed in parallel since they touch different files.

---

## Parallel Example: Phase 8 Polish

```text
# These four tasks can be launched together:
Task T013: Update file-level JSDoc in AccountsAdmin.tsx
Task T014: Update function-level JSDoc in AccountsAdmin.tsx (same file — run after T013 if combined)
Task T015: Update README.md and README.de.md
Task T016: Update docs/user-guide.md and docs/user-guide.de.md
```

Note: T013 and T014 both touch `AccountsAdmin.tsx` — run them sequentially in that file, then T015 and T016 truly in parallel.

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1 (Setup check).
2. Complete Phase 2 (write T002 failing test only for US1).
3. Complete Phase 3 (T005 — move accounts table up).
4. **STOP AND VALIDATE**: T002 green, existing tests green, accounts table visually first.

### Incremental Delivery

1. Phase 1 + 2 → all failing tests confirmed.
2. Phase 3 → accounts table first (MVP).
3. Phase 4 → compact invitations section.
4. Phase 5 → width constraint.
5. Phase 6 → section headings + alignment fix.
6. Phase 7 → test email position confirmed.
7. Phase 8 → docs and polish.

Each phase leaves the component in a shippable, fully-tested state.

---

## Notes

- All 18 tasks affect only two files during implementation: `AccountsAdmin.tsx` and `AccountsAdmin.test.tsx`.
- No backend, API, schema, or i18n changes are required.
- The `maw` / `mx` props cannot be unit-tested meaningfully in JSDOM — US3 is validated visually per `quickstart.md` Scenario 2.
- US4 (test email last) has no dedicated unit test because DOM order of the test email section relative to the end of the page is implicitly confirmed by the structure enforced in Phase 6 + the visual check in `quickstart.md` Scenario 1.
- Commit after each phase or after each logical task group.
