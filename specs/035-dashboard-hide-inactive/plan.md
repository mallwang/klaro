# Implementation Plan: Separate Inactive Contracts from Expired Contracts on Dashboard

**Branch**: `035-dashboard-hide-inactive` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/035-dashboard-hide-inactive/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Today the dashboard's "Expired Contracts" query (`getExpiredContracts` in
`packages/backend/src/services/dashboard.ts`) selects any contract with a past end date
regardless of `status`, so manually deactivated (`status = 'INACTIVE'`) contracts clutter the
section. The fix is to (1) add `AND status = 'ACTIVE'` to that query, and (2) add a new
backend query + API field for inactive contracts, rendered in the frontend as a new
collapsed-by-default, muted `InactiveContracts` component using Mantine's `Accordion` (the
existing collapsible pattern already used on the FAQ page), placed below the existing
dashboard sections and omitted entirely when the user has zero inactive contracts.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js LTS, ESM modules

**Primary Dependencies**: Fastify (backend), React + Vite + Mantine UI (frontend), Zod (shared schemas), better-sqlite3, Vitest, Playwright

**Storage**: SQLite (`contracts` table, existing `status` and `end_date` columns — no schema change needed)

**Testing**: Vitest for backend service unit tests and frontend component tests; Playwright for the dashboard e2e flow

**Target Platform**: Web app (browser frontend + Node.js backend), existing mobile-responsive layout

**Project Type**: Web application (pnpm monorepo: `packages/backend`, `packages/frontend`, `packages/shared`)

**Performance Goals**: N/A — read-only dashboard query against a per-user SQLite table; existing dashboard load-time expectations apply, no new perf budget

**Constraints**: Must not change the `contracts` table schema or the existing `status`/`end_date` semantics; must not alter the Contracts list page's own status filtering

**Scale/Scope**: Single-user-scoped queries (existing `WHERE user_id = ?` pattern); no scale change — same row counts as today, just re-partitioned across two sections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Test-First**: New/changed behavior (status filter on expired query, new inactive-contracts query, new `InactiveContracts` component) will get failing Vitest tests written first, per `[[memory:constitution]]` Principle I. PASS (planned in tasks phase).
- **Type Safety**: `ExpiredContractSchema` is unchanged; a new `InactiveContractSchema` will be added to `packages/shared/src/schemas/dashboard.ts` and reused on both backend and frontend — no duplicated types. PASS.
- **Simplicity (YAGNI)**: Reuses the existing `Accordion` pattern from `Faq.tsx` rather than introducing a new collapsible primitive; reuses the existing per-contract card rendering approach from `ExpiredContracts.tsx`/`UpcomingRenewals.tsx` rather than building a generic "contract list" abstraction, since only two call sites exist today. PASS.

No violations — Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/035-dashboard-hide-inactive/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/dashboard.ts        # add InactiveContractSchema, extend DashboardResponseSchema

packages/backend/src/services/dashboard.ts      # add status='ACTIVE' filter to getExpiredContracts query;
                                                 # add getInactiveContracts() query; wire into getDashboardData()
packages/backend/src/services/dashboard.test.ts # unit tests for both query changes (TDD: written first)

packages/frontend/src/components/ExpiredContracts.tsx   # unaffected in markup; receives already-filtered data
packages/frontend/src/components/InactiveContracts.tsx  # new component: Mantine Accordion, collapsed by default,
                                                          # muted/gray styling, renders nothing if list is empty
packages/frontend/src/components/InactiveContracts.test.tsx
packages/frontend/src/pages/Dashboard.tsx       # render <InactiveContracts> section after ExpiredContracts

packages/frontend/src/locales/en/translation.json  # new i18n keys (section title, collapsed count label)
packages/frontend/src/locales/de/translation.json  # German equivalents

README.md / README.de.md                        # document the new section per CLAUDE.md doc requirements
docs/user-guide.md / docs/user-guide.de.md       # document feature from user perspective
```

**Structure Decision**: Existing pnpm monorepo web-application layout
(`packages/backend` + `packages/frontend` + `packages/shared`) is reused as-is. This feature is
additive within the existing dashboard slice — no new packages, services, or top-level
directories are introduced.

## Complexity Tracking

No constitution violations — table not applicable.
