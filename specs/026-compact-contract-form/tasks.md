# Tasks: Compact Contract Form Layout

**Input**: Design documents from `specs/026-compact-contract-form/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | quickstart.md ✅

**Source files**: `packages/frontend/src/components/ContractForm.tsx` and `ContractForm.module.css` only — no backend, no shared-package, no page-level changes.

**Constitution Note**: TDD (Principle I) is non-negotiable. Test tasks below must be written and confirmed FAILING before the corresponding implementation tasks are started.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Foundational — TDD Tests (Write First)

**Purpose**: Write failing tests that define the expected DOM grouping structure. These MUST fail before any implementation begins.

**⚠️ CRITICAL**: Do NOT start Phase 2 until these tests exist and are confirmed FAILING.

- [ ] T001 Add `describe('ContractForm – layout grouping (DOM structure)')` block to `packages/frontend/tests/unit/ContractForm.test.tsx` with four tests:
  1. name and category inputs share the same immediate parent wrapper (assert `nameInput.closest('[class*="twoColumnRow"]') === categoryInput.closest('[class*="twoColumnRow"]')`)
  2. amount and billing interval inputs share the same immediate parent wrapper (same pattern with `twoColumnRow`)
  3. status, start date, and end date inputs share the same immediate parent wrapper (assert all three share a parent matching `statusDateRow`)
  4. the cancellation period label element is contained within a half-width wrapper (assert `cancellationLabel.closest('[class*="cancellationHalf"]')` is not null)
- [ ] T002 Run `pnpm --filter frontend test --run` and confirm all four new tests FAIL (red) — proceed to Phase 2 only after this is confirmed

**Checkpoint**: Four failing tests documented. Phase 2 can now begin.

---

## Phase 2: US1 + US3 — Compact Layout Implementation (Priority: P1) 🎯 MVP

**Goal**: Arrange form fields into the specified row groups with responsive collapse on narrow viewports, while keeping all existing validation and submission behaviour intact.

**Independent Test**: Navigate to the new-contract page on a 1280 px viewport — name+category, amount+interval, and status+start+end each appear in a single horizontal row; cancellation occupies only the left half. All existing `ContractForm` unit tests still pass.

### Tests (already written in Phase 1 — verify FAILING before implementing)

### Implementation

- [ ] T003 [P] [US1] Add CSS classes to `packages/frontend/src/components/ContractForm.module.css`:
  - Add `.twoColumnRow`: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--mantine-spacing-md);`
  - Add `.statusDateRow`: `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--mantine-spacing-md);`
  - Add `.cancellationHalf`: `max-width: 50%;`
  - Add responsive block `@media (max-width: 48em)` collapsing `.twoColumnRow` and `.statusDateRow` to `grid-template-columns: 1fr` and `.cancellationHalf` to `max-width: 100%`
  - Remove the existing `.dateGrid` rule
- [ ] T004 [US1] In `packages/frontend/src/components/ContractForm.tsx`, wrap the name custom `<div>` and the category `<Select>` together in `<div className={classes.twoColumnRow}>` (replaces two sibling elements with a grouped wrapper)
- [ ] T005 [US1] In `packages/frontend/src/components/ContractForm.tsx`, wrap `<NumberInput id="amount">` and `<Select id="billingInterval">` together in `<div className={classes.twoColumnRow}>`
- [ ] T006 [US1] In `packages/frontend/src/components/ContractForm.tsx`, replace the standalone `<Select id="status">` and `<div className={classes.dateGrid}>` with a single `<div className={classes.statusDateRow}>` containing the status select, start date input, and end date input as direct children (remove `.dateGrid` reference)
- [ ] T007 [US3] In `packages/frontend/src/components/ContractForm.tsx`, add `className={classes.cancellationHalf}` to the outer `<div>` that wraps the cancellation period label and the inner `.cancellationRow` div
- [ ] T008 [US1] Update the JSDoc comment on the `ContractForm` function in `packages/frontend/src/components/ContractForm.tsx` to mention the compact multi-column row layout
- [ ] T009 Run `pnpm --filter frontend test --run` — confirm ALL tests pass (including the four new DOM structure tests from Phase 1 now green, and all pre-existing tests still passing)

**Checkpoint**: Form displays compact layout at 1280 px; all unit tests green. US1 and US3 independently verified.

---

## Phase 3: US2 — Edit Mode Compact Layout (Priority: P2)

**Goal**: Confirm that pre-filled contract values are correctly positioned within the compact row groups when the form is opened in edit mode (via `defaultValues` prop).

**Independent Test**: Render `ContractForm` with a full set of `defaultValues` and assert each pre-filled value appears inside the correct row-group wrapper.

### Tests

- [ ] T010 [US2] Add test to `packages/frontend/tests/unit/ContractForm.test.tsx` inside a new `describe('ContractForm – edit mode layout grouping')` block:
  - Render with `defaultValues: { name: 'Netflix', category: 'SUBSCRIPTIONS', status: 'ACTIVE', startDate: '2025-01-01', endDate: '2025-12-31' }`
  - Assert name display value and category combobox share the same `.twoColumnRow` parent
  - Assert status combobox, start date input, and end date input share the same `.statusDateRow` parent

### Implementation

- [ ] T011 [US2] Run `pnpm --filter frontend test --run` — confirm T010 test is green and no regressions introduced

**Checkpoint**: Edit mode layout confirmed correct. All three user stories now independently verified.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates required by the project constitution for every implemented feature.

- [ ] T012 [P] Update `README.md` — add a sentence noting the compact multi-column form layout under the contract management section
- [ ] T013 [P] Update `README.de.md` — German equivalent of T012 (consistent with English)
- [ ] T014 [P] Update `docs/user-guide.md` — document the compact form layout from a user perspective: which fields share rows, how the layout collapses on mobile
- [ ] T015 [P] Update `docs/user-guide.de.md` — German equivalent of T014 (consistent with English)
- [ ] T016 Run quickstart.md validation: start dev server (`pnpm --filter frontend dev`), open new-contract page at 1280 px and 375 px and verify all layout requirements from quickstart.md are met visually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational — TDD)**: No dependencies — start immediately
- **Phase 2 (US1 + US3)**: Depends on Phase 1 tests confirmed FAILING — blocks until T002 passes
- **Phase 3 (US2)**: Depends on Phase 2 completion (T009 green)
- **Phase 4 (Polish)**: Depends on Phase 3 completion

### User Story Dependencies

- **US1 (P1)**: CSS + DOM restructuring — no prior story needed
- **US3 (P1)**: Covered by same implementation as US1; functional correctness verified by T009
- **US2 (P2)**: Builds on US1/US3 implementation; adds edit-mode layout test only

### Within Phase 2

- T003 (CSS) is parallelisable with T004–T007 (TSX) since they are different files
- T004, T005, T006, T007 are all in the same file (`ContractForm.tsx`) — execute sequentially

---

## Parallel Example: Phase 2

```bash
# T003 (CSS module) and T004 (first TSX change) can start together:
Task: "Add CSS classes to ContractForm.module.css"          # T003 — CSS file
Task: "Wrap name+category in twoColumnRow"                  # T004 — TSX file

# T012–T015 (documentation) can all run in parallel:
Task: "Update README.md"                                    # T012
Task: "Update README.de.md"                                 # T013
Task: "Update docs/user-guide.md"                           # T014
Task: "Update docs/user-guide.de.md"                        # T015
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Write failing layout tests
2. Complete Phase 2: CSS + DOM changes, confirm all tests green
3. **STOP and VALIDATE**: Visual check at 1280 px and 375 px per quickstart.md
4. US1 + US3 delivered — form is compact and fully functional

### Incremental Delivery

1. Phase 1 → failing tests defined
2. Phase 2 → compact layout live, all tests green (MVP)
3. Phase 3 → edit mode test added and confirmed
4. Phase 4 → documentation complete, feature shippable

---

## Notes

- All changes are isolated to `ContractForm.tsx` and `ContractForm.module.css` — zero risk of regressions in unrelated components
- `[P]` tasks involve different files and have no incomplete-task dependencies
- TDD is non-negotiable per the project constitution — T001 tests must fail before T003–T007 begin
- No backend, no shared-package, no API contract changes required
