# Quickstart Validation Guide: Delete Account

**Branch**: `019-delete-account` | **Date**: 2026-06-14

## Prerequisites

- Dev server running: `pnpm dev` from repo root
- At least two user accounts in the database (one admin, one member) — use `pnpm db:seed`
  or create them via the Admin Accounts page
- Browser DevTools open to observe network requests and cookie state

## Scenario 1: Regular member deletes their account (happy path)

1. Sign in as a MEMBER user.
2. Navigate to **Account Settings** (via profile menu or `/settings`).
3. Scroll to the bottom — verify a visually distinct **Danger Zone** section is present with
   a red/danger-coloured border and a "Delete Account" button.
4. Click **Delete Account** — a modal opens.
5. Verify the modal prominently displays a warning that deletion is permanent and irreversible.
6. Verify the modal shows a **"Download contracts as JSON"** button (or a note that there are
   no contracts if the account has none).
7. Click **"Download contracts as JSON"** — verify a `contracts-YYYY-MM-DD.json` file
   downloads and contains the user's contracts in the same format as the existing export.
8. Click the final **"Permanently Delete My Account"** confirmation button.
9. Verify a loading/spinner state is shown during the request.
10. Verify the user is redirected to `/sign-in` after deletion.
11. Verify the session cookie has been cleared (DevTools > Application > Cookies).
12. Attempt to sign in with the deleted user's credentials — verify sign-in fails.
13. Sign in as admin and check Admin Accounts — verify the deleted user no longer appears.

## Scenario 2: User skips export and deletes directly

1. Sign in as a MEMBER user.
2. Open the Delete Account modal.
3. Click **"Skip, delete without downloading"** (or equivalent skip action).
4. Verify the final confirmation button is now available.
5. Click **"Permanently Delete My Account"** — verify redirect to `/sign-in`.

## Scenario 3: User cancels mid-flow

1. Sign in as any user.
2. Open the Delete Account modal.
3. Click **Cancel** (or the modal close ×).
4. Verify no deletion occurred — user remains signed in, account intact.
5. Repeat with cancel at the final confirmation step — same expectation.

## Scenario 4: Sole admin is blocked

1. Sign in as the only ADMIN user in the system.
2. Navigate to **Account Settings > Danger Zone**.
3. Click **Delete Account** — the modal opens.
4. Proceed to the confirmation step.
5. Verify the confirmation button is **disabled** and a message explains the sole-admin
   restriction (e.g., "You are the only administrator. Promote another user to admin first.").
6. Dismiss the modal — account is intact.
7. From Admin Accounts, promote the MEMBER user to ADMIN.
8. Return to Account Settings and repeat steps 2–4.
9. Verify the confirmation button is now **enabled** and deletion proceeds normally.

## Scenario 5: API contract validation

Using `curl` or an HTTP client:

```bash
# Unauthenticated — expect 401
curl -X DELETE http://localhost:3000/api/profile

# Authenticated as a regular member (obtain cookie via POST /api/auth/sign-in first)
curl -X DELETE http://localhost:3000/api/profile \
  -H "Cookie: pcm_session=<session-id>" \
  -v
# Expect: 204, Set-Cookie clears the session

# Sole admin — expect 409
# (first ensure only one admin exists in the database)
curl -X DELETE http://localhost:3000/api/profile \
  -H "Cookie: pcm_session=<admin-session-id>" \
  -v
# Expect: 409 with message about last-admin restriction
```

## Running automated tests

```bash
# Backend unit + integration tests
pnpm --filter backend test -- --reporter=verbose profile-delete

# Frontend component tests
pnpm --filter frontend test -- --reporter=verbose DeleteAccountModal

# E2E (requires dev server running)
pnpm --filter frontend test:e2e -- delete-account
```

## Expected outcomes checklist

- [ ] Danger Zone section visible at bottom of Account Settings
- [ ] Modal opens on button click; does not delete immediately
- [ ] JSON export downloads correctly (or export section is absent for empty accounts)
- [ ] Skip path reaches confirmation without downloading
- [ ] Cancel at any step leaves account intact
- [ ] Sole admin sees disabled confirm button with explanatory message
- [ ] Successful deletion: redirect to `/sign-in`, cookie cleared, account gone
- [ ] Server-side: `DELETE /api/profile` returns 204 on success, 409 on last-admin, 401 when unauthenticated
