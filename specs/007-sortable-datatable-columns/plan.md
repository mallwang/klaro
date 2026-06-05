# Implementation Plan: Sortable Contract Table Columns

**Branch**: `007-sortable-datatable-columns` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-sortable-datatable-columns/spec.md`

## Summary

Add client-side column sorting to the contracts table. Clicking any header except "Actions" cycles through ascending → descending → unsorted. Sort order for "Amount" is by numeric value only (billing interval ignored). Visual indicators (lucide-react chevron icons) show the active column and direction. No backend or API changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5, strict mode

**Primary Dependencies**: React 18, Vite 8, lucide-react (already installed), Tailwind CSS v4, react-i18next

**Storage**: N/A — sort is ephemeral view state, no persistence

**Testing**: Vitest 4 + @testing-library/react + @testing-library/user-event; Playwright for E2E

**Target Platform**: Web browser (desktop + mobile)

**Project Type**: React SPA (frontend package in pnpm monorepo)

**Performance Goals**: Immediate re-render on click; no perceptible delay for the personal-tool scale of data

**Constraints**: No new dependencies; no API changes; existing table behaviour and anonymization must be unaffected

**Scale/Scope**: Single component (`ContractTable.tsx`) + its test file; no backend, shared, or other frontend files touched

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

**PASS** — All new sort behaviour must be covered by failing Vitest tests written before implementation code is added. The existing `ContractTable.test.tsx` suite will be extended with sort-specific tests first.

### Principle II — Type Safety (NON-NEGOTIABLE)

**PASS** — `SortColumn` and `SortDirection` are narrow union types (no `any`, no `unknown`). `ContractData` is already fully typed in `@pcm/shared`. All comparator functions operate on typed fields.

### Principle III — Simplicity (YAGNI)

**PASS** — Sort state lives in a single `useState` call inline in the component. No custom hook, no abstraction layer, no external state. Sort function is a plain `[...contracts].sort(comparator)` call. Only the minimum code to satisfy the spec is added.

*Post-design re-check*: Design artifacts (data-model.md, research.md) confirm no additional abstractions or new packages are needed. Constitution Check remains PASS across all three principles.

## Project Structure

### Documentation (this feature)

```text
specs/007-sortable-datatable-columns/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
packages/
└── frontend/
    ├── src/
    │   └── components/
    │       └── ContractTable.tsx          ← only modified file
    └── tests/
        └── unit/
            └── ContractTable.test.tsx     ← tests extended with sort suite
```

No new files are created in `src/`. No changes outside of `packages/frontend/`.

## Complexity Tracking

No constitution violations — this section is intentionally empty.
