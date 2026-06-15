# Implementation Plan: Account Settings Page Restructure

**Branch**: `025-settings-page-restructure` | **Date**: 2026-06-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/025-settings-page-restructure/spec.md`

## Summary

Reorganise `AccountSettings.tsx` into two clearly labelled sections — **Email Settings**
(summary email + email language) and **Account** (display name, email address, password,
danger zone) — by adding two i18n section heading keys and wrapping the existing `<Paper>`
blocks in light structural containers. No logic, no API, and no data schema changes are
required.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 18

**Primary Dependencies**: Mantine v7 (`Title`, `Stack`, `Paper`), react-i18next, Vitest +
Testing Library (unit tests), Playwright (e2e tests)

**Storage**: N/A — no persistence changes

**Testing**: Vitest + `@testing-library/react` for unit tests; existing test suite must
remain green without modification

**Target Platform**: Browser (desktop-first, minimum 320 px viewport)

**Project Type**: Web application — React SPA frontend (Vite)

**Performance Goals**: No change from baseline — the restructure adds only static markup

**Constraints**: No new logic; sole-admin guard, pending email notice, and delete modal
behaviour must be 100 % preserved

**Scale/Scope**: Single page component (`AccountSettings.tsx`), two translation files
(`en.json`, `de.json`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

The only new observable behaviour is the presence of two section headings. A single new unit
test asserting that both heading texts are rendered must be written **before** the JSX is
reorganised. All existing `AccountSettings` tests cover the controls themselves and MUST
remain green without modification.

**Status**: ✅ Compliant — new test written first, then JSX restructure.

### Principle II — Type Safety (NON-NEGOTIABLE)

No new types are introduced. The two new i18n keys follow the existing `t('key')` pattern and
the TypeScript i18n type catalogue (`src/i18n/types.d.ts`) must be regenerated (or manually
extended) so the keys are type-safe.

**Status**: ✅ Compliant — TypeScript strict mode, no implicit `any`.

### Principle III — Simplicity (YAGNI)

The implementation adds exactly two i18n keys and replaces the flat `<Stack>` with two
sub-stacks containing a `<Title>` each. No helper components, no context, no abstractions
beyond the minimum needed to satisfy FR-001 – FR-007.

**Status**: ✅ Compliant — minimal change, no speculative abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/025-settings-page-restructure/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── pages/
│   │   └── AccountSettings.tsx          ← primary change
│   └── i18n/
│       ├── locales/
│       │   ├── en.json                  ← two new keys
│       │   └── de.json                  ← two new keys
│       └── types.d.ts                   ← extend type catalogue
└── tests/
    └── unit/
        └── AccountSettings.test.tsx     ← add section-heading test (write first)
```

## Complexity Tracking

> No constitution violations — section left blank per template instructions.
