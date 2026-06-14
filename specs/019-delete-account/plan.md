# Implementation Plan: Delete Account

**Branch**: `019-delete-account` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/019-delete-account/spec.md`

## Summary

Allow authenticated users to permanently delete their own account and all associated contracts
via a "Danger Zone" section on the Account Settings page. A modal guides users to optionally
export their contracts as JSON before confirming deletion. Sole administrators are blocked from
deleting their account until another admin exists.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js LTS, ESM

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3, Zod, fastify-type-provider-zod
- Frontend: React 18, Mantine 7, React Query 5, React Router 7, react-i18next

**Storage**: SQLite via better-sqlite3 — deletion cascades via existing `ON DELETE CASCADE`
foreign keys on `sessions`, `contracts`, and `invitations.invited_by`

**Testing**: Vitest (unit + integration), Playwright (E2E), @testing-library/react

**Target Platform**: Web app (browser + Node.js server)

**Project Type**: Full-stack web application (pnpm monorepo)

**Performance Goals**: Standard interactive response — delete completes in under 2 seconds

**Constraints**: Sole-admin guard must be atomic; no partial deletions under any error condition

**Scale/Scope**: Personal use — single household, O(10) users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | PASS | Tests defined in tasks before implementation tasks; service unit tests before route integration tests |
| II. Type Safety | PASS | All new service methods typed; new API contract expressed via Zod schema in `@pcm/shared`; no `any` |
| III. Simplicity (YAGNI) | PASS | `deleteSelf` inlines the admin count check rather than composing services; no abstraction beyond what the feature requires |

## Project Structure

### Documentation (this feature)

```text
specs/019-delete-account/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── delete-account-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
packages/shared/
└── src/
    └── schemas/
        └── profile.ts          # add DeleteSelfResult type

packages/backend/
├── src/
│   ├── routes/
│   │   └── profile.ts          # add DELETE /api/profile
│   └── services/
│       └── profile.service.ts  # add deleteSelf()
└── tests/
    └── profile-delete.test.ts  # new: unit + route tests

packages/frontend/
├── src/
│   ├── components/
│   │   └── DeleteAccountModal.tsx   # new
│   ├── pages/
│   │   └── AccountSettings.tsx      # add Danger Zone section
│   ├── services/
│   │   └── profile.ts               # add deleteAccount()
│   └── i18n/locales/
│       ├── en.json                  # new keys
│       └── de.json                  # new keys
└── tests/
    ├── components/
    │   └── DeleteAccountModal.test.tsx  # new
    └── e2e/
        └── delete-account.spec.ts       # new Playwright test
```

**Structure Decision**: Web application layout (Option 2). No new packages — changes are
distributed across the existing three packages following the same patterns as feature 017
(account profile settings).

## Complexity Tracking

> No constitution violations — section left empty.
