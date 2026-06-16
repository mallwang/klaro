# Data Model: Mantine Form Inputs Enhancement

## Overview

This feature is a pure frontend enhancement. No database schema, backend API, or shared
types change. The only changes are to the form's internal state types and the two-way
conversion between the backend's ISO date strings and the Mantine `DatePickerInput`'s
`Date | null` values.

---

## ContractFormValues (internal form state — frontend only)

| Field | Old Type | New Type | Notes |
|-------|----------|----------|-------|
| `amount` | `string \| number` | `string \| number` | Unchanged; still bound to `NumberInput` |
| `startDate` | `string` | `Date \| null` | `DatePickerInput` requires `Date \| null` |
| `endDate` | `string` | `Date \| null` | `DatePickerInput` requires `Date \| null` |
| (all others) | — | — | Unchanged |

---

## Conversion Boundaries

### Inbound (defaultValues → form state)

When a contract is opened for editing, `defaultValues.startDate` and `defaultValues.endDate`
arrive as ISO date strings (`"YYYY-MM-DD"` or empty string `""`).

```
defaultValues.startDate: string  →  new Date(str) if truthy, else null  →  values.startDate: Date | null
defaultValues.endDate:   string  →  new Date(str) if truthy, else null  →  values.endDate:   Date | null
```

### Outbound (form state → submitted payload)

On submit, `Date | null` values are converted back to ISO strings for the backend:

```
values.startDate: Date | null  →  date.toISOString().slice(0, 10) if non-null, else null  →  payload.startDate: string | null
values.endDate:   Date | null  →  date.toISOString().slice(0, 10) if non-null, else null  →  payload.endDate:   string | null
```

---

## Backend Contract Record (unchanged)

The `CreateContractBody` type from `@pcm/shared` is not modified. `startDate` and `endDate`
remain `string | null` (ISO format). `amount` remains `number`. No migration needed.

---

## New UI State

No new state fields are added. The existing `values.amount`, `values.startDate`, and
`values.endDate` state slots are repurposed with updated types.
