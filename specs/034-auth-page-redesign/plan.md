# Implementation Plan: Authentication Page Redesign

**Branch**: `034-auth-page-redesign` | **Date**: 2026-06-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/034-auth-page-redesign/spec.md`

## Summary

Replace the existing `AuthCard`-based sign-in and forgot-password pages with a two-column Mantine authentication layout that shows a decorative image panel alongside the form. Both forms live in a single `AuthPage` component that toggles between sign-in and forgot-password views via React state — no full page reload occurs when switching. Both `/sign-in` and `/forgot-password` routes remain independently accessible by passing an `initialView` prop to `AuthPage`. A new `AuthImageLayout` wrapper component provides the two-column structure and is reusable for future public pages. All existing authentication logic (validation, error messages, redirect-after-login, session checking) is preserved unchanged.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)

**Primary Dependencies**: React 18, Mantine 7.17, React Router 7, react-i18next (i18next 26)

**Storage**: N/A (frontend-only change; no schema migrations)

**Testing**: Vitest (unit/component tests), Playwright (end-to-end tests)

**Target Platform**: Browser (desktop + mobile); SSR not used

**Project Type**: Web application (React SPA, Vite build)

**Performance Goals**: Standard — layout renders within one animation frame; no new network requests introduced

**Constraints**: Must not break existing Playwright e2e auth tests; image panel must not cause layout shift on initial load; i18n keys must be added in both `en.json` and `de.json`

**Scale/Scope**: Two pages (sign-in, forgot-password); one new shared layout component; one existing layout component kept for remaining public pages (reset-password, accept-invitation, email-verify-confirm)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Notes |
|-----------|-----------|-------|
| I. Test-First (TDD) | ✅ Compliant | Vitest component tests for `AuthImageLayout` and `AuthPage` written before implementation; existing Playwright e2e tests serve as the failing-test baseline |
| II. Type Safety | ✅ Compliant | All new component props defined as TypeScript interfaces with no implicit `any`; `initialView` union type `'sign-in' \| 'forgot-password'` fully typed |
| III. Simplicity (YAGNI) | ✅ Compliant | `AuthImageLayout` solves the real problem (reuse between sign-in and forgot-password pages now); no speculative abstractions beyond current needs |

*Post-design re-check*: No violations introduced. `AuthCard` is retained for pages not being redesigned — no unnecessary refactor of working components.

## Project Structure

### Documentation (this feature)

```text
specs/034-auth-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 component model
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Phase 1 component prop contracts
│   ├── AuthImageLayout.md
│   └── AuthPage.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── components/
│   ├── AuthCard.tsx                  # UNCHANGED — kept for reset-password, invite, email-verify
│   └── AuthImageLayout.tsx           # NEW — two-column image+form wrapper
├── pages/
│   ├── AuthPage.tsx                  # NEW — combined sign-in/forgot-password page with view toggle
│   ├── SignIn.tsx                    # REMOVED (logic merged into AuthPage)
│   └── ForgotPassword.tsx            # REMOVED (logic merged into AuthPage)
└── i18n/locales/
    ├── en.json                       # UPDATED — new keys for AuthImageLayout panel text
    └── de.json                       # UPDATED — German translations for new keys
```

**`main.tsx` routing change**: The `/sign-in` route renders `<AuthPage initialView="sign-in" />` and the `/forgot-password` route renders `<AuthPage initialView="forgot-password" />`. Both routes continue to exist with their current paths.

**`AuthCard.tsx`** is kept unchanged and continues to serve `ResetPassword`, `AcceptInvitation`, and `EmailVerifyConfirm` pages.

## Complexity Tracking

> No Constitution violations. Section intentionally empty.
