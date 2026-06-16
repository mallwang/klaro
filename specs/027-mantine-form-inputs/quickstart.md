# Quickstart: Mantine Form Inputs — Validation Guide

## Prerequisites

- `pnpm install` completed at repo root
- Dev server not required for unit tests; required for visual/E2E verification

---

## 1. Install new dependencies

```bash
cd packages/frontend
pnpm add @mantine/dates dayjs
```

Verify both packages appear under `packages/frontend/package.json` > `dependencies`.

---

## 2. Run unit tests (TDD loop)

```bash
pnpm --filter @pcm/frontend test
```

All tests must be green after implementation. Key test groups to watch:

| Test file | What it covers |
|-----------|---------------|
| `ContractForm.test.tsx` | Currency input rendering, DatePickerInput rendering, form submission, layout |

### Tests that change behaviour after this feature

| Test | Change needed |
|------|--------------|
| `'amount field has a visible EUR currency prefix when a value is set'` | Update assertion to check for `EUR` text in rightSection instead of `€` prefix in input value |
| `'renders with provided default values'` — date assertions | Update if locale format differs; `valueFormat="YYYY-MM-DD"` keeps ISO format so assertion may remain unchanged |
| `'pre-filled status, start date, and end date appear in the same statusDateRow wrapper'` | Replace `getByDisplayValue('2025-01-01')` with `getByLabelText(/start date/i)` etc. |

---

## 3. Visual check — dev server

```bash
pnpm --filter @pcm/frontend dev
```

1. Navigate to **Add Contract** or open any existing contract for editing.
2. **Currency input**: The amount field shows a numeric input with `EUR` displayed on the right side as a non-editable badge. Entering a number and submitting saves the correct amount.
3. **DatePickerInput**: Clicking the Start Date or End Date field opens a calendar popover. Selecting a date populates the field. Clicking the clear icon (or selecting the date again if `allowDeselect` is used on the inner `DatePicker`) clears the field. Submitting with no date selected saves `null`.
4. **Layout**: The `statusDateRow` grid (status + start date + end date) remains 3 columns, responsive to 1 column on narrow screens.
5. **Edit mode**: Opening an existing contract shows pre-filled dates in the DatePickerInput fields.

---

## 4. Type check

```bash
pnpm --filter @pcm/frontend build
# or
pnpm tsc --noEmit
```

No TypeScript errors expected.

---

## 5. Expected outcomes

| Scenario | Expected |
|----------|---------|
| Amount field, empty | Numeric input with "EUR" badge visible, no value |
| Amount field, 15.99 entered | Input shows 15.99, EUR badge visible |
| Start date, none selected | Field shows placeholder, submits as `null` |
| Start date, 2026-01-01 selected | Field shows `2026-01-01` (YYYY-MM-DD), submits as `"2026-01-01"` |
| Start date selected, then cleared | Field shows placeholder, submits as `null` |
| Edit existing contract with dates | Both date fields pre-populated from stored ISO strings |
