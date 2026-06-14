# Implementation Plan: Enhance Source Code JSDoc Documentation

**Branch**: `020-enhance-jsdoc-docs` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-enhance-jsdoc-docs/spec.md`

## Summary

Add missing file-level JSDoc blocks and function-level JSDoc comments to all non-test
TypeScript source files across the `backend`, `frontend`, and `shared` packages. The project
currently has JSDoc coverage in only 5 of 88 source files. This change is purely additive:
no logic, type signatures, or tests are altered.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS (ESM modules, `strict: true`)

**Primary Dependencies**:
- Backend: Fastify, better-sqlite3, Zod, nodemailer
- Frontend: React 18, Vite, Mantine UI, TanStack Query, react-i18next
- Shared: Zod schemas, TypeScript interfaces

**Storage**: better-sqlite3 (SQLite) — not touched by this feature

**Testing**: Vitest (unit/integration), Playwright (e2e)

**Target Platform**: Linux server (backend), browser (frontend)

**Project Type**: Web application — pnpm monorepo with `backend/`, `frontend/`, `shared/` packages

**Performance Goals**: N/A — documentation-only change; no runtime code paths modified

**Constraints**: All TypeScript strict-mode checks, ESLint rules, and Vitest/Playwright tests
must continue to pass after every file is touched

**Scale/Scope**:
- 56 non-test `.ts` files + 32 `.tsx` files = **88 source files** to audit
- 5 files already have partial JSDoc (auth.service.ts, password.ts, client.ts,
  user.service.ts, tests/helpers/auth.ts)
- Estimated 80+ functions/React components across backend and frontend needing JSDoc

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First

**Status: EXEMPT (documentation-only)**

This feature adds JSDoc comments only. No production logic is introduced or modified;
no new code paths are created. The Red-Green-Refactor cycle does not apply. All existing
tests must remain green after each file is edited (verified in the quickstart).

### Principle II — Type Safety

**Status: PASS**

JSDoc comments do not alter TypeScript type signatures. Adding `@param` or `@returns` tags
to a function that is already fully typed does not weaken type safety. The `tsconfig.json`
`strict: true` flag is untouched. Lint and type-check gates enforce this per-file.

### Principle III — Simplicity (YAGNI)

**Status: PASS**

No new abstractions, helpers, or utilities are introduced. Every JSDoc comment added
directly serves the documented requirement (FR-001 through FR-010). Comments that would
only repeat identifier names are explicitly forbidden by FR-007.

## Project Structure

### Documentation (this feature)

```text
specs/020-enhance-jsdoc-docs/
├── plan.md              # This file
├── research.md          # Phase 0: file audit and priority map
├── quickstart.md        # Phase 1: verification guide
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/
├── backend/src/
│   ├── db/              # client.ts, migrate.ts, reset.ts, seed.ts
│   ├── routes/          # admin.ts, auth.ts, contracts.ts, dashboard.ts,
│   │                    #   invitations.ts, profile.ts, users.ts
│   ├── services/        # auth.service.ts, contract.ts, dashboard.ts,
│   │                    #   invitation.service.ts, mailer.service.ts,
│   │                    #   password.ts, profile.service.ts, user.service.ts
│   ├── index.ts
│   └── server.ts
│
├── frontend/src/
│   ├── components/      # AnonymizationToggle, AppShell/*, CategoryIcon,
│   │                    #   ColumnMappingTable, ContractForm, ContractTable,
│   │                    #   DeleteAccountModal, ExpiredContracts, ExportMenu,
│   │                    #   ImportResultSummary, LanguageSwitcher, ProviderLogo,
│   │                    #   PublicLayout, RequireAdmin, RequireAuth,
│   │                    #   SpendingOverview, UpcomingRenewals
│   ├── hooks/           # useAccounts, useAnonymization, useAuth,
│   │                    #   useInvitations, useLocaleFormat
│   ├── pages/           # AcceptInvitation, AccountSettings, ContractEdit,
│   │                    #   ContractImport, ContractList, ContractNew,
│   │                    #   Dashboard, EmailVerifyConfirm, SignIn,
│   │                    #   admin/AccountsAdmin
│   ├── services/        # api.ts, auth.ts, contracts.ts, export.ts,
│   │                    #   importParsing.ts, invitations.ts, profile.ts, users.ts
│   ├── utils/           # columnMapping.ts
│   ├── data/            # fantasyNames.ts
│   ├── i18n/            # index.ts
│   ├── lib/             # utils.ts
│   └── main.tsx
│
└── shared/src/
    ├── schemas/         # auth.ts, contract.ts, dashboard.ts, invitation.ts,
    │                    #   profile.ts, user.ts
    ├── types/           # contract.ts, invitation.ts, user.ts
    └── index.ts
```

**Structure Decision**: Existing monorepo layout — no structural changes. All file edits are
in-place additions of JSDoc comments.

## Complexity Tracking

> No Constitution violations — section intentionally empty.
