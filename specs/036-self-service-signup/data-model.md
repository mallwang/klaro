# Phase 1 Data Model: Public Self-Service Sign-Up with Admin Approval

## Entity: `SignupRequest`

Represents one public registration attempt, from submission through verification to an admin's
decision (or automatic expiry). Table: `signup_requests`.

| Column                   | Type      | Notes                                                                                     |
|--------------------------|-----------|--------------------------------------------------------------------------------------------|
| `token`                  | TEXT (PK) | Opaque random string (`randomBytes(32).toString('hex')`); also the verification-link value |
| `email`                  | TEXT      | `UNIQUE COLLATE NOCASE`, `length(email) <= 320` — at most one live row per address          |
| `password_hash`          | TEXT      | As produced by `hashPassword` (`password.ts`)                                              |
| `password_salt`          | TEXT      | As produced by `hashPassword`                                                              |
| `status`                 | TEXT      | `CHECK IN ('UNVERIFIED','PENDING_REVIEW','REJECTED')`, default `'UNVERIFIED'`               |
| `verification_expires_at`| TEXT      | ISO timestamp; verification link invalid after this instant                                |
| `rejection_reason`       | TEXT      | Nullable; free text supplied by the rejecting admin                                        |
| `created_at`             | TEXT      | ISO timestamp of submission                                                                 |
| `verified_at`            | TEXT      | Nullable; set when the visitor opens the verification link                                  |
| `decided_at`             | TEXT      | Nullable; set when an admin rejects (approval deletes the row instead of setting this)      |

```sql
CREATE TABLE IF NOT EXISTS signup_requests (
  token                    TEXT PRIMARY KEY,
  email                    TEXT NOT NULL CHECK(length(email) <= 320),
  password_hash            TEXT NOT NULL,
  password_salt            TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'UNVERIFIED'
                             CHECK(status IN ('UNVERIFIED','PENDING_REVIEW','REJECTED')),
  verification_expires_at  TEXT NOT NULL,
  rejection_reason         TEXT,
  created_at               TEXT NOT NULL,
  verified_at              TEXT,
  decided_at               TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signup_requests_email
  ON signup_requests(email COLLATE NOCASE);
```

### State Machine

```text
UNVERIFIED --(visitor opens verification link, not expired)--> PENDING_REVIEW
UNVERIFIED --(expiry sweep, link never opened)--> [row deleted]
PENDING_REVIEW --(admin approves)--> [users row created; row deleted]
PENDING_REVIEW --(admin rejects, with/without reason)--> REJECTED
REJECTED --(admin deletes entry)--> [row deleted; email freed]
{UNVERIFIED, PENDING_REVIEW, REJECTED} --(admin deletes entry)--> [row deleted]
```

Notes:

- There is no `APPROVED` terminal state: approval converts the request into a real `users` row
  and removes the `signup_requests` row in the same transaction (FR-008), so nothing needs to
  read an "approved" record afterward.
- `REJECTED` is the only state that persists indefinitely without further action — it is the
  blacklist itself (enforced via the `UNIQUE(email)` index remaining occupied until deletion).
- Deletion is a valid transition from every state (admins may also discard a request that was
  never reviewed, per spec Edge Cases), not only from `REJECTED`.

## Relationship to existing entities

- **`users`**: Approval creates a `users` row with the request's `email`/`password_hash`/
  `password_salt`, `role = 'MEMBER'` (default, per spec Assumptions), `status = 'ACTIVE'` —
  identical shape to accounts created via invitation acceptance.
- **`invitations`**: No foreign key between the two tables. The uniqueness/blacklist check at
  submission time (FR-003) queries `invitations` (for a `PENDING` row) as a pre-check, but the two
  tables are otherwise independent — an email can transition between the two flows over time as
  long as only one active claim on it exists at once.

## Validation Rules (from Functional Requirements)

- Email: valid email syntax; must not already resolve to an active/archived user, a pending
  invitation, or an existing `signup_requests` row of any status (FR-003).
- Password: must satisfy the platform's existing password policy (same as invitation acceptance;
  see Assumptions in `spec.md`).
- Verification link: single-use (transition out of `UNVERIFIED` is one-way) and time-limited
  (`verification_expires_at`); expired-and-unused rows are swept automatically (FR-016).
- Rejection reason: optional; when absent, the rejection email states none was given (FR-012).
- Approval/rejection: only valid when `status = 'PENDING_REVIEW'` (FR-010) — never on
  `UNVERIFIED` or already-`REJECTED` rows.
