# Phase 1 API Contracts: Public Self-Service Sign-Up with Admin Approval

New `/api/signup*` endpoints, additive to the existing invitation model
([014-email-invitations](../../014-email-invitations/contracts/api-contracts.md)). Two routes are
**Public** (added to the auth hook's allowlist); the rest require an authenticated
**administrator** session and follow the existing `{ statusCode, error, message }` error
convention (see `routes/invitations.ts`/`routes/users.ts`).

Existing endpoints (`/api/auth/*`, `/api/users/*`, `/api/invitations/*`, `/api/contracts*`,
`/api/dashboard`) are **unchanged** by this feature.

## Submitting a sign-up — `POST /api/signup` — **Public**

Request body (`CreateSignupRequestBodySchema`): `{ email: string, password: string }`

- `201`: request created and verification email dispatched; body
  `{ token, email, status: 'UNVERIFIED', createdAt, verificationExpiresAt }`
- `400`: validation error (malformed email or password not meeting the platform's password
  policy)
- `409` (Conflict): `email` already resolves to an active/archived account, a pending
  invitation, or an existing sign-up request of any status (FR-003) — a single generic message
  ("this email address cannot be used to sign up right now") is returned regardless of *which*
  of those three is the cause, and regardless of whether an existing sign-up request is
  unverified, awaiting review, or rejected (FR-015 — never reveal a rejection reason here)
- `502` (Bad Gateway): the request row was created, but the verification email could not be
  dispatched — rolled back (not left half-sent), matching the existing invitation-send `502`
  convention

## Verifying a sign-up — `POST /api/signup/:token/verify` — **Public**

No request body.

- `200`: request marked `PENDING_REVIEW`, `verified_at` set, and every active administrator is
  emailed a link to `/admin/accounts` (FR-006); body `{ email, status: 'PENDING_REVIEW' }`
- `404`: token does not correspond to any sign-up request — generic "this verification link
  isn't valid" (does not distinguish "never existed" from other states, matching the invitation
  accept endpoint's convention)
- `410` (Gone): token corresponds to a request that is already `PENDING_REVIEW` or `REJECTED`
  ("this link has already been used") or past `verification_expires_at` ("this link has expired
  — you may sign up again with the same email address"), per FR-005/FR-016 — distinct messages
  for "already used" vs. "expired"

## Listing sign-up requests — `GET /api/signup-requests` (admin-only)

- `200`: array of `{ token, email, status, createdAt, verifiedAt, rejectionReason, decidedAt }`
  for every request currently in the table — `UNVERIFIED`, `PENDING_REVIEW`, and `REJECTED` rows
  not yet swept/deleted — so the admin can see verification status and submission date (FR-007)
  and review rejected entries pending deletion

## Approving a sign-up — `POST /api/signup-requests/:token/approve` (admin-only)

No request body.

- `201`: creates a new active `users` row from the request's stored email/password, deletes the
  `signup_requests` row, and sends the existing welcome email with a login link (FR-008/FR-009);
  body `{ id, email, displayName, role: 'MEMBER' }` (matching `POST /api/users`'s existing
  creation response shape; `displayName` defaults to the local part of the email, same convention
  as invitation acceptance)
- `404`: no such sign-up request
- `409` (Conflict): request is not currently `PENDING_REVIEW` (still `UNVERIFIED`, or another
  admin already approved/rejected it concurrently) — message states its current status (FR-010,
  Edge Cases)

## Rejecting a sign-up — `POST /api/signup-requests/:token/reject` (admin-only)

Request body (`RejectSignupRequestBodySchema`): `{ reason?: string }`

- `200`: request marked `REJECTED` with the given (or absent) reason, `decided_at` set, and a
  rejection email sent to the requester stating the reason or that none was given (FR-011/FR-012);
  body `{ token, email, status: 'REJECTED', rejectionReason }`
- `404`: no such sign-up request
- `409` (Conflict): request is not currently `PENDING_REVIEW` (FR-010, Edge Cases — same
  semantics as approve's `409`)

## Deleting a sign-up entry — `DELETE /api/signup-requests/:token` (admin-only)

- `204`: deletes the request row regardless of status (`UNVERIFIED`, `PENDING_REVIEW`, or
  `REJECTED`); for a `REJECTED` row this is the only action that clears the address's blacklist
  (FR-014)
- `404`: no such sign-up request

## Existing endpoints — no change

`/api/auth/*`, `/api/invitations/*`, `/api/users/*`, `/api/contracts*`, `/api/dashboard` keep
their exact request/response shapes — nothing about their contracts changes. The only frontend
addition is a "Sign up" entry point on `AuthPage.tsx` and a new "Sign-up requests" table on
`AccountsAdmin.tsx` consuming the endpoints above.
