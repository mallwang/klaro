# Research: Mantine Form Inputs Enhancement

## Decision 1: Date Input Component

**Decision**: Use `DatePickerInput` from `@mantine/dates`, not the inline `DatePicker`.

**Rationale**: The user linked to the `DatePicker` docs to reference the `allowDeselect`
behaviour. `DatePicker` is an *inline* calendar (always visible on the page) and would break
the compact `statusDateRow` 3-column grid. `DatePickerInput` is the form-field variant — a
text input that opens a `DatePicker` in a popover — and it supports `clearable` which
achieves the same deselection UX the user described ("clicking a selected date clears the
field"). `DatePickerInput` is the standard Mantine pattern for date fields inside forms.

**Alternatives considered**:
- `DatePicker` (inline) — rejected: always-visible calendar would dominate the form layout
  and break the compact 3-column row.
- Native `<input type="date">` — status quo, rejected because it is browser-inconsistent and
  lacks a convenient clear/deselect interaction.
- `DateInput` — similar text-input form field but uses a plain text parser rather than a
  calendar popover; less discoverable for users.

---

## Decision 2: Currency Input Component

**Decision**: Use the Mantine community currency input pattern:
`NumberInput` with a static "EUR" badge rendered in the `rightSection`.

**Rationale**: The [Mantine community currency input](https://ui.mantine.dev/category/inputs/#currency-input)
uses `NumberInput` + `Select` in `rightSection`. Since the currency is hardcoded to EUR
(multi-currency is explicitly out of scope), a `Select` is unnecessary complexity. A simple
`<Text>` element displaying "EUR" in the `rightSection` achieves the same visual result
without an interactive dropdown. The `rightSectionWidth` can be tuned to match typical
currency badge width.

**Alternatives considered**:
- `NumberInput` with `prefix="€"` — current implementation; shows only the symbol, not the
  ISO currency code. Provides less context at a glance.
- `Select` of currencies — rejected: multi-currency is out of scope (YAGNI).
- Separate `TextInput` for currency — rejected: poor UX, allows editing a fixed value.

---

## Decision 3: New Dependency — `@mantine/dates` + `dayjs`

**Decision**: Add `@mantine/dates` and `dayjs` to `packages/frontend/package.json`.

**Rationale**: `@mantine/dates` is the official Mantine date components package (same
version family as `@mantine/core` already installed). `dayjs` is a required peer dependency
of `@mantine/dates`. Neither is currently in the project. `dayjs` is tiny (~7 kB gzipped)
and widely used; it adds no meaningful bundle concern.

**Alternatives considered**:
- Build a custom date-picker — rejected: significant scope creep, no value over the
  Mantine component which is already in the design system.
- Use `date-fns` instead of `dayjs` — `@mantine/dates` is built around `dayjs`; switching
  adapters would be non-trivial.

---

## Decision 4: Date Type in Form State

**Decision**: Change `startDate` and `endDate` in `ContractFormValues` from `string` to
`Date | null`.

**Rationale**: `DatePickerInput` binds to `Date | null` natively. Keeping strings would
require constant parse/format conversions inside the render, introducing bugs. The conversion
is done once at two boundary points: (a) when populating from `defaultValues` (ISO string →
`Date`), and (b) when submitting to the backend (converts `Date` → ISO string `YYYY-MM-DD`).

**Alternatives considered**:
- Keep `string` and convert at render time — rejected: complicates the component and couples
  it to the ISO string format.

---

## Decision 5: Affected Tests

**Decision**: Update tests that query date fields by `getByDisplayValue('YYYY-MM-DD')` to
query by label or by the locale-formatted display value that `DatePickerInput` produces.

**Rationale**: `DatePickerInput` renders a human-readable date (e.g., `MM/DD/YYYY`) in its
text input rather than the raw ISO string. The existing tests that use
`getByDisplayValue('2025-01-01')` will fail. The layout-grouping tests that verify start/end
date inputs share the `statusDateRow` wrapper can be updated to query by label name
(`/start date/i`, `/end date/i`) and then walk to the wrapper.

**Tests to update**:
- `'renders with provided default values'` — date display value assertion
- `'pre-filled status, start date, and end date appear in the same statusDateRow wrapper'` —
  uses `getByDisplayValue` for date strings
- `'status, start date, and end date inputs share the same immediate parent wrapper'` —
  queries start/end by label (should still work if DatePickerInput exposes a labelled input)
- Any new tests covering `DatePickerInput` population and deselection

---

## Decision 6: Locale / Date Format

**Decision**: Use `DatePickerInput` with `valueFormat="YYYY-MM-DD"` for the form display, so
the text field shows dates in ISO format. This makes the displayed value predictable across
locales and keeps existing tests (`getByDisplayValue`) working with minimal changes.

**Rationale**: Mantine `DatePickerInput` accepts a `valueFormat` prop that controls the
string displayed in the input. Setting it to `"YYYY-MM-DD"` keeps the visual format consistent
with what the user previously saw from the native `<input type="date">` element (which also
displays in YYYY-MM-DD in most locales). The calendar popover itself remains localised through
`dayjs` locale configuration, but the field value shown is predictable for testing.

**Alternatives considered**:
- Locale-aware format (`DD.MM.YYYY` for German users) — nicer UX in theory, but breaks all
  existing display-value tests without additional complexity; can be introduced in a later
  iteration once i18n date formatting is properly configured.
