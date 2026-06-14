# Quickstart & Validation Guide: Email Enhancements (018)

## Prerequisites

- App running locally: `pnpm dev` from repo root (backend on :3000, frontend on :5173)
- SMTP configured via environment variables (`SMTP_HOST`, `SMTP_FROM`, etc.) **or** using a
  local mail sink such as Mailpit on port 1025/8025
- An admin account available (default seed: see `packages/backend/src/db/seed.ts`)
- A second (non-admin) account or invitation token for invitation-flow testing

---

## Scenario A — Admin sends a test email

1. Sign in as an admin.
2. Navigate to the **Accounts & Invitations** admin page.
3. Locate the **Test email delivery** section.
4. The recipient field should be pre-filled with the admin's own email address.
5. Click **Send test email**.
6. **Expected**: A success alert appears in the UI and a test email arrives in the inbox
   (or mail sink).
7. **Error path**: With SMTP misconfigured, click **Send test email** and verify a descriptive
   error message appears (not a generic crash).
8. **Non-admin guard**: Attempt `POST /api/admin/email/test` as a non-admin (e.g., via curl
   with a member session cookie) and verify `403 Forbidden` is returned.

---

## Scenario B — Welcome email after invitation acceptance

1. Sign in as an admin and create a new invitation to a test address.
2. Locate the invitation token (from the mail sink or directly from the SQLite `invitations`
   table).
3. Open `http://localhost:5173/invitations/<token>`, set a password, and submit.
4. **Expected**: Account is activated (redirected to the app) **and** a welcome confirmation
   email arrives at the invited address in the mail sink.
5. **Error path**: Start the backend without SMTP configured, repeat step 3, and verify the
   account activation still succeeds and the welcome email failure is logged (not surfaced to
   the user).

---

## Scenario C — Confirmation email after email address change

1. Sign in as any active user.
2. Navigate to **Account Settings**.
3. Enter a new email address and submit the email change request.
4. Retrieve the verification link from the mail sink (or the `email_verifications` table).
5. Open `http://localhost:5173/email-change/confirm/<token>`.
6. **Expected**: Account email is updated (success message shown) **and** a confirmation email
   arrives at the new address in the mail sink.
7. **Error path**: Start the backend without SMTP configured, repeat steps 5–6, and verify the
   email change still completes and the confirmation email failure is logged (not surfaced to
   the user).

---

## Running automated tests

```bash
# Unit tests (backend)
pnpm --filter backend test

# Integration tests (backend)
pnpm --filter backend test:integration

# E2E tests (frontend — requires running app)
pnpm --filter frontend test:e2e
```

Key test files to verify after implementation:

| File | What it covers |
|------|---------------|
| `packages/backend/tests/unit/mailer.service.test.ts` | `sendTestEmail`, `sendWelcomeEmail`, `sendEmailChangeConfirmationEmail` |
| `packages/backend/tests/unit/profile.service.test.ts` | `confirmEmailChange` returns `{ outcome: 'confirmed', newEmail }` |
| `packages/backend/tests/integration/invitations.route.test.ts` | Welcome email called (mock mailer) on acceptance |
| `packages/backend/tests/integration/profile.route.test.ts` | Confirmation email called (mock mailer) on email-change confirm |
| `packages/backend/tests/integration/admin.route.test.ts` | Test-email endpoint: 200 success, 400 bad input, 403 non-admin, 502 mailer error |
