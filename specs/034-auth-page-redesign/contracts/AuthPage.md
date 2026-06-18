# Component Contract: AuthPage

**File**: `packages/frontend/src/pages/AuthPage.tsx`

## Purpose

Unified authentication page rendered at both `/sign-in` and `/forgot-password` routes. Manages view state to toggle between the sign-in form and the forgot-password form within the same `AuthImageLayout` shell — no page remount occurs when switching views.

## Props

```ts
interface AuthPageProps {
  /** Which form to display on initial render. */
  initialView: 'sign-in' | 'forgot-password';
}
```

## Behaviour Contract

### Session guard

| Scenario | Expected behaviour |
|---|---|
| Session check in progress | Render nothing (same as current `SignIn.tsx`) |
| User already authenticated | Redirect to `/` via `<Navigate replace>` |
| User not authenticated | Render the active form view |

### Sign-in view

| Scenario | Expected behaviour |
|---|---|
| Valid credentials submitted | User authenticated; navigate to redirect target (from router location state) or `/` |
| Invalid credentials (HTTP 401) | Inline error alert with `auth.errorInvalidCredentials` message; form remains visible |
| Account locked (HTTP 423) | Inline error alert with `auth.errorLocked` message; form remains visible |
| Any other error | Inline error alert with `auth.errorGeneric` message |
| "Forgot password?" anchor clicked | `view` state changes to `'forgot-password'`; no React Router navigation |
| Form fields present | Email (`TextInput`, type=email) and Password (`PasswordInput`) only — no "remember me", no "create account" |

### Forgot-password view

| Scenario | Expected behaviour |
|---|---|
| Valid email submitted | `forgotSuccess` set to `true`; success alert shown; form hidden |
| Invalid email (HTTP 400) | Inline field error on email input with `forgotPassword.invalidEmail` message |
| Any other error | Generic error alert with `forgotPassword.errorGeneric` message |
| "Back to sign in" anchor clicked | `view` state changes to `'sign-in'`; no React Router navigation |
| Form fields present | Email (`TextInput`, type=email) only |

## Route Binding

```text
/sign-in          → <AuthPage initialView="sign-in" />
/forgot-password  → <AuthPage initialView="forgot-password" />
```

Both routes are defined in `packages/frontend/src/main.tsx`.
