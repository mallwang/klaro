# Implementation Plan: Mantine Form Inputs Enhancement

**Branch**: `027-mantine-form-inputs` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/027-mantine-form-inputs/spec.md`

## Summary

Replace the contract amount `NumberInput` (currently using a `€` prefix) with the Mantine
community currency input pattern (`NumberInput` + static "EUR" badge in `rightSection`), and
replace the native `<input type="date">` fields for start/end date with Mantine
`DatePickerInput` components supporting deselection. No backend or schema changes are needed.
The changes are confined to `ContractForm.tsx`, its test file, and the addition of
`@mantine/dates` + `dayjs` as dependencies.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode) / React 18.3

**Primary Dependencies**: `@mantine/core` v7, `@mantine/dates` v7 (new), `dayjs` (new peer dep)

**Storage**: N/A — no database changes

**Testing**: Vitest + Testing Library + userEvent

**Target Platform**: Web browser (Vite SPA)

**Project Type**: Web application — pnpm monorepo, frontend package `@pcm/frontend`

**Performance Goals**: No specific targets; bundle size addition is minimal (dayjs ~7 kB gzip)

**Constraints**: Existing form layout and all passing tests must be preserved

**Scale/Scope**: Single component (`ContractForm.tsx`) + its test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ Required | Failing tests must be written before implementation code. Existing tests that will break due to component changes must be updated as failing tests first, then implementation follows. |
| II. Type Safety | ✅ Required | `ContractFormValues.startDate` and `endDate` change from `string` to `Date \| null`. Both conversion boundaries (inbound from defaultValues, outbound to submit payload) must be explicitly typed. |
| III. YAGNI | ✅ Compliant | Currency is hardcoded to EUR (static badge, no Select). No multi-currency infrastructure added. Only the two components explicitly requested are changed. |

**Post-design re-check**: No violations found. No Complexity Tracking entry needed.

## Project Structure

### Documentation (this feature)

```text
specs/027-mantine-form-inputs/
├── plan.md              # This file
├── research.md          # Component and dependency decisions
├── data-model.md        # Form state type changes and conversion boundaries
├── quickstart.md        # Validation guide
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code

```text
packages/frontend/
├── package.json                          # add @mantine/dates, dayjs
└── src/
    └── components/
        └── ContractForm.tsx              # currency input + DatePickerInput changes

packages/frontend/tests/unit/
└── ContractForm.test.tsx                 # update affected tests, add new tests
```

No new files are created. No contracts directory needed (no API changes).

## Implementation Steps

### Step 1 — Install dependencies

```bash
cd packages/frontend
pnpm add @mantine/dates@^7 dayjs
```

Verify `packages/frontend/package.json` gains:
```json
"@mantine/dates": "^7.x.x",
"dayjs": "^1.x.x"
```

### Step 2 — Write failing tests (TDD — RED phase)

Update and add tests in `ContractForm.test.tsx` **before** touching `ContractForm.tsx`:

**Tests to update (currently passing, will break after implementation):**

1. `'amount field has a visible EUR currency prefix when a value is set'`
   — Update: check for `EUR` text node visible alongside the input, not `€` in display value.

2. `'renders with provided default values'` — date assertion
   — `getByDisplayValue('2026-12-31')` still works if `valueFormat="YYYY-MM-DD"` is set;
     keep as-is unless the assertion fails.

3. `'pre-filled status, start date, and end date appear in the same statusDateRow wrapper'`
   — Replace `screen.getByDisplayValue('2025-01-01')` with `screen.getByLabelText(/start date/i)`.
   — Replace `screen.getByDisplayValue('2025-12-31')` with `screen.getByLabelText(/end date/i)`.

4. `'status, start date, and end date inputs share the same immediate parent wrapper'`
   — Currently uses `screen.getByLabelText(/start date/i)` and `/end date/i` — these should
     continue to work if `DatePickerInput` exposes a labelled input element.

**New tests to add (failing until implementation):**

5. `'amount field shows EUR badge in the right section'`
   — Assert that an element with text "EUR" is visible alongside the amount input.

6. `'start date DatePickerInput is pre-populated from defaultValues'`
   — Render with `defaultValues: { startDate: '2026-03-15' }`, assert the date field
     displays `2026-03-15`.

7. `'end date DatePickerInput is pre-populated from defaultValues'`
   — Render with `defaultValues: { endDate: '2026-12-31' }`, assert the date field
     displays `2026-12-31`.

8. `'start date submits as null when no date is selected'`
   — Render, fill name + amount, submit, assert `payload.startDate === null`.
   *(This test likely already exists and passes; keep as regression guard.)*

9. `'start date submits as ISO string when a date is selected'`
   — Render with `defaultValues: { startDate: '2026-06-01', name: 'Test', amount: '10' }`,
     submit, assert `payload.startDate === '2026-06-01'`.

### Step 3 — Implement currency input (GREEN phase for Step 2 tests)

In `ContractForm.tsx`:

1. Add `Text` to the `@mantine/core` imports (already imported; confirm it's there).
2. Replace the `NumberInput` for `amount` (lines 207–216) with:
   ```tsx
   <NumberInput
     id="amount"
     label={t('contractForm.amountLabel')}
     variant="filled"
     decimalScale={2}
     min={0}
     value={values.amount === '' ? '' : Number(values.amount)}
     onChange={(val) => setValues((v) => ({ ...v, amount: val }))}
     placeholder="0.00"
     rightSection={
       <Text size="sm" fw={500} c="dimmed" pr="xs">
         EUR
       </Text>
     }
     rightSectionWidth={52}
   />
   ```
   Note: Remove `prefix="€"` since the currency is now shown in the right section.

### Step 4 — Implement DatePickerInput (GREEN phase)

In `ContractForm.tsx`:

1. Add import:
   ```tsx
   import { DatePickerInput } from '@mantine/dates';
   import '@mantine/dates/styles.css';
   ```

2. Update `ContractFormValues`:
   ```ts
   startDate: Date | null;
   endDate: Date | null;
   ```

3. Update initial state (convert incoming ISO strings to `Date | null`):
   ```ts
   startDate: defaultValues?.startDate ? new Date(defaultValues.startDate) : null,
   endDate: defaultValues?.endDate ? new Date(defaultValues.endDate) : null,
   ```

4. Update submit handler — convert `Date | null` → ISO string:
   ```ts
   startDate: values.startDate ? values.startDate.toISOString().slice(0, 10) : null,
   endDate: values.endDate ? values.endDate.toISOString().slice(0, 10) : null,
   ```

5. Replace the two `TextInput type="date"` elements (lines 242–257) with:
   ```tsx
   <DatePickerInput
     id="startDate"
     label={t('contractForm.startDateLabel')}
     variant="filled"
     value={values.startDate}
     onChange={(val) => setValues((v) => ({ ...v, startDate: val }))}
     valueFormat="YYYY-MM-DD"
     clearable
   />
   <DatePickerInput
     id="endDate"
     label={t('contractForm.endDateLabel')}
     variant="filled"
     value={values.endDate}
     onChange={(val) => setValues((v) => ({ ...v, endDate: val }))}
     valueFormat="YYYY-MM-DD"
     clearable
   />
   ```
   Note: `clearable` on `DatePickerInput` adds a clear button — this is the deselection
   mechanism in the form-field context.

### Step 5 — Update JSDoc

Update the file-level JSDoc and `ContractForm` function JSDoc in `ContractForm.tsx` to
reflect the new controls (currency badge, DatePickerInput).

### Step 6 — Type check and test run

```bash
pnpm tsc --noEmit                         # from packages/frontend or repo root
pnpm --filter @pcm/frontend test          # all tests must pass
```

### Step 7 — Visual verification

Start dev server and verify visually per `quickstart.md` section 3.

## Complexity Tracking

> No constitution violations. Table omitted.
