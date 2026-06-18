# Data Model: Authentication Page Redesign

**Branch**: `034-auth-page-redesign` | **Date**: 2026-06-18

## Overview

This feature introduces no new backend entities and no schema migrations. The changes are entirely in the frontend component layer. The "data model" here describes the React component entities and their state.

---

## Component Entities

### `AuthImageLayout`

**Role**: Two-column page shell for all public authentication pages.

| Field / Slot | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Form content rendered in the right (form) column |
| `imageUrl` | `string?` | Optional URL for the background image in the left column; defaults to a built-in asset |

**Behaviour**:
- Left column: decorative image panel, hidden on xs viewports (`visibleFrom="sm"`).
- Right column: vertically and horizontally centred slot for form content.
- Wraps `PublicLayout` for the outer AppShell (header + footer), replacing `AuthCard` for sign-in and forgot-password.
- Image column occupies approximately 55% of the width on desktop; form column 45%.

**State**: None (stateless presentational component).

---

### `AuthPage`

**Role**: Combined sign-in + forgot-password page rendered at both `/sign-in` and `/forgot-password` routes.

| Field | Type | Description |
|---|---|---|
| `initialView` | `'sign-in' \| 'forgot-password'` | Which form is shown on first render |

**Internal state**:

| State variable | Type | Description |
|---|---|---|
| `view` | `'sign-in' \| 'forgot-password'` | Currently displayed form; initialised from `initialView` prop |
| `email` (sign-in) | `string` | Controlled input for the sign-in email field |
| `password` | `string` | Controlled input for the sign-in password field |
| `forgotEmail` | `string` | Controlled input for the forgot-password email field |
| `forgotSuccess` | `boolean` | True after a successful password-reset email request |
| `forgotValidationError` | `string \| null` | Inline field error for the forgot-password email |
| `forgotGenericError` | `string \| null` | Alert-level error for the forgot-password form |
| `forgotIsPending` | `boolean` | Loading state for the forgot-password submission |

**Hooks consumed** (unchanged from current pages):
- `useCurrentUser()` — redirects already-authenticated users to `/`
- `useSignIn()` — mutation for sign-in form submission
- `useRequestPasswordReset()` — mutation for forgot-password form submission

**View transitions**:
- `'sign-in' → 'forgot-password'`: triggered by "Forgot password?" anchor click (`setView('forgot-password')`)
- `'forgot-password' → 'sign-in'`: triggered by "Back to sign in" anchor click (`setView('sign-in')`)
- No React Router navigation occurs on view toggle.

---

## Routing Model

No new routes. Existing route table change in `main.tsx`:

| Route | Previous Component | New Component |
|---|---|---|
| `/sign-in` | `<SignIn />` | `<AuthPage initialView="sign-in" />` |
| `/forgot-password` | `<ForgotPassword />` | `<AuthPage initialView="forgot-password" />` |
| All other public routes | Unchanged | Unchanged |

---

## i18n Keys

New keys required (illustrative — exact wording decided during implementation):

| Key | Namespace | Purpose |
|---|---|---|
| `authPage.imageAlt` | `authPage` | Accessible alt text for the decorative image |
| `authPage.tagline` | `authPage` | Optional brand tagline displayed in the image panel |

All existing `auth.*` and `forgotPassword.*` keys are unchanged and continue to be used by `AuthPage`.
