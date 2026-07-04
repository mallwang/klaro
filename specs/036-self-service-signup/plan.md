# Implementation Plan: Public Self-Service Sign-Up with Admin Approval

**Branch**: `036-self-service-signup` | **Date**: 2026-07-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/036-self-service-signup/spec.md`

## Summary

Add a public, unauthenticated sign-up path that runs alongside the existing admin-issued
[014-email-invitations](../014-email-invitations/) flow rather than replacing it: a visitor
submits an email + password on a new "Sign up" view; the system creates a `signup_requests` row,
sends a verification email, and — once the link is opened — notifies every administrator by
email with a link to the accounts page. Administrators see a third table (alongside accounts and
invitations) on `AccountsAdmin.tsx` listing verified sign-up requests, and can approve (creates an
active user + sends the existing welcome email) or reject (records a reason, sends a rejection
email, and blacklists the address until the entry is deleted). This reuses the invitation
feature's token/expiry/transaction patterns, the existing `password.ts` hashing, and the existing
`mailer.service.ts` transport — the only new pieces are one table, one service, one route file,
and the corresponding shared schemas/types and frontend surfaces.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 22 LTS (unchanged; matches
[014-email-invitations](../014-email-invitations/plan.md))

**Primary Dependencies**: Fastify 5, `better-sqlite3` (existing — new `signup_requests` table),
`zod` (existing — new signup schemas), `node:crypto` `randomBytes` (existing — reused as-is for
verification tokens, matching invitation-token generation), existing `password.ts`
(`hashPassword`), existing `mailer.service.ts` (new template methods on the existing
`nodemailer`-backed service; no new dependency).

**Storage**: SQLite via `better-sqlite3` (existing). New `signup_requests` table: `token` (PK,
doubles as the verification-link component, mirroring `invitations.token`), `email` (unique
while a row exists for that address — see FR-003), `password_hash`/`password_salt`, `status`
(`UNVERIFIED`/`PENDING_REVIEW`/`REJECTED`), `verification_expires_at`, `rejection_reason`
(nullable), `created_at`, `verified_at` (nullable), `decided_at` (nullable). No changes to
existing tables.

**Testing**: Vitest, following the existing `buildServer(createDb(':memory:'))` integration-test
pattern (`*.route.test.ts`) and `*.service.test.ts` unit-test pattern established by
[014-email-invitations](../014-email-invitations/). Mailer assertions use the same stub-transport
approach already in place for `mailer.service.test.ts`. One Playwright e2e extends
`packages/frontend/tests/e2e`.

**Target Platform**: Linux (Docker container behind the operator's HTTPS reverse proxy, per
[012-docker-packaging](../012-docker-packaging/)) — unchanged.

**Project Type**: Web application monorepo — `packages/backend` (Fastify API), `packages/frontend`
(React/Vite SPA), `packages/shared` (Zod schemas/types). Unchanged; no new packages.

**Performance Goals**: No new targets. Sign-up submission, verification, and admin
approve/reject are each a single indexed read/write plus at most one outbound SMTP call —
inherently I/O-bound on the mail server, not a request-rate-sensitive path.

**Constraints**: Reuses the platform's existing SMTP configuration (no new environment
variables). Verification links MUST be single-use and time-limited (FR-005, FR-016), matching the
invitation link's expiry window. Blacklist enforcement (FR-013) MUST be checked at submission
time against accounts, invitations, and existing signup requests to avoid duplicate/contradictory
state (per spec Edge Cases).

**Scale/Scope**: Same household/small-group scale as prior auth features — on the order of a
handful of sign-up requests outstanding at any time; no bulk or high-volume registration is in
scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE) ✅

Failing tests are written before each corresponding implementation piece, mirroring
[014-email-invitations](../014-email-invitations/plan.md)'s established structure:

- **`signup.route.test.ts`**: public submit (success, duplicate/blacklisted-email rejection per
  FR-003, weak-password rejection), public verify (success, already-used, expired, unknown
  token), admin list/approve/reject/delete (non-admin forbidden, approve-creates-user-and-sends-
  welcome-email, reject-with-and-without-reason, reject-then-resubmit-blocked, delete-clears-
  blacklist, concurrent double-decision rejected per Edge Cases).
- **`signup-request.service.test.ts`**: token generation/expiry/single-use logic, blacklist
  lookup across accounts/invitations/signup-requests, approve/reject/delete transactions.
- **`mailer.service.test.ts`** (extended): new template methods (verification email,
  admin-notification email, rejection email) using the existing stub-transport pattern — no real
  SMTP connection.
- **One Playwright e2e** (`signup-flow.spec.ts`, extending `invitation-flow.spec.ts`'s pattern):
  a visitor signs up, verifies via the captured stub-mail link, an admin approves it from
  `AccountsAdmin.tsx`, and the new user signs in with the welcome-email link — proving Stories
  1–3 end-to-end. A second, shorter test covers the reject → resubmission-blocked → delete →
  resubmission-allowed path (Story 4).

*Constitution compliant — tests precede implementation for every behavioral change.*

### Principle II — Type Safety (NON-NEGOTIABLE) ✅

- New Zod schemas in `@pcm/shared` (`schemas/signup.ts`): `SignupRequestSchema`,
  `CreateSignupRequestBodySchema`, `RejectSignupRequestBodySchema`, mirroring
  `schemas/invitation.ts`'s snake_case-row ↔ camelCase-API mapping convention.
- `types/signup.ts`: `SignupRequestStatus` enum, mirroring `types/invitation.ts`.
- No `any`; `strict: true` retained throughout.

*Constitution compliant.*

### Principle III — Simplicity (YAGNI) ✅

- **No new dependency**: verification tokens reuse `randomBytes(32).toString('hex')`
  (`invitation.service.ts`'s exact pattern); password hashing reuses `password.ts` unchanged;
  email delivery reuses the existing `mailer.service.ts` transport, adding only new
  template-literal methods (the same style already used for every other email in the codebase).
- **No new table for the admin-notification email**: "notify every admin" is a synchronous fan-
  out over the existing `users` table filtered by `role = 'ADMIN'` at verification time — no
  subscription/preferences table is introduced, since the spec always sends to every admin.
- **No retained "approved" state**: per FR-008, an approved request becomes a `users` row and the
  `signup_requests` row is deleted immediately — avoiding a redundant terminal state that nothing
  ever reads again (contrast with invitations' `ACCEPTED`, which that feature's spec explicitly
  asked to keep visible in a history list; this spec does not).
- **No background job queue**: verification, notification, and decision emails are sent
  synchronously within the request handler, identical to the invitation flow's existing approach.
- **Reuses the existing welcome email** (`sendWelcomeEmail`) verbatim for approved sign-ups per
  FR-009, rather than authoring a near-duplicate template.

*No Complexity Tracking entries required — every addition is the minimal structure the spec's
requirements demand, reusing existing patterns rather than introducing new abstractions.*

## Project Structure

### Documentation (this feature)

```text
specs/036-self-service-signup/
├── plan.md                          # This file
├── research.md                      # Phase 0 — token/expiry, blacklist-check, and admin-fan-out decisions
├── data-model.md                    # Phase 1 — SignupRequest entity + state machine
├── quickstart.md                    # Phase 1 — validation guide
├── contracts/
│   └── api-contracts.md             # Phase 1 — new endpoint contracts
├── checklists/
│   └── requirements.md              # Spec quality checklist (already produced)
└── tasks.md                         # Phase 2 — /speckit-tasks output (not yet created)
```

### Source Code Changes

```text
# Shared schemas/types (new + extended)
packages/shared/src/schemas/signup.ts          # NEW: SignupRequestSchema, CreateSignupRequestBodySchema, RejectSignupRequestBodySchema
packages/shared/src/types/signup.ts            # NEW: SignupRequestStatus enum
packages/shared/src/index.ts                   # MODIFIED: export new schemas/types

# Backend: data layer
packages/backend/src/db/schema.sql             # MODIFIED: add `signup_requests` table + unique email index
packages/backend/src/db/client.ts              # MODIFIED: migration; expired-UNVERIFIED sweep alongside existing invitation-sweep; add SignupRequestRow type

# Backend: services
packages/backend/src/services/signup-request.service.ts  # NEW: create/verify/list/approve/reject/delete, blacklist lookup across users+invitations+signup_requests, token+expiry logic (mirrors invitation.service.ts)
packages/backend/src/services/mailer.service.ts           # MODIFIED: add sendSignupVerificationEmail, sendAdminSignupNotificationEmail, sendSignupRejectionEmail; reuse existing sendWelcomeEmail for approval
packages/backend/src/services/user.service.ts             # MODIFIED: expose a create-from-verified-signup helper reusing the existing create() path
packages/backend/src/services/password.ts                 # UNCHANGED — reused as-is (hashPassword)

# Backend: routes & wiring
packages/backend/src/routes/signup.ts          # NEW: public POST /api/signup, public POST /api/signup/:token/verify, admin GET /api/signup-requests, admin POST /api/signup-requests/:token/approve, admin POST /api/signup-requests/:token/reject, admin DELETE /api/signup-requests/:token
packages/backend/src/server.ts                 # MODIFIED: register signupRoutes; add /api/signup and /api/signup/:token/verify to the auth hook's public-route allowlist; run signup-request sweep on startup

# Frontend
packages/frontend/src/pages/AuthPage.tsx              # MODIFIED: add 'sign-up' view alongside 'sign-in'/'forgot-password'
packages/frontend/src/pages/SignupVerifyConfirm.tsx   # NEW: public token-based verification landing page (parallel to EmailVerifyConfirm.tsx)
packages/frontend/src/pages/admin/AccountsAdmin.tsx   # MODIFIED: add a third "Sign-up requests" table (email, status, submitted date, approve/reject/delete actions; reject opens a reason prompt)
packages/frontend/src/hooks/useSignupRequests.ts      # NEW: submit/verify/list/approve/reject/delete mutations + queries
packages/frontend/src/services/signup.ts              # NEW: fetch wrappers for /api/signup* (mirrors services/invitations.ts / services/auth.ts)
packages/frontend/src/main.tsx                         # MODIFIED: add public `/sign-up` and `/signup/verify/:token` routes (outside RequireAuth)

# Tests
packages/backend/tests/integration/signup.route.test.ts        # NEW
packages/backend/tests/unit/signup-request.service.test.ts      # NEW
packages/backend/tests/unit/mailer.service.test.ts               # MODIFIED — add new template-method cases
packages/frontend/tests/e2e/signup-flow.spec.ts                  # NEW

# Documentation (per project CLAUDE.md requirements)
README.md / README.de.md                        # MODIFIED: document public sign-up + admin approval
docs/user-guide.md / docs/user-guide.de.md       # MODIFIED: document sign-up, verification, and admin approve/reject/blacklist behavior
```

**Structure Decision**: Web application layout (Option 2), unchanged from the existing monorepo
(`packages/backend`, `packages/frontend`, `packages/shared`). No new packages, services, or
dependencies — self-service sign-up is implemented as a sibling to the existing invitation flow
inside the same Fastify API, React SPA, and SQLite database.

## Implementation Approach

### 1. Data model: `signup_requests` table

One new table alongside `users`/`invitations`/`sessions` (see `data-model.md` for full DDL):
`token` (PK, random opaque string — same entropy/generation as invitation tokens), `email`
(`UNIQUE COLLATE NOCASE` — at most one live row per address, which is exactly the blacklist/
in-flight-request invariant the spec requires), `password_hash`/`password_salt`, `status`
(`UNVERIFIED`/`PENDING_REVIEW`/`REJECTED`), `verification_expires_at`, `rejection_reason`
(nullable), `created_at`, `verified_at` (nullable), `decided_at` (nullable). Expired `UNVERIFIED`
rows are swept on startup alongside the existing invitation sweep in `client.ts` (FR-016) —
freeing the address automatically, unlike a `REJECTED` row which persists until explicitly
deleted (FR-014).

### 2. Blacklist / duplicate check (the one genuinely new invariant)

`signup-request.service.ts#create()` rejects (FR-003) when the email already resolves to: an
active-or-archived user (`UserService.findByEmail`, already used by invitations), a `PENDING`
invitation, or any existing `signup_requests` row regardless of status (`UNVERIFIED`,
`PENDING_REVIEW`, or `REJECTED` — the `UNIQUE` constraint on `email` doubles as the enforcement
mechanism; the service layer turns the constraint violation into a typed, user-facing rejection
without leaking *why* per FR-015).

### 3. Verification and admin fan-out

A **public** route `POST /api/signup/:token/verify` (added to the auth hook's allowlist next to
`/api/invitations/:token/accept`) validates the token exactly like
`invitation.service.ts#validateToken` (not-found / already-used / expired), flips the row to
`PENDING_REVIEW`, sets `verified_at`, and — within the same handler — queries all
`role = 'ADMIN'` users and calls `mailer.sendAdminSignupNotificationEmail` for each, linking to
`/admin/accounts` (FR-006). Notification failures are logged but do not roll back verification
(the request is still validly in the review queue even if one admin's email bounces).

### 4. Admin decision: approve / reject / delete

- **Approve**: `signup-request.service.ts#approve(token, adminId)` re-validates the row is
  `PENDING_REVIEW`, creates the `users` row via the existing `UserService` creation path (reusing
  the request's already-hashed password — no re-hashing), deletes the `signup_requests` row in
  the same transaction, and the route calls the existing `mailer.sendWelcomeEmail` (FR-009,
  identical to the invitation-acceptance welcome email).
- **Reject**: sets `status = 'REJECTED'`, `rejection_reason`, `decided_at`; the route calls a new
  `mailer.sendSignupRejectionEmail(to, reason, locale)` (FR-011/FR-012). The row (and its
  blacklist effect) persists until deleted.
- **Delete**: removes the row unconditionally (pending, verified, or rejected), which — for a
  rejected row — is the only way to clear the blacklist (FR-014) since the `UNIQUE(email)`
  constraint is what enforces it.
- Concurrent double-decision (two admins acting on the same token) is handled the same way
  `invitation.service.ts` handles resend/cancel races: the service re-checks status inside the
  transaction and returns a `not-pending`-style outcome that the route turns into a 409, matching
  the Edge Cases note in the spec.

### 5. Frontend integration

- `AuthPage.tsx` gains a third `view` value, `'sign-up'`, reusing the existing
  `AuthImageLayout`/form-toggle pattern already built for `'sign-in'`/`'forgot-password'` — no new
  page-level layout component.
- `SignupVerifyConfirm.tsx` is a new public page at `/signup/verify/:token` (outside
  `RequireAuth`), structurally identical to `EmailVerifyConfirm.tsx`: loading → success/expired/
  not-found states, calling the new `verifySignup(token)` service function.
- `AccountsAdmin.tsx` gains a third table, "Sign-up requests" (email, status, submitted date,
  approve/reject/delete), positioned per the existing page's section ordering established in
  [028-admin-account-page-overhaul](../028-admin-account-page-overhaul/) (primary accounts table
  first; sign-ups and invitations as secondary sections). Reject opens a small reason-prompt
  (optional free-text) before submitting.

## Complexity Tracking

*No entries — Constitution Check raised no unjustified violations. Every addition reuses an
existing pattern (invitation lifecycle, mailer service, password hashing) rather than introducing
new infrastructure; see Technical Context and Principle III above.*
