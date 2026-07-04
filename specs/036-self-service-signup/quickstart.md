# Quickstart Validation Guide: Public Self-Service Sign-Up with Admin Approval

**Feature**: 036-self-service-signup
**Date**: 2026-07-04
**Validates**: All user stories and success criteria from [spec.md](spec.md)

---

## Prerequisites

- Repository checked out on the `036-self-service-signup` branch, with
  [014-email-invitations](../014-email-invitations/) and
  [028-admin-account-page-overhaul](../028-admin-account-page-overhaul/) already implemented
  (this feature adds a sibling intake channel and a third admin-page table), dependencies
  installed (`pnpm install`)
- Backend dev server running against a fresh or existing dev database (`pnpm dev`), with at
  least one administrator account already signed in for the review steps (cookie jar
  `jar-a.txt`, matching prior features' quickstart conventions)
- **Outbound email**: as in 014, point `SMTP_*` env vars at a local catch-all server, or rely on
  the fact that every scenario below extracts the `token` directly from the API response — a
  working SMTP setup is only required to see actual email rendering, not to walk the flow.

---

## Scenario 1 — Visitor submits a sign-up request (User Story 1, P1)

No session required (this endpoint is public):

```bash
curl -s -X POST http://localhost:3000/api/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"newsignup@example.test","password":"a-strong-passphrase-1"}'
```

**Expected**: `201` with a JSON body `{ token, email: "newsignup@example.test", status:
"UNVERIFIED", createdAt, verificationExpiresAt }`. If SMTP is configured, a verification email
arrives at that address containing a link (`http://<app>/signup/verify/<token>`).

```bash
# Resubmitting the same address before verification is rejected
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/signup \
  -H 'Content-Type: application/json' -d '{"email":"newsignup@example.test","password":"another-1"}'
```

**Expected**: second call returns `409` — no duplicate row is created.

**Validates**: FR-001, FR-002, FR-003, US1 scenarios 1–2, SC-001.

---

## Scenario 2 — Visitor verifies and every admin is notified (User Story 2, P1)

Using the `token` from Scenario 1:

```bash
curl -s -X POST http://localhost:3000/api/signup/<token>/verify
```

**Expected**: `200` with body `{ email: "newsignup@example.test", status: "PENDING_REVIEW" }`.
If SMTP is configured, every administrator account receives an email linking to
`/admin/accounts`.

```bash
# Re-using the same (now-verified) token is rejected
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/signup/<token>/verify
```

**Expected**: second call returns `410 Gone` ("already used").

**Validates**: FR-004, FR-005, FR-006, US2 scenarios 1–2, SC-002, SC-003.

---

## Scenario 3 — Administrator approves a verified sign-up (User Story 3, P1)

Signed in as the administrator:

```bash
curl -s -b jar-a.txt http://localhost:3000/api/signup-requests | grep -c '"email":"newsignup@example.test"'
```

**Expected**: prints `1`, with `"status":"PENDING_REVIEW"` visible in the listed request
(FR-007).

```bash
curl -s -i -b jar-a.txt -X POST http://localhost:3000/api/signup-requests/<token>/approve
```

**Expected**: `201` with body `{ id, email: "newsignup@example.test", displayName, role:
"MEMBER" }`; the new user receives a welcome email with a login link (same template as
invitation acceptance). A follow-up `GET /api/signup-requests` no longer lists this token
(FR-008), and:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"email":"newsignup@example.test","password":"a-strong-passphrase-1"}'
```

**Expected**: `200` — the approved user can sign in immediately with their originally-chosen
password.

**Validates**: FR-007, FR-008, FR-009, FR-010, US3 scenarios 1–3, SC-004, SC-006.

---

## Scenario 4 — Administrator rejects a sign-up and the address is blacklisted (User Story 4, P2)

Repeat Scenarios 1–2 with a second address, `rejected@example.test`, to obtain a fresh
`PENDING_REVIEW` token, then:

```bash
curl -s -b jar-a.txt -X POST http://localhost:3000/api/signup-requests/<token>/reject \
  -H 'Content-Type: application/json' -d '{"reason":"Could not verify identity"}'
```

**Expected**: `200` with body `{ token, email, status: "REJECTED", rejectionReason: "Could not
verify identity" }`; the requester receives a rejection email stating that reason.

```bash
# The address is now blocked from a fresh sign-up attempt
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/signup \
  -H 'Content-Type: application/json' -d '{"email":"rejected@example.test","password":"try-again-1"}'
```

**Expected**: `409` — the UI shows a generic error without revealing the rejection reason
(FR-015).

```bash
# Deleting the entry frees the address
curl -s -o /dev/null -w '%{http_code}\n' -b jar-a.txt -X DELETE http://localhost:3000/api/signup-requests/<token>

curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/signup \
  -H 'Content-Type: application/json' -d '{"email":"rejected@example.test","password":"try-again-1"}'
```

**Expected**: delete returns `204`; the follow-up sign-up now returns `201`.

**Validates**: FR-011, FR-012, FR-013, FR-014, FR-015, US4 scenarios 1–4, SC-005.

---

## Scenario 5 — Expired verification links are cleared automatically (Edge Cases / FR-016)

Using a pre-seeded `UNVERIFIED` row whose `verification_expires_at` has passed (see
`signup-request.service.test.ts` for the seeding pattern), restart the backend (or trigger the
sweep directly) and confirm:

```bash
curl -s -b jar-a.txt http://localhost:3000/api/signup-requests | grep -c '"email":"expired@example.test"'
```

**Expected**: prints `0` — the row was swept, and a fresh sign-up with that address now succeeds
without needing any admin action.

**Validates**: FR-016, Edge Cases ("expired-unverified requests are cleared automatically").

---

## Cleanup

```bash
pnpm --filter backend db:reset
```
