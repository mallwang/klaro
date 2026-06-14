# Quickstart Validation Guide: Account Profile Settings

**Branch**: `017-account-profile-settings` | **Date**: 2026-06-14

This guide describes how to verify the feature end-to-end. See [contracts/profile-api.md](contracts/profile-api.md) for API shapes and [data-model.md](data-model.md) for the DB schema.

## Prerequisites

```bash
# Install dependencies (from repo root)
pnpm install

# Backend: SMTP must be configured for email verification tests
# Set in .env or shell:
export SMTP_HOST=localhost
export SMTP_PORT=1025   # e.g., Mailhog or similar local SMTP catcher
export SMTP_FROM="noreply@pcm.local"
export APP_URL="http://localhost:5173"
```

## 1 — Run Tests (Unit + Integration)

```bash
# All backend tests
pnpm --filter backend test

# All frontend tests
pnpm --filter frontend test
```

All tests must pass before proceeding.

## 2 — Start the Application

```bash
# Terminal 1: backend
pnpm --filter backend dev

# Terminal 2: frontend
pnpm --filter frontend dev
```

Navigate to `http://localhost:5173` and sign in.

## 3 — Sidebar User Widget

**Scenario**: Sidebar shows user's name, role, and avatar.

1. Sign in as any user.
2. Observe the bottom-left of the sidebar.
3. **Expected**: Avatar icon (user silhouette), user's display name, and role label ("Admin" or "Member") are visible.
4. Sign in as a MEMBER user → role label reads "Member".
5. Sign in as an ADMIN user → role label reads "Admin".

## 4 — Update Display Name

**Scenario**: User updates their display name.

1. Navigate to `/account` (Account Settings).
2. Locate the "Display Name" section.
3. Clear the field and enter "New Name", click Save.
4. **Expected**: Success alert appears; sidebar immediately shows "New Name".
5. Refresh the page → display name persists.
6. Try submitting an empty name → **Expected**: form validation error, no API call.

## 5 — Request Email Change

**Scenario**: User initiates an email address change.

1. Navigate to `/account`.
2. Locate the "Email Address" section — current email shown read-only.
3. Enter a new valid email and submit.
4. **Expected**: "Check your inbox" confirmation shown. In the SMTP catcher inbox, a verification email arrives at the new address within ~30 seconds.
5. Return to `/account` — a notice reads "Waiting for verification at [new email]."

**Negative: email already in use**:
1. Enter an email already registered to another active account.
2. **Expected**: 409 conflict error displayed inline.

## 6 — Confirm Email Change (Verification Link)

**Scenario**: User clicks the verification link.

1. Complete step 5 above.
2. In the SMTP catcher, find the verification email and click the link (format: `http://localhost:5173/email-change/confirm/<token>`).
3. **Expected**: Browser opens the confirmation page, shows loading then success: "Your email address has been updated."
4. Sign in again → new email is required for sign-in.
5. `/account` no longer shows a pending notice.

**Negative: expired token**:
1. Directly call `POST /api/profile/email-change/:oldToken/confirm` with an expired token (manually set `expires_at` to a past date in the DB via SQLite client).
2. **Expected**: Page shows "This link has expired."

**Negative: unknown token**:
1. Visit `http://localhost:5173/email-change/confirm/invalidtoken`.
2. **Expected**: Page shows "This link is not valid."

## 7 — Re-request Supersedes Previous Token

1. Submit an email change request for `new1@example.com`.
2. Without clicking the link, submit another request for `new2@example.com`.
3. Try clicking the link from step 1 → **Expected**: 410 Gone or 404 (link is no longer valid).
4. Click the link from step 2 → **Expected**: Success.

## 8 — Unauthenticated Confirmation

**Scenario**: User opens verification link in a browser with no active session.

1. Send a verification email (step 5).
2. Open the link in a private/incognito window with no session.
3. **Expected**: Confirmation page loads (no redirect to sign-in), shows success message.

## 9 — E2E Tests

```bash
# From repo root (requires running backend + frontend)
pnpm --filter frontend test:e2e
```

Relevant test file: `tests/e2e/account-profile.spec.ts` (created as part of this feature).
