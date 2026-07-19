# Implementation Plan: Admin Diagnostics Page

**Branch**: `037-admin-diagnostics` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-admin-diagnostics/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add an admin-only diagnostics view, modeled on Vaultwarden's `/admin/diagnostics`, that reports
application/database/runtime versions plus a set of live environment checks (proxy detection,
domain/HTTPS match, outbound internet access, DNS resolution, clock drift, WebSocket-support
flag). The backend exposes a single `GET /api/admin/diagnostics` JSON endpoint plus a
server-rendered `GET /admin/diagnostics` HTML fallback (so the page works with JavaScript
disabled, per FR-018/SC-006); the frontend adds a React page at `/admin/diagnostics` that
consumes the same JSON endpoint. Each external/live check runs with an individual timeout
(default 5s) via `Promise.allSettled`-style isolation so one slow/failed check never blocks or
crashes the rest of the page.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), Node.js >=24, ESM modules

**Primary Dependencies**: Fastify 5 (backend), React 19 + Mantine + React Router + TanStack Query
(frontend), better-sqlite3, zod (shared schemas) — no new runtime dependencies; live checks use
Node built-ins only (`node:dns`, `node:https`, `node:os`, `node:child_process` for container
detection via `/proc` inspection is avoided in favor of a `.dockerenv`/`cgroup` file check via
`node:fs`)

**Storage**: SQLite via better-sqlite3 (existing `fastify.db` decorator); diagnostics data is
never persisted — computed fresh per request

**Testing**: Vitest (backend unit + integration under `packages/backend/tests`), Vitest +
Testing Library (frontend under `packages/frontend/tests`)

**Target Platform**: Linux server (Docker container per `docker-compose.yml`), single-process
Fastify app serving both API and static SPA bundle

**Project Type**: Web application (existing `packages/backend` + `packages/frontend` +
`packages/shared` pnpm workspace)

**Performance Goals**: Full diagnostics response (all checks) within the 6s page-load budget
from SC-002, even when external checks are slow

**Constraints**: Every individual check bounded by a configurable timeout, default 5000ms
(FR-016); no secret values (SMTP credentials, DB path, tokens) may appear in output (FR-015);
must render a complete, readable result with JavaScript disabled (FR-018)

**Scale/Scope**: Single diagnostics endpoint + page; one admin (or small admin group) checking
occasionally, no polling/alerting

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Test-First (NON-NEGOTIABLE)**: Plan requires a failing integration test for
  `GET /api/admin/diagnostics` (auth gating, shape, degraded-check behavior) and a failing unit
  test for each check function (proxy detection, domain match, HTTPS, container detection)
  before implementation. PASS (to be enforced in tasks.md).
- **II. Type Safety (NON-NEGOTIABLE)**: Diagnostics report shape defined as a shared TypeScript
  type/zod schema in `packages/shared`, reused by both backend response typing and frontend
  consumption. No `any`. PASS.
- **III. Simplicity (YAGNI)**: No new npm dependencies; live checks reuse Node built-ins
  (`node:dns`, `node:https`, `node:os`, `node:fs`). No historical/trend storage, no polling
  scheduler, no remediation actions — matches spec Assumptions. PASS.

No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/037-admin-diagnostics/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/shared/src/
├── schemas/diagnostics.ts     # zod schema for DiagnosticsReport (request has no body)
└── types/diagnostics.ts       # DiagnosticsReport, CheckResult TS types (re-exported from index.ts)

packages/backend/src/
├── services/
│   └── diagnostics.service.ts # buildDiagnosticsReport(): runs all checks with per-check timeout
└── routes/
    └── diagnostics.ts         # GET /api/admin/diagnostics (JSON) + GET /admin/diagnostics (HTML, no-JS fallback)

packages/backend/tests/
├── unit/diagnostics.service.test.ts
└── integration/diagnostics.route.test.ts

packages/frontend/src/
├── pages/admin/DiagnosticsAdmin.tsx   # React page, renders grouped versions + checks
├── services/diagnostics.ts            # fetch wrapper for GET /api/admin/diagnostics
└── hooks/useDiagnostics.ts            # TanStack Query hook

packages/frontend/tests/
└── pages/admin/DiagnosticsAdmin.test.tsx
```

**Structure Decision**: Reuses the existing three-package layout (`shared` / `backend` /
`frontend`). Diagnostics logic is isolated in one new service + one new route module on the
backend (mirroring the existing `admin.ts` route pattern gated by the same `ADMIN`-role
`onRequest` hook) and one new page + hook + service on the frontend (mirroring `AccountsAdmin.tsx`
and its `RequireAdmin` wrapper). The no-JS requirement is met by a second, server-rendered HTML
route on the same backend process rather than a separate SSR framework — see research.md.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table intentionally omitted.
