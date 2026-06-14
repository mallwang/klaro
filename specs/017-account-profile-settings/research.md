# Research: Account Profile Settings

**Branch**: `017-account-profile-settings` | **Date**: 2026-06-14

## §1 Email Verification Token Design

**Decision**: Use a dedicated `email_verifications` SQLite table with a `UNIQUE INDEX` on `user_id`.

**Rationale**: The invitation service already proves this project's token pattern: `randomBytes(32).toString('hex')` produces a 64-character hex token that is cryptographically strong, URL-safe, and statistically collision-free. The unique index on `user_id` enforces "one pending request per user" as a DB invariant — no status column needed. A new request simply deletes the old row and inserts a new one within a transaction (the same `SUPERSEDED` pattern the invitation service uses, simplified).

**Alternatives considered**:
- Adding a `pending_email` column directly to the `users` table: avoids a new table but couples the user row to a temporary state and requires a second column for the expiry timestamp.
- A status column (`PENDING`/`EXPIRED`/`USED`) similar to invitations: adds complexity with no benefit since only one row per user can exist anyway.

---

## §2 Expiry: 24 Hours vs. 7 Days

**Decision**: 24-hour expiry for email verification links.

**Rationale**: Email changes are security-sensitive (the new address gains account access). 24 hours is the industry standard (GitHub, Google, Stripe all use 24h for email change verification). The invitation token uses 7 days because a new user may not check email immediately, but the account owner initiating an email change is actively present.

**Alternatives considered**: 7-day expiry (too long for a security-sensitive action); 1-hour (too short if the user is interrupted).

---

## §3 Session Handling After Email Change

**Decision**: No session invalidation on confirmation; rely on query cache invalidation.

**Rationale**: `GET /api/auth/me` reads the `users` table on every call. After `confirmEmailChange` updates `users.email`, the next `me` call returns the new email. The frontend confirmation page calls `queryClient.invalidateQueries(CURRENT_USER_QUERY_KEY)` after a successful confirm, which forces a fresh `me` fetch. Sessions remain valid — revoking all sessions on email change would be unnecessarily disruptive for a personal-use homeserver (single user per account, not a shared enterprise environment).

**Alternatives considered**: Invalidating all sessions on confirmation (common for high-security apps, but overkill here since the user is the one who initiated the change and clicked the link).

---

## §4 Public Route for Confirmation

**Decision**: The confirmation endpoint (`POST /api/profile/email-change/:token/confirm`) is added to `PUBLIC_ROUTES` in `server.ts`. The frontend route `/email-change/confirm/:token` is added outside `RequireAuth` in `main.tsx`.

**Rationale**: The verification link is sent to a new email address the user may open on a different device or browser where no session exists. The token is itself the authentication credential for this one action. This matches how `POST /api/invitations/:token/accept` works.

---

## §5 Mailer Failure Handling

**Decision**: On mailer failure during `POST /api/profile/email-change`, the token row is deleted and a 502 response is returned.

**Rationale**: The same pattern used in `invitations.ts` — the token is useless if the email was never delivered, so rolling it back prevents a phantom pending state. The user can simply re-submit the form to try again.

---

## §6 Display Name Update and Sidebar Reactivity

**Decision**: After `PATCH /api/profile` succeeds, invalidate `CURRENT_USER_QUERY_KEY` so `useCurrentUser()` refetches, which causes `NavbarSegmented` to re-render with the new display name.

**Rationale**: The sidebar reads `user?.displayName` from the TanStack Query cache (`useCurrentUser()`). Invalidating this key is the correct TanStack Query v5 pattern — it avoids manual cache mutation that could introduce inconsistency.

---

## §7 "One Pending Request Per User" Invariant

**Decision**: Enforced via `CREATE UNIQUE INDEX ON email_verifications(user_id)` at the DB level, with the service layer deleting the old row before inserting a new one (within a transaction).

**Rationale**: DB-level uniqueness prevents race conditions. The service uses a `db.transaction()` wrapper as with the invitation service — this is synchronous SQLite so there is no async concurrency concern, but the transaction guarantees atomicity for the delete+insert pair.
