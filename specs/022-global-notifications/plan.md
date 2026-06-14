# Implementation Plan: Global Notification System

**Branch**: `022-global-notifications` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-global-notifications/spec.md`

## Summary

Replace all inline `<Alert>` success/error feedback on authenticated pages with `@mantine/notifications` toast notifications that auto-dismiss after 5 seconds. Install `@mantine/notifications` v7, mount `<Notifications />` in `main.tsx`, create a thin `notifications.ts` helper, and migrate every affected page and component. Public pages (AcceptInvitation, ResetPassword, ForgotPassword, EmailVerifyConfirm, SignIn) are explicitly excluded and keep their inline feedback.

## Technical Context

**Language/Version**: TypeScript 5.5, strict mode, ESM

**Primary Dependencies**: React 18, Mantine v7.17, `@mantine/notifications` v7.17 (new), `@tanstack/react-query` v5, `react-i18next`

**Storage**: N/A (UI-only change)

**Testing**: Vitest + @testing-library/react (unit); Playwright (e2e)

**Target Platform**: Web browser (Vite SPA)

**Project Type**: Web application (Vite frontend + Fastify backend monorepo)

**Performance Goals**: Notification appears within one render cycle after mutation callback fires (<16 ms)

**Constraints**: Must not change public-page behaviour; `@mantine/notifications` version must align with existing `@mantine/core` `^7.17.0`

**Scale/Scope**: ~10 files changed (1 new file, ~9 modified); ~15 inline Alert sites removed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ PASS | Tests updated before or alongside each component change. Each mutation callback change has a corresponding test asserting the notification appears and the inline Alert is absent. |
| II. Type Safety | ✅ PASS | `notifications.ts` helper is fully typed (`message: string` params, `void` return). `ContractForm` interface narrowed by removing the `error?: string \| null` prop — no `any` introduced. |
| III. Simplicity (YAGNI) | ✅ PASS | Two helper functions (`showSuccess`, `showError`). No new abstraction layers, providers, or contexts. `ContractForm.error` prop removed rather than left as dead code. |

No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/022-global-notifications/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
packages/frontend/
├── package.json                              # add @mantine/notifications
├── src/
│   ├── main.tsx                              # add <Notifications /> inside MantineProvider
│   ├── lib/
│   │   └── notifications.ts                 # NEW: showSuccess / showError helpers
│   ├── pages/
│   │   ├── AccountSettings.tsx              # replace Alert states with notifications
│   │   ├── ContractList.tsx                 # replace deleteError / loadError Alerts
│   │   ├── ContractNew.tsx                  # show error via notification, remove error prop
│   │   ├── ContractEdit.tsx                 # show error via notification, remove error prop
│   │   └── admin/
│   │       └── AccountsAdmin.tsx            # replace InviteForm/TestEmailForm/action Alerts
│   └── components/
│       ├── ContractForm.tsx                 # remove error prop
│       └── DeleteAccountModal.tsx           # replace deleteMutation.isError Alert
└── tests/
    └── unit/
        ├── AccountSettings.test.tsx         # update: assert notifications, not Alerts
        ├── AccountsAdmin.test.tsx           # update: assert notifications, not Alerts
        ├── ContractEdit.test.tsx            # update: assert notifications, not Alerts
        ├── ContractForm.test.tsx            # update: remove error-prop test cases
        └── DeleteAccountModal.test.tsx      # update: assert notifications, not Alerts
```

**Structure Decision**: Pure frontend change. Backend is untouched. The monorepo's `packages/frontend` package receives the new dependency and all source changes.

## Implementation Tasks

### Task 1 — Install @mantine/notifications

- Add `"@mantine/notifications": "^7.17.0"` to `packages/frontend/package.json` dependencies.
- Run `pnpm install` from repo root to update `pnpm-lock.yaml`.

### Task 2 — Create notifications utility

**File**: `packages/frontend/src/lib/notifications.ts`

Create two exported functions:

```ts
import { notifications } from '@mantine/notifications';

export function showSuccess(message: string): void {
  notifications.show({ message, color: 'green', autoClose: 5000 });
}

export function showError(message: string): void {
  notifications.show({ message, color: 'red', autoClose: 5000 });
}
```

Write a unit test that renders `<Notifications />`, calls `showSuccess`/`showError`, and asserts the message appears in the DOM.

### Task 3 — Mount Notifications in main.tsx

Add `import { Notifications } from '@mantine/notifications'` and render `<Notifications position="top-right" />` inside `<MantineProvider>`, before `<QueryClientProvider>`.

No tests needed for this bootstrap change (covered by integration/e2e scenarios).

### Task 4 — Migrate AccountSettings

Remove `passwordSuccess` state and all inline `<Alert role="status" color="green">` / `<Alert role="alert" color="red">` from:
- Display name success/error
- Password change success/error
- Email change success/error

Replace with `showSuccess(t('...'))` / `showError(t('...'))` calls in `onSuccess`/`onError` callbacks or `emailChangeErrorMessage()` effect.

Keep intact:
- Blue "pending email change" `<Alert color="blue">` — informational persistent state.

Update `AccountSettings.test.tsx` to assert notification text appears in DOM and no inline success/error Alert exists.

### Task 5 — Migrate AccountsAdmin

**InviteForm sub-component**:
- Remove `success` state and both Alert JSX blocks.
- Call `showSuccess(t('accountsAdmin.inviteSuccess'))` in `onSuccess`.
- Call `showError(errorMessage())` in `onError` (keep `errorMessage()` helper, just use its return value for the notification instead of Alert JSX).

**TestEmailForm sub-component**:
- Same pattern: remove `success`/`error` states and Alert JSX, call `showSuccess`/`showError` in the try/catch.

**AccountsAdmin main component**:
- Remove the `(archiveError || reactivateError || deleteError || roleError)` Alert block.
- Use `onError` callbacks on each mutation hook (`useArchiveAccount`, etc.) to call `showError(actionErrorMessage(err))`.
- Remove the `isError` load-error Alert, replace with `showError(t('accountsAdmin.loadError'))` via a `useEffect` on `isError`.

Update `AccountsAdmin.test.tsx` accordingly.

### Task 6 — Migrate ContractList

- Remove `deleteError` Alert — add `onError` to `useDeleteContract()` to call `showError(t('contractList.deleteError'))`.
- Remove `isError` load Alert — add `useEffect` on `isError` to call `showError(t('contractList.loadError'))`.

No new state needed.

### Task 7 — Remove error prop from ContractForm; migrate ContractNew and ContractEdit

**ContractForm**:
- Remove `error` prop from interface and JSX.
- Update JSDoc.

**ContractNew**:
- Remove `error={...}` prop from `<ContractForm>`.
- Add `onError: (err) => showError(err.message)` callback to `createContract` mutation.

**ContractEdit**:
- Same as ContractNew.
- The `isError` load Alert (when contracts fail to load) can remain inline — it renders the whole page as a centered alert, which is appropriate (the page cannot render at all without data). It is not an action result.

Update `ContractForm.test.tsx` (remove error-prop test cases) and `ContractEdit.test.tsx` (assert notification instead of inline Alert on submit error).

### Task 8 — Migrate DeleteAccountModal

- Remove `deleteMutation.isError` Alert block.
- Add `onError` to `deleteMutation` to call `showError(t('deleteModal.deleteError'))`.
- Keep the `isSoleAdmin` orange `<Alert>` — it is a blocking guard, not an error.

Update `DeleteAccountModal.test.tsx`.

### Task 9 — Update test setup (renderWithProviders)

Locate the shared test render wrapper (likely in `tests/unit/` or `src/test-utils`). Add `<Notifications />` to the provider tree so notification DOM output is available in all unit tests. Add `notifications.clean()` in `afterEach` to prevent state leakage.

### Task 10 — Lint, type-check, and test

```bash
pnpm --filter @pcm/frontend build   # tsc + vite build (type-check)
pnpm --filter @pcm/frontend test    # Vitest unit suite
```

All tests must pass; zero TypeScript errors.

## Complexity Tracking

No constitution violations — no entry required.
