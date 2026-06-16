# Implementation Plan: Compact Contracts Table

**Branch**: `029-compact-contracts-table` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/029-compact-contracts-table/spec.md`

## Summary

Make the contracts table visually compact and consistent with the Manage Accounts page. Two changes: (1) enforce single-line rows by truncating long names with ellipsis and removing any implicit content wrapping; (2) replace the `Anchor`-based Edit link and `variant="subtle"` Delete button with `Button size="compact-sm" variant="default"` elements matching the Manage Accounts action-button pattern.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode

**Primary Dependencies**: React 18, Mantine v7, React Router v6, react-i18next, Vitest + Testing Library

**Storage**: N/A — purely presentational change, no data layer involved

**Testing**: Vitest + @testing-library/react; existing `ContractTable.test.tsx` covers all affected behaviour

**Target Platform**: Web (Vite SPA, desktop-first)

**Project Type**: Web application (frontend only for this feature)

**Performance Goals**: N/A

**Constraints**: Must not break any of the 24 existing `ContractTable` unit tests; must preserve anonymization flip animation and sorting behaviour

**Scale/Scope**: Single component (`ContractTable.tsx`) and its CSS module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ PASS | Existing tests are updated first; one new test for Edit button renders as `button` role (not link) |
| II. Type Safety | ✅ PASS | No new types introduced; `Button component={Link}` is typed by Mantine's polymorphic API |
| III. Simplicity (YAGNI) | ✅ PASS | Only the minimum CSS and JSX changes needed; no new abstractions |

No violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/029-compact-contracts-table/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (minimal — no data changes)
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/src/components/
├── ContractTable.tsx          ← primary change file
└── ContractTable.module.css   ← CSS truncation fix

packages/frontend/tests/unit/
└── ContractTable.test.tsx     ← update one test: Edit renders as button, not link
```

No new files. No backend changes. No shared-package changes.

**Structure Decision**: Single-component change within the existing frontend package.
