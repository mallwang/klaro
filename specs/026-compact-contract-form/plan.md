# Implementation Plan: Compact Contract Form Layout

**Branch**: `026-compact-contract-form` | **Date**: 2026-06-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/026-compact-contract-form/spec.md`

## Summary

Rearrange the `ContractForm` component's field layout so that related fields share horizontal rows, reducing the vertical footprint of the form. The changes are purely structural (DOM grouping + CSS grid rules); all validation logic, submission behaviour, and field labels remain untouched.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ESM)

**Primary Dependencies**: React 18, Mantine v7 (CSS Modules via `@mantine/core`), Vite

**Storage**: N/A — layout-only change

**Testing**: Vitest + React Testing Library (unit); Playwright (E2E not required for this feature)

**Target Platform**: Web browser (desktop + responsive mobile)

**Project Type**: Web application (monorepo: `packages/frontend`)

**Performance Goals**: No new performance requirements — CSS-only layout change

**Constraints**: Must remain usable at 375 px (mobile), must not break any existing test assertions

**Scale/Scope**: Single shared component (`ContractForm`) + one CSS module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ | New DOM-structure tests (verifying field grouping in shared wrapper divs) must be written before implementation. Existing functional tests need no changes. |
| II. Type Safety | ✅ | No new TypeScript required; CSS module class names are inferred types. No `any`, no suppressions. |
| III. Simplicity | ✅ | Changes are minimal: new CSS grid classes + wrapper `<div>` elements. No new abstractions, no new components. |

No violations — Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/026-compact-contract-form/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A — no data model changes
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   └── components/
│       ├── ContractForm.tsx          ← DOM restructuring (new wrapper divs)
│       └── ContractForm.module.css   ← new CSS grid/flex rules
└── tests/
    └── unit/
        └── ContractForm.test.tsx     ← new layout-structure tests (TDD: write first)
```

## Phase 0: Research

### Findings

**Decision**: Use CSS Grid for all multi-column field rows.
**Rationale**: The project already uses CSS Grid for the existing `dateGrid` class. Consistency and simplicity — no additional dependency. Mantine's spacing tokens (`--mantine-spacing-md`) keep gap sizes consistent with the rest of the UI.
**Alternatives considered**: Mantine `<SimpleGrid>` component — rejected because mixing JSX grid wrappers with existing CSS module patterns adds inconsistency without benefit.

---

**Decision**: Use a single reusable `.twoColumnRow` CSS class for both name+category and amount+interval rows.
**Rationale**: Both rows are identical two-equal-column grids. Sharing one class follows the YAGNI principle; creating two identically-defined classes would be duplication.
**Alternatives considered**: Separate named classes (`.nameCategoryRow`, `.amountIntervalRow`) — rejected as unnecessary duplication.

---

**Decision**: Collapse all multi-column rows to single-column at Mantine's `sm` breakpoint (≤ 768 px).
**Rationale**: The form container has `maw={600}` in `ContractNew` and `ContractEdit`. On viewports narrower than 768 px, three-column rows become too cramped. `sm` is the smallest Mantine named breakpoint above the 375 px mobile target, so collapsing there keeps the mobile UX clean.
**Alternatives considered**: `xs` breakpoint (≤ 576 px) — narrower than needed; the 3-column status+date row becomes unreadable between 576–768 px.

---

**Decision**: Wrap the existing `cancellationRow` div in a new `cancellationHalf` container with `max-width: 50%`.
**Rationale**: The cancellation number + unit fields are already arranged by the existing `.cancellationRow` flex rule. Adding a 50%-width outer wrapper is the minimal change needed; the inner layout is untouched.
**Alternatives considered**: Placing the cancellation group inside a two-column grid alongside empty content — rejected as adding invisible dummy markup.

## Phase 1: Design & Contracts

### CSS Class Changes (`ContractForm.module.css`)

**Remove**: `.dateGrid` (replaced by the three-column `.statusDateRow`)

**Add**:

```css
/* Two equal-column row used for name+category and amount+interval */
.twoColumnRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mantine-spacing-md);
}

/* Three equal-column row for status + start date + end date */
.statusDateRow {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--mantine-spacing-md);
}

/* Constrains the cancellation number+unit group to left half of form */
.cancellationHalf {
  max-width: 50%;
}

/* Collapse all multi-column rows on narrow viewports */
@media (max-width: 48em) {  /* 768px — Mantine sm breakpoint */
  .twoColumnRow,
  .statusDateRow {
    grid-template-columns: 1fr;
  }

  .cancellationHalf {
    max-width: 100%;
  }
}
```

### DOM Structure Changes (`ContractForm.tsx`)

| Before | After |
|--------|-------|
| `<div>` (name) then standalone `<Select>` (category) | Both wrapped in `<div className={classes.twoColumnRow}>` |
| Standalone `<NumberInput>` (amount) then standalone `<Select>` (billingInterval) | Both wrapped in `<div className={classes.twoColumnRow}>` |
| Standalone `<Select>` (status) then `<div className={classes.dateGrid}>` (start+end) | All three unwrapped and placed inside `<div className={classes.statusDateRow}>` — `.dateGrid` removed |
| `<div>` wrapping label + `.cancellationRow` | Outer `<div>` gets `className={classes.cancellationHalf}` added |

No changes to field IDs, `aria-label` attributes, validation logic, or submission payload construction.

### No API Contracts Required

This feature involves no backend changes, no new API endpoints, and no shared-package type changes.

### New Tests (write before implementation — TDD)

These tests verify the DOM grouping structure. Add to `ContractForm.test.tsx`:

```text
describe('ContractForm – layout grouping (DOM structure)')
  - name and category inputs share the same immediate parent wrapper
  - amount and billing interval inputs share the same immediate parent wrapper
  - status, start date, and end date inputs share the same immediate parent wrapper
  - cancellation period section (label + inputs) is contained inside a half-width wrapper
    (verify the wrapper has at most 50% of the form width — check CSS class presence)
```

Implementation hint: use `closest('[class*="twoColumnRow"]')` and similar selectors to assert shared parentage without hard-coding class names.

## Quickstart Validation Guide

See [quickstart.md](quickstart.md)
