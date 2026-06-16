# Tasks: Mantine Form Inputs Enhancement

**Input**: Design documents from `specs/027-mantine-form-inputs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — project constitution mandates Test-First (NON-NEGOTIABLE). Tests must
be written and confirmed FAILING before any implementation code is committed.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in every description

## Path Conventions

```text
packages/frontend/
├── package.json
└── src/components/ContractForm.tsx

packages/frontend/tests/unit/
└── ContractForm.test.tsx
```

---

## Phase 1: Setup

**Purpose**: Add the new `@mantine/dates` and `dayjs` packages required by both user stories.

- [ ] T001 Add `@mantine/dates@^7` and `dayjs` to `packages/frontend/package.json` by running `pnpm add @mantine/dates dayjs` from `packages/frontend/`

**Checkpoint**: `packages/frontend/package.json` lists both new packages; `pnpm install` is clean.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared foundational work needed beyond the package install. Both user stories
target the same single component file but affect independent sections and can be approached
sequentially in priority order.

**⚠️ CRITICAL**: T001 (package install) MUST be complete before any user story work begins.

---

## Phase 3: User Story 1 — Currency Input for Amount (Priority: P1) 🎯 MVP

**Goal**: Replace the amount `NumberInput` (which currently shows a `€` prefix inside the
input) with the Mantine community currency input pattern: a `NumberInput` with a static
"EUR" badge in the `rightSection`.

**Independent Test**: Open the contract form, observe the amount field — the EUR label is
visible to the right of the numeric input. Enter a value, submit the form, verify the amount
is saved correctly.

### Tests for User Story 1 (TDD — RED phase first)

> **Write these tests FIRST, confirm they FAIL, then implement.**

- [ ] T002 [US1] Update the existing test `'amount field has a visible EUR currency prefix when a value is set'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — change assertion from `toHaveDisplayValue(/€/)` to check that an element with text `EUR` is visible alongside the amount input (e.g. `screen.getByText('EUR')`)
- [ ] T003 [P] [US1] Add new test `'amount EUR badge is always visible regardless of input value'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with no defaultValues, assert `screen.getByText('EUR')` is present
- [ ] T004 [P] [US1] Add new test `'amount field does not show a € symbol in the input value'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with `defaultValues: { amount: '100' }`, assert the amount input display value does NOT contain `€`

### Implementation for User Story 1

- [ ] T005 [US1] In `packages/frontend/src/components/ContractForm.tsx`: replace the `NumberInput` for `amount` (the one with `prefix="€"`) — remove `prefix="€"`, add `rightSection={<Text size="sm" fw={500} c="dimmed" pr="xs">EUR</Text>}` and `rightSectionWidth={52}`. Confirm `Text` is already imported from `@mantine/core`.
- [ ] T006 [US1] Update the file-level JSDoc block in `packages/frontend/src/components/ContractForm.tsx` and the `ContractForm` function JSDoc to reflect the currency badge change

**Checkpoint**: Run `pnpm --filter @pcm/frontend test` — all US1 tests pass and no regressions.

---

## Phase 4: User Story 2 — DatePickerInput for Start/End Dates (Priority: P2)

**Goal**: Replace the two `TextInput type="date"` elements for `startDate` and `endDate`
with `DatePickerInput` components from `@mantine/dates`. The inputs must support clearing
a selected date (via the `clearable` prop), be pre-populated when editing an existing contract,
and submit ISO date strings (or `null`) to the backend unchanged.

**Independent Test**: Open the contract form, click the Start Date field — a calendar popover
appears. Select a date, verify the field shows it. Click the clear (×) button, verify the field
is empty. Submit without a date and verify `startDate: null` is sent.

### Tests for User Story 2 (TDD — RED phase first)

> **Write these tests FIRST, confirm they FAIL, then implement.**

- [ ] T007 [US2] Update test `'pre-filled status, start date, and end date appear in the same statusDateRow wrapper'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — replace `screen.getByDisplayValue('2025-01-01')` with `screen.getByLabelText(/start date/i)` and `screen.getByDisplayValue('2025-12-31')` with `screen.getByLabelText(/end date/i)`
- [ ] T008 [P] [US2] Add new test `'start date DatePickerInput is pre-populated from defaultValues'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with `defaultValues: { startDate: '2026-03-15' }`, assert `screen.getByLabelText(/start date/i)` has display value `'2026-03-15'`
- [ ] T009 [P] [US2] Add new test `'end date DatePickerInput is pre-populated from defaultValues'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with `defaultValues: { endDate: '2026-12-31' }`, assert `screen.getByLabelText(/end date/i)` has display value `'2026-12-31'`
- [ ] T010 [P] [US2] Add new test `'start date submits as ISO string when pre-populated'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with `defaultValues: { startDate: '2026-06-01', name: 'Test', amount: '10' }`, submit, assert `payload.startDate === '2026-06-01'`
- [ ] T011 [P] [US2] Add new test `'end date submits as null when field is empty'` in `packages/frontend/tests/unit/ContractForm.test.tsx` — render with no defaultValues, fill name + amount, submit, assert `payload.endDate === null`

### Implementation for User Story 2

- [ ] T012 [US2] In `packages/frontend/src/components/ContractForm.tsx`: update `ContractFormValues` interface — change `startDate: string` to `startDate: Date | null` and `endDate: string` to `endDate: Date | null`
- [ ] T013 [US2] In `packages/frontend/src/components/ContractForm.tsx`: update `useState` initial values for `startDate` and `endDate` — convert incoming ISO strings to `Date | null`: `startDate: defaultValues?.startDate ? new Date(defaultValues.startDate) : null`; same pattern for `endDate`
- [ ] T014 [US2] In `packages/frontend/src/components/ContractForm.tsx`: update the `handleSubmit` function — convert `values.startDate` (`Date | null`) to ISO string: `startDate: values.startDate ? values.startDate.toISOString().slice(0, 10) : null`; same for `endDate`
- [ ] T015 [US2] In `packages/frontend/src/components/ContractForm.tsx`: add import `import { DatePickerInput } from '@mantine/dates';` and `import '@mantine/dates/styles.css';` after the existing `@mantine/core` import
- [ ] T016 [US2] In `packages/frontend/src/components/ContractForm.tsx`: replace the two `TextInput type="date"` elements in the `statusDateRow` div — replace start date `TextInput` with `<DatePickerInput id="startDate" label={t('contractForm.startDateLabel')} variant="filled" value={values.startDate} onChange={(val) => setValues((v) => ({ ...v, startDate: val }))} valueFormat="YYYY-MM-DD" clearable />` and end date `TextInput` with the equivalent for `endDate`

**Checkpoint**: Run `pnpm --filter @pcm/frontend test` — all US2 tests pass and all US1 tests still pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, documentation, and final validation.

- [ ] T017 [P] Run `pnpm tsc --noEmit` (or `pnpm --filter @pcm/frontend build`) from repo root — zero TypeScript errors required
- [ ] T018 [P] Run `pnpm --filter @pcm/frontend test` — all tests green; note count in commit message
- [ ] T019 Update `README.md` and `README.de.md` at repo root — add a note that the contract form now uses a Mantine currency input and date pickers
- [ ] T020 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` — document the new amount field (EUR badge) and date picker (calendar popup with clear button) from a user perspective
- [ ] T021 Start dev server (`pnpm --filter @pcm/frontend dev`) and run through the quickstart.md visual checks in `specs/027-mantine-form-inputs/quickstart.md` — verify currency badge, date picker popover, pre-population in edit mode, and clear/deselect behaviour

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: N/A — absorbed into Phase 1
- **Phase 3 (US1 — Currency)**: Depends on T001 (package install)
- **Phase 4 (US2 — DatePicker)**: Depends on T001; can start after Phase 3 or in parallel after T001 since they touch non-overlapping lines in `ContractForm.tsx`
- **Phase 5 (Polish)**: Depends on all Phase 3 + Phase 4 tasks complete

### User Story Dependencies

- **US1 (P1)**: Starts after T001 — no dependency on US2
- **US2 (P2)**: Starts after T001 — no dependency on US1 (different lines in the same file)

### Within Each User Story (TDD order)

1. Write tests (T002–T004 for US1, T007–T011 for US2) — confirm they FAIL
2. Implement (T005–T006 for US1, T012–T016 for US2) — confirm tests turn GREEN
3. Commit when all tests in the story pass

### Parallel Opportunities

- T003 and T004 can be written in parallel (both new test cases, independent)
- T008, T009, T010, T011 can all be written in parallel (independent new test cases)
- T017 and T018 can run in parallel (type check + test run)
- T019 and T020 can be written in parallel (independent doc files)

---

## Parallel Example: User Story 2

```bash
# Write all new test cases for US2 in parallel (all in the same file, but non-conflicting blocks):
T008: start date pre-population test
T009: end date pre-population test
T010: start date ISO string submission test
T011: end date null submission test

# Then implement in sequence (same file, ordered):
T012 → T013 → T014 → T015 → T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: install packages
2. Complete Phase 3 (T002–T006): currency input with tests
3. **STOP and VALIDATE**: `pnpm --filter @pcm/frontend test` — all green
4. The form now shows EUR badge — US1 is done and independently shippable

### Full Feature Delivery

1. T001 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (Polish)
2. Each phase validated by test run before proceeding

---

## Notes

- [P] tasks = different content / non-conflicting sections, can be done in parallel
- Constitution Principle I (Test-First) is NON-NEGOTIABLE: all test tasks must be written and confirmed failing before their corresponding implementation tasks
- `valueFormat="YYYY-MM-DD"` on `DatePickerInput` ensures existing display-value assertions remain valid
- The `clearable` prop on `DatePickerInput` provides the deselect/clear behaviour the user requested
- No backend, API, or shared-types changes needed — this is a pure frontend component update
