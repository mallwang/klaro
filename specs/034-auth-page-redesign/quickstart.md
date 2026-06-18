# Quickstart Validation Guide: Authentication Page Redesign

**Branch**: `034-auth-page-redesign` | **Date**: 2026-06-18

## Prerequisites

- Node.js LTS + pnpm installed
- Development server running: `pnpm --filter frontend dev`
- A test user account available in the local database (see project README for seeding)

## Scenario 1 — Sign-in page renders new two-column layout

**Steps**:
1. Open `http://localhost:5173/sign-in` in a browser (desktop viewport, ≥ 1024 px wide).
2. Observe the page layout.

**Expected outcome**:
- Page shows two columns side by side.
- Left column: decorative image fills the full height.
- Right column: sign-in form centred vertically, containing only email field, password field, and sign-in button.
- No "remember me" checkbox is visible.
- No "create account" or registration link is visible.
- A "Forgot password?" link is visible below the sign-in button.

---

## Scenario 2 — Sign-in form is functional

**Steps**:
1. On the sign-in page, enter a valid test user email and password.
2. Click the sign-in button.

**Expected outcome**:
- User is authenticated and redirected to the main application dashboard.
- No error message is shown.

**Negative path**:
1. Enter an incorrect password.
2. Click the sign-in button.
3. An error alert appears within the form. The user remains on the sign-in page.

---

## Scenario 3 — Forgot-password toggle (no page reload)

**Steps**:
1. Open `http://localhost:5173/sign-in`.
2. Click "Forgot password?".

**Expected outcome**:
- The sign-in form disappears and the forgot-password form appears in its place.
- The image panel on the left remains visible and unchanged — no flicker or remount.
- The browser URL does **not** change (stays at `/sign-in`).
- The forgot-password form contains only an email field and a submit button.
- A "Back to sign in" link is visible.

---

## Scenario 4 — Back to sign in from forgot-password

**Steps**:
1. From the forgot-password view (reached via step 3 above), click "Back to sign in".

**Expected outcome**:
- The sign-in form reappears within the same layout.
- The image panel on the left remains unchanged.

---

## Scenario 5 — Forgot-password direct URL access

**Steps**:
1. Open `http://localhost:5173/forgot-password` directly in a new browser tab.

**Expected outcome**:
- The forgot-password form is shown immediately (not the sign-in form).
- The two-column layout with the image panel is present.

---

## Scenario 6 — Forgot-password form is functional

**Steps**:
1. Navigate to the forgot-password view.
2. Enter a valid email address.
3. Click the submit button.

**Expected outcome**:
- A success alert is shown with the confirmation message (prevent enumeration: always shows success regardless of whether email exists).
- The email form is hidden after success.

---

## Scenario 7 — Mobile layout (responsive check)

**Steps**:
1. Open `http://localhost:5173/sign-in`.
2. Resize the browser viewport to below 576 px width (or use DevTools mobile emulation).

**Expected outcome**:
- The image panel is no longer visible.
- The form occupies the full viewport width.
- All form fields and buttons remain fully usable.

---

## Scenario 8 — Existing Playwright e2e suite still passes

**Steps**:
```bash
pnpm --filter frontend test:e2e
```

**Expected outcome**:
- All existing Playwright authentication tests pass without modification to test code.
- No new test failures are introduced.

---

## Scenario 9 — Reset Password page unaffected

**Steps**:
1. Open `http://localhost:5173/reset-password/any-token`.

**Expected outcome**:
- The reset-password page renders using the existing `AuthCard` layout (centred card, no image panel).
- Its visual appearance is unchanged from before this feature.
