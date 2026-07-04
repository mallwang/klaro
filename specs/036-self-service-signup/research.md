# Phase 0 Research: Public Self-Service Sign-Up with Admin Approval

## 1. Relationship to the existing invitation flow

**Decision**: Sign-up is a new, parallel path alongside
[014-email-invitations](../014-email-invitations/), not a replacement. Both ultimately create a
`users` row; they differ in who initiates (admin vs. public visitor) and in the gate before that
happens (none vs. email-verification-then-admin-approval).

**Rationale**: The spec explicitly keeps invitations working ("a separate table listing sign-ups")
and only adds a new intake channel. Unifying them into one table/state-machine would conflate two
different trust models (admin-initiated vs. public-initiated) and complicate the existing,
already-shipped invitation code for no benefit.

**Alternatives considered**: Extending `invitations` with an `initiated_by = 'SELF'` row and a
`PENDING_REVIEW` status — rejected because invitations' state machine
(`PENDING`/`ACCEPTED`/`CANCELLED`/`SUPERSEDED`) has no concept of admin approval, and retrofitting
one would touch tested, working code for a feature (014) that isn't being changed by this spec.

## 2. Token generation, expiry, and single-use enforcement

**Decision**: Reuse the exact pattern already used for invitation tokens:
`randomBytes(32).toString('hex')` as the primary key, with a `verification_expires_at` column
checked at verify-time, and a state transition (`UNVERIFIED` → `PENDING_REVIEW`) that makes the
token a one-time gate — reusing it again after verification returns "already verified" rather than
re-triggering anything.

**Rationale**: Identical entropy and lifecycle already exists, is tested, and is understood by
anyone maintaining the codebase. No reason to invent a second convention.

**Alternatives considered**: JWT-based verification tokens (stateless) — rejected; the codebase
has no JWT infrastructure anywhere, and a stateless token can't be revoked/expired via a DB row
the way FR-005/FR-016 need (expiry + one-time use tied to a row that also carries the pending
account's own data).

## 3. Where the "is this email available?" check lives

**Decision**: Enforce as a single `UNIQUE(email COLLATE NOCASE)` constraint on `signup_requests`,
combined with an application-level pre-check against `users` (active + archived) and `invitations`
(status = `PENDING`) before insert, inside one service method (`create()`).

**Rationale**: The spec's blacklist requirement (FR-013) needs "no more than one live row per
email" to hold regardless of race conditions; a DB constraint is the only thing that's actually
race-proof, with the pre-checks against the *other* two tables providing the friendly "already
have an account/invitation" error message needed by FR-003 before hitting the constraint.

**Alternatives considered**: Checking only in application code (no DB constraint) — rejected as
not race-safe under concurrent submissions of the same address.

## 4. Notifying "all admins" on verification

**Decision**: Synchronous fan-out at verify-time: `SELECT * FROM users WHERE role = 'ADMIN' AND
status = 'ACTIVE'`, then one `mailer.sendAdminSignupNotificationEmail(...)` call per admin, inside
the verify route handler.

**Rationale**: Matches the existing "send synchronously, surface failure immediately" convention
established for invitations (see [014-email-invitations](../014-email-invitations/plan.md)
Constraints). The number of admins is always small (household/small-group scale), so a loop of
direct SMTP sends is trivially fast and needs no batching or queueing.

**Alternatives considered**: A single email with all admins BCC'd — rejected only because
per-admin sends allow each email to carry a personalized locale (`email_language` per user,
already a per-user column) exactly as `sendPasswordResetEmail`/`sendWelcomeEmail` already do
per-recipient; a single multi-locale email isn't expressible with the existing template style.

## 5. What happens to a rejected row's blacklist over time

**Decision**: A `REJECTED` row's blacklist effect never expires automatically — it only clears
when an admin deletes the row (FR-014). Expired `UNVERIFIED` rows, by contrast, are swept
automatically (FR-016), since they were never reviewed and there's no decision to preserve.

**Rationale**: Directly stated by the spec ("only available for another attempt once the admin
deletes the registration entry") and by the Assumptions section — this is a deliberate business
rule (an explicit human decision must be actively reversed), not an oversight.

**Alternatives considered**: Time-boxed blacklist (e.g., 90 days) — rejected; not requested, and
would silently reopen an address the admin explicitly rejected, undermining the admin's decision.
