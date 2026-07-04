# Feature Specification: Public Self-Service Sign-Up with Admin Approval

**Feature Branch**: `036-self-service-signup`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "I would like to allow unauthenticated and public users to self-register at the platform by email and password. A public user can register via the welcome page 'sign up' and enters their email address and password. Email verification is required. After successful verification, all admins receive an email with a link to the user management page (admin/accounts). In the user management section, the admin sees a separate table listing sign-ups and actions. The admin can approve or reject users. If rejected, the email address remains blacklisted, and attempting to sign up again with the same address shows a UI error in the sign-up process by the public user. When rejecting a user, a reason can be specified, and the user receives a rejection email stating the reason. The email address is only available for another attempt once the admin deletes the registration entry. If accepted by the admin, the user receives a welcome email, like the one after the invitation and a link to login."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public visitor requests an account (Priority: P1)

An unauthenticated visitor on the welcome page selects "Sign up," enters an email address and a
password, and submits a sign-up request. They are told to check their email to verify the address
they provided.

**Why this priority**: This is the entry point of the whole feature — without a way to submit a
sign-up request, there is nothing for an admin to approve and nothing to verify. It must exist
before any other story is testable.

**Independent Test**: Can be fully tested by visiting the welcome page while signed out, choosing
"Sign up," submitting a new email address and password, and confirming the UI shows a
"check your email to verify" confirmation without granting any access yet.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor is on the welcome page, **When** they choose "Sign up" and
   submit a valid, previously-unused email address and a password, **Then** the system creates a
   pending sign-up request and shows a confirmation to check their email for a verification link.
2. **Given** a visitor submits the sign-up form, **When** the email address is already tied to an
   existing account (active, pending verification, or awaiting admin decision), **Then** the
   system shows a UI error and does not create a duplicate request.
3. **Given** a visitor submits the sign-up form, **When** the email address is blacklisted from a
   prior rejection, **Then** the system shows a UI error explaining the address cannot be used to
   sign up, without revealing the rejection reason.
4. **Given** a visitor submits the sign-up form, **When** the password does not meet the
   platform's minimum password requirements, **Then** the system shows a validation error and does
   not create a sign-up request.

---

### User Story 2 - Visitor verifies their email address (Priority: P1)

A visitor who submitted a sign-up request opens the verification link sent to their email address,
confirming that they control that address. The request then moves into an admin review queue.

**Why this priority**: Email verification is the gate that proves the address is real and
reachable before any admin ever needs to review it, and before the admin-facing notification is
sent. Equally foundational as Story 1 — sign-up without verification would let anyone type in an
inbox they don't own.

**Independent Test**: Can be fully tested by completing Story 1, opening the verification link
from the received email, and confirming the request status changes from "unverified" to
"awaiting admin approval" without requiring an admin to act yet.

**Acceptance Scenarios**:

1. **Given** a pending sign-up request has been created, **When** the visitor opens the
   verification link sent to their email, **Then** the request is marked verified and enters the
   admin approval queue.
2. **Given** a verification link has already been used, **When** it is opened again, **Then** the
   system shows a message that the link is no longer valid and does not re-trigger verification.
3. **Given** a verification link has expired, **When** the visitor opens it, **Then** the system
   shows a message that the link has expired and that they may sign up again once the address is
   no longer marked as pending.
4. **Given** a sign-up request becomes verified, **When** verification completes, **Then** every
   administrator account receives an email containing a link to the user management (admin
   accounts) page.

---

### User Story 3 - Admin reviews and approves a sign-up (Priority: P1)

An administrator opens the user management page, sees a distinct table of verified sign-up
requests awaiting a decision, and approves one. The requester becomes a full user account and
receives a welcome email with a link to log in.

**Why this priority**: Approval is what actually turns a request into a usable account — without
it, self-service sign-up produces no new users at all. It is the primary value delivered by the
feature to the admin.

**Independent Test**: Can be fully tested by completing Stories 1–2, opening the admin accounts
page as an administrator, approving the verified sign-up, and confirming a new user account is
created and a welcome email is received at the sign-up address.

**Acceptance Scenarios**:

1. **Given** an admin is on the user management page, **When** the page loads, **Then** a separate
   table lists sign-up requests (distinct from the existing accounts table) showing at least the
   email address, verification status, and submission date, with approve/reject actions.
2. **Given** a verified sign-up request is listed, **When** the admin approves it, **Then** a new
   user account is created using the submitted email and password, the request is removed from the
   pending sign-ups table, and the new user receives a welcome email containing a link to log in
   (equivalent in content/purpose to the existing invitation-acceptance welcome email).
3. **Given** an unverified sign-up request is listed, **When** the admin views the table, **Then**
   it is visibly distinguished as not yet verified and cannot be approved or rejected until
   verified.

---

### User Story 4 - Admin rejects a sign-up (Priority: P2)

An administrator declines a sign-up request, optionally stating a reason. The requester is
notified by email, and the email address is blocked from further sign-up attempts until an admin
explicitly clears it.

**Why this priority**: Rejection with blacklisting is necessary for admins to keep unwanted or
abusive sign-ups out, but the platform is still usable (approval-only) without it in an initial
cut — hence it ranks after the core approval path.

**Independent Test**: Can be fully tested by completing Stories 1–2, rejecting the verified
sign-up as an admin with a stated reason, confirming a rejection email with that reason is
received, and confirming a new sign-up attempt with the same address is blocked with a UI error.

**Acceptance Scenarios**:

1. **Given** a verified sign-up request is listed, **When** the admin rejects it and provides a
   reason, **Then** the requester receives a rejection email stating that reason, and the address
   is recorded as blacklisted.
2. **Given** an admin rejects a sign-up, **When** they submit the rejection without a reason,
   **Then** the system still records the rejection but the requester's email does not mention a
   reason (or states none was given).
3. **Given** an email address has been blacklisted by rejection, **When** a visitor attempts to
   sign up again with that address, **Then** the system shows a UI error preventing submission
   (per Story 1, Scenario 3).
4. **Given** a rejected sign-up entry still exists, **When** the admin deletes that entry from the
   user management page, **Then** the email address is no longer blacklisted and can be used to
   submit a new sign-up request.

---

### Edge Cases

- What happens when a visitor submits a sign-up, never verifies the email, and the verification
  link expires — can the same address be used to sign up again, or does it remain stuck? (See
  Assumptions: expired-unverified requests are cleared automatically and free up the address.)
- How does the system handle an admin approving or rejecting a sign-up request that another admin
  already acted on (e.g., two admins acting concurrently)? The second action should be rejected
  with a message that the request was already resolved.
- How does the system handle an admin deleting a still-pending (not yet approved/rejected)
  sign-up entry? This should be allowed and simply removes the request, freeing the email address
  without sending any email to the requester.
- What happens if the email address in a pending or rejected sign-up request matches an address
  later invited by an admin through the existing invitation flow, or vice versa? The system must
  treat the address as taken/blacklisted across both flows to avoid conflicting account creation.
- How is the sign-up flow surfaced to a visitor who is already signed in? Sign-up (like sign-in)
  is only reachable when signed out.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The welcome page MUST offer a "Sign up" entry point reachable by unauthenticated
  visitors.
- **FR-002**: The system MUST let a visitor submit a sign-up request consisting of an email
  address and a password, validated against the platform's existing password rules.
- **FR-003**: The system MUST reject a sign-up submission with a UI error, without creating a
  request, when the submitted email address already belongs to an active account, an existing
  invitation, a pending sign-up request (verified or not), or a blacklisted (previously rejected)
  address.
- **FR-004**: The system MUST send a verification email containing a unique, single-use link to
  the address submitted in a sign-up request.
- **FR-005**: The system MUST mark a sign-up request as verified when its verification link is
  opened, and MUST reject reuse of an already-used or expired verification link with a clear
  message.
- **FR-006**: The system MUST notify every administrator account by email, upon successful
  verification of a sign-up request, with a link to the user management (admin accounts) page.
- **FR-007**: The user management page MUST display a table of sign-up requests that is distinct
  from the existing accounts table, showing each request's email address, verification status,
  and submission date.
- **FR-008**: The system MUST allow an administrator to approve a verified sign-up request,
  which creates a new active user account from the submitted email and password and removes the
  request from the pending sign-ups table.
- **FR-009**: The system MUST send a welcome email — equivalent in content and purpose to the
  existing invitation-acceptance welcome email — to a newly approved user, containing a link to
  log in.
- **FR-010**: The system MUST prevent approval or rejection of a sign-up request that has not yet
  been verified.
- **FR-011**: The system MUST allow an administrator to reject a verified sign-up request and
  optionally specify a reason.
- **FR-012**: The system MUST send a rejection email to the requester stating the reason given by
  the administrator, or indicating that no reason was given.
- **FR-013**: The system MUST record a rejected sign-up's email address as blacklisted, blocking
  further sign-up attempts with that address (per FR-003), until the corresponding entry is
  deleted.
- **FR-014**: The system MUST allow an administrator to delete a sign-up entry (pending, verified,
  or rejected) from the user management page; deleting a rejected entry MUST clear its address's
  blacklisted status, making the address available for a new sign-up attempt.
- **FR-015**: The system MUST NOT expose the specific rejection reason to a visitor attempting to
  sign up again with a blacklisted address — only that the address cannot currently be used.
- **FR-016**: The system MUST automatically expire and clear sign-up requests whose verification
  link has not been used within the platform's standard link expiry window, freeing the email
  address for a new attempt.

### Key Entities

- **Sign-up Request**: A public registration attempt awaiting review. Attributes: submitted email
  address, hashed password, verification status (unverified / verified), verification link
  token and expiry, submission timestamp, and eventual outcome (pending / approved / rejected).
  Distinct from an admin-issued Invitation, though both consume the same email-address namespace.
- **Rejection Record / Blacklist Entry**: The retained state of a rejected sign-up request —
  email address, rejection reason (optional), and rejection timestamp — that blocks new sign-up
  attempts for that address until an administrator deletes it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can submit a sign-up request in under 1 minute from arriving at the
  welcome page.
- **SC-002**: 100% of sign-up verification emails are delivered and, once opened, move the
  request into the admin approval queue without further visitor action.
- **SC-003**: Every administrator account receives the review notification email within a few
  minutes of a sign-up being verified, with no manual polling required to discover new requests.
- **SC-004**: An administrator can approve or reject a verified sign-up in a single action from
  the user management page, without navigating to a separate screen.
- **SC-005**: 100% of rejected sign-up addresses are blocked from resubmission until explicitly
  cleared by an administrator deleting the entry.
- **SC-006**: 100% of approved sign-ups result in the new user receiving a working login link by
  email, matching the existing invitation welcome-email experience.

## Assumptions

- Password rules for sign-up reuse the platform's existing password policy (the same one applied
  to invited-user account setup); no new policy is introduced.
- Verification and invitation links share the platform's existing link-expiry window and
  single-use-token mechanism (as used by [014-email-invitations](../014-email-invitations/) and
  [021-forgot-password](../021-forgot-password/)).
- A sign-up request whose verification link expires unused is automatically cleared, freeing its
  email address for a fresh attempt — no admin action is required in that case (contrast with a
  rejected request, which requires explicit deletion).
- New self-registered users are created with the platform's standard non-admin role; granting
  admin rights remains a separate, existing administrative action outside this feature's scope.
- The "sign-ups" table on the user management page is additional to, not a replacement for, the
  existing accounts and invitations tables established by
  [028-admin-account-page-overhaul](../028-admin-account-page-overhaul/).
- Rejected/blacklisted entries persist indefinitely until an admin deletes them; there is no
  automatic expiry of a blacklist entry.
- Email content/branding for verification, admin-notification, rejection, and welcome emails
  follows the existing transactional email templates and styling used by
  [014-email-invitations](../014-email-invitations/) and
  [018-email-enhancements](../018-email-enhancements/).
