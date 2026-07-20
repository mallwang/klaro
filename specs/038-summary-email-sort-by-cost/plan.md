# Implementation Plan: Summary Email Table Sorted by Monthly Cost

**Branch**: `038-summary-email-sort-by-cost` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/038-summary-email-sort-by-cost/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The periodic contract summary email currently lists a user's active contracts in whatever
order the database query returns them (effectively by contract name/insertion order). This
feature reorders the `contracts` array assembled in `NotificationService` so rows are sorted
by normalized monthly cost descending (most expensive first), with a case-insensitive
alphabetical-by-name tie-break for equal amounts. Because both the HTML and plain-text
renderers in `mailer.strings.ts` iterate `data.contracts` verbatim, sorting once at the data-
assembly layer (`notification.service.ts`) fixes both renditions and every summary-email
frequency with a single, localized change — no template changes required.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js LTS, ESM modules

**Primary Dependencies**: better-sqlite3 (contract data access), existing `@pcm/shared` types
(`SummaryEmailData`, `BillingInterval`)

**Storage**: SQLite via `better-sqlite3` (`contracts` table) — no schema change required

**Testing**: Vitest (unit tests) — extends `packages/backend/tests/unit/notification.service.test.ts`

**Target Platform**: Node.js backend service (Fastify), scheduled/cron-triggered email job

**Project Type**: Web application (existing `packages/backend` + `packages/frontend` + `packages/shared` monorepo) — this feature touches backend only

**Performance Goals**: N/A — in-memory sort over a single user's active-contract list (typically low tens of rows); negligible cost versus existing query/render work

**Constraints**: Must not change which contracts are included, the computed totals, the
renewals section, or the HTML/text template markup — only the order of `contracts` rows

**Scale/Scope**: Single-file logic change (`notification.service.ts`) plus corresponding unit
tests and documentation updates; no new entities, endpoints, or UI surfaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Test-First (NON-NEGOTIABLE)**: PASS. Tasks will add failing unit tests to
  `notification.service.test.ts` asserting descending-by-monthly-cost order (with a name
  tie-break case) before the sort is implemented.
- **II. Type Safety (NON-NEGOTIABLE)**: PASS. The change reuses the existing typed
  `SummaryEmailData`/contract-row shapes from `@pcm/shared`; no new `any`/untyped values are
  introduced.
- **III. Simplicity (YAGNI)**: PASS. The fix is a single `.sort()` call (comparator function)
  applied where the `contracts` array is already built — no new abstraction, service, or
  configuration surface is introduced. No user-facing sort-order toggle is added, matching the
  spec's explicit assumption that none is in scope.

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/038-summary-email-sort-by-cost/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature exposes no new or changed public API,
route, or schema — it only reorders rows already produced by the existing summary-email data
assembly, so there is no external interface to document.

### Source Code (repository root)

```text
packages/backend/
├── src/
│   └── services/
│       └── notification.service.ts   # Sort contracts by monthly cost desc (name asc tie-break)
└── tests/
    └── unit/
        └── notification.service.test.ts   # New/updated ordering assertions

# Unchanged, referenced for context only:
packages/backend/src/services/mailer.strings.ts   # Renders data.contracts verbatim (HTML + text)
packages/shared/src/types/user.ts                 # SummaryEmailData / contract row types
```

**Structure Decision**: Existing web-application monorepo layout (`packages/backend`,
`packages/frontend`, `packages/shared`). This feature is backend-only: the ordering fix lives
entirely in `packages/backend/src/services/notification.service.ts`, where the `contracts`
array consumed by `mailer.strings.ts` is assembled. No frontend or shared-package code changes
are required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table intentionally omitted.
