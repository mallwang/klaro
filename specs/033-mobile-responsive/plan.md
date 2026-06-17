# Implementation Plan: Mobile-Responsive Web App

**Branch**: `033-mobile-responsive` | **Date**: 2026-06-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/033-mobile-responsive/spec.md`

## Summary

Make the existing Klaro frontend fully usable on phone-sized screens (roughly 320–480px wide, portrait-first) without regressing desktop/tablet behavior. An audit of the current codebase shows the app is already partially responsive (collapsible navbar, single-column dashboard, a form that already collapses via a media query, one already-responsive `SimpleGrid`). The work is therefore targeted, not a redesign: hide lower-priority table columns on phone breakpoints (contracts table, admin accounts tables), fix one non-responsive `SimpleGrid` in the admin diagnostics section, make modals full-screen on phone breakpoints, verify touch target sizes, and audit the remaining pages/components for gaps — applying the same existing patterns (Mantine `visibleFrom`/`hiddenFrom`, responsive `SimpleGrid` `cols`, the established CSS-module media-query pattern) rather than introducing new responsive mechanisms.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), Node.js LTS (≥24)

**Primary Dependencies**: React 18, Vite 8, Mantine v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/dates`), `@tabler/icons-react`, i18next + react-i18next, react-router-dom v7, `@playwright/test` (for `devices` presets)

**Storage**: N/A — no data layer changes

**Testing**: Vitest + @testing-library/react (unit/component, JSDOM); Playwright (E2E), including a new mobile-viewport project using Playwright's built-in `devices` presets

**Target Platform**: Web browser, phone-sized viewports (≈320–480px, portrait-first) in addition to the existing desktop/tablet support

**Project Type**: Web application (frontend-only change — no backend, no shared-package changes)

**Performance Goals**: No new performance requirements; CSS/markup-only changes have negligible render cost

**Constraints**: Must not introduce new npm packages (Mantine's `visibleFrom`/`hiddenFrom`, `useMediaQuery`, and Playwright's `devices` are all already available in installed dependencies); must not regress the compact desktop table styling introduced by feature 029; must not regress existing unit/E2E test suites

**Scale/Scope**: ~10 frontend components/pages across `packages/frontend/src/{components,pages}`; no new pages, no new routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

**Status**: PASS (plan enforces it)

- For every column-hiding change (`ContractTable`, `AccountsAdmin` tables), a failing Vitest assertion (e.g. "category column is not in the document at a phone-sized viewport") must be written and verified to fail before the `visibleFrom`/`hiddenFrom` props are added.
- A new Playwright mobile-viewport project/spec must verify: the navbar burger menu opens and reaches every nav item, the contracts list is readable without horizontal page scroll, and the contract form can be completed at a phone-sized viewport.
- Pages confirmed "audit only, already compliant" still get an explicit Vitest/Playwright assertion locking in that behavior, so a future change can't silently regress it.

### Principle II — Type Safety (NON-NEGOTIABLE)

**Status**: PASS (plan enforces it)

- No new types are introduced; existing component prop types are unchanged.
- `useMediaQuery<boolean>` (from `@mantine/hooks`) is already fully typed; no `any` introduced.
- `tsc --noEmit` must pass with zero errors before the branch is considered done.

### Principle III — Simplicity (YAGNI)

**Status**: PASS

- No new abstraction layer for "responsive tables" — column visibility is handled inline with Mantine's existing `visibleFrom`/`hiddenFrom` props on the existing `Table.Th`/`Table.Td` elements, matching the pattern already used in `TopHeader.tsx`.
- No new CSS-in-JS or breakpoint system — reuses Mantine's default theme breakpoints and the existing CSS-module media-query pattern from `ContractForm.module.css`.
- Components already found to be compliant during research (Dashboard widgets, `ContractForm`, `AccountSettings`, `Faq`, auth pages) are left untouched aside from adding regression tests — no speculative rewrites.

No violations. Complexity Tracking section omitted.

## Project Structure

### Documentation (this feature)

```text
specs/033-mobile-responsive/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   ├── ContractTable.tsx                  # modified — hide Category/Status below `sm`
│   │   ├── ContractTable.module.css           # modified if needed — touch target padding
│   │   ├── DeleteAccountModal.tsx              # modified — fullScreen on phone breakpoints
│   │   ├── ColumnMappingTable.tsx              # audited — wrap in ScrollContainer if overflow found
│   │   └── AppShell/
│   │       ├── NavbarSegmented.tsx             # audited only
│   │       ├── TopHeader.tsx                   # audited only
│   │       └── FooterSimple.tsx                # audited only
│   └── pages/
│       ├── admin/
│       │   └── AccountsAdmin.tsx               # modified — column hiding + fix non-responsive SimpleGrid cols={2}
│       ├── Dashboard.tsx                       # audited only
│       ├── ContractEdit.tsx / ContractNew.tsx  # audited only (delegate to ContractForm)
│       ├── AccountSettings.tsx                 # audited only
│       ├── SignIn.tsx / ForgotPassword.tsx /
│       │   ResetPassword.tsx / AcceptInvitation.tsx  # audited only
│       └── ContractImport.tsx                  # audited (uses ColumnMappingTable)
└── tests/
    ├── unit/
    │   ├── ContractTable.test.tsx              # modified — new column-visibility assertions
    │   ├── pages/AccountsAdmin.test.tsx          # modified — new column-visibility assertions
    │   └── DeleteAccountModal.test.tsx          # modified — fullScreen-on-mobile assertion
    └── e2e/
        ├── mobile-navigation.spec.ts            # NEW — burger menu + full nav reachability at phone viewport
        ├── mobile-contracts.spec.ts             # NEW — contracts list + form usable at phone viewport
        └── mobile-dashboard.spec.ts             # NEW — dashboard widgets stack correctly at phone viewport

playwright.config.ts                              # modified — add `mobile-chromium` project using devices['iPhone 13']
```

**Structure Decision**: Frontend-only change within the existing `packages/frontend` package, following the same file layout convention as prior frontend features (e.g. 016, 029). No new package, no new top-level directory.

## Complexity Tracking

No Constitution Check violations — table omitted.
