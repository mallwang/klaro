# Feature Specification: Email Enhancements

**Feature Branch**: `018-email-enhancements`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I would like to enhance the email functionality to add a test email function for admins, and send a confirmation email to invited users (after successful invitation) and email change (after successful email change to new email)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Admin sends a test email to verify SMTP configuration (Priority: P1)

An administrator who has configured the application's email settings wants to confirm that the
configuration is working before relying on it for real transactional emails. They trigger a test
email from within the admin area, and the system sends a sample email to a specified address.
The administrator can see immediately whether the email was delivered or whether there was an
error.

**Why this priority**: Without working email delivery, both invitations and email-change
confirmations silently fail. Providing a test action lets admins diagnose SMTP problems before
they affect real users. This is the foundation that makes the other two enhancements trustworthy.

**Independent Test**: Can be fully tested by navigating to the admin email settings area,
entering a recipient address, triggering the test send, and confirming an email arrives (or an
error is shown) — entirely independent of invitation or email-change flows.

**Acceptance Scenarios**:

1. **Given** an administrator is signed in and visits the email settings area, **When** they
   enter a recipient address and trigger a test email, **Then** the system attempts to send a
   clearly labelled test message to that address and shows the administrator a success
   confirmation in the UI.
2. **Given** an administrator triggers a test email but the SMTP configuration is invalid or
   unreachable, **When** the send attempt fails, **Then** the administrator sees a clear error
   message in the UI describing the failure (not a generic "something went wrong"), so they know
   where to look.
3. **Given** an administrator leaves the recipient field empty, **When** they attempt to trigger
   the test, **Then** the form prevents submission and shows a validation error before any
   network request is made.
4. **Given** a non-admin user, **When** they attempt to access the test-email function (e.g., by
   navigating directly), **Then** the action is rejected and they are shown an access-denied
   response.

---

### User Story 2 — Invited user receives a welcome confirmation email after completing account setup (Priority: P2)

After an invited family member clicks the invitation link, sets a password, and their account
becomes active, the system automatically sends them a welcome email to the address they were
invited with. This email confirms their account is ready and serves as a receipt of the
onboarding action.

**Why this priority**: The invitation email contains an action link; once that action is
complete the link is no longer valid. A post-setup confirmation email gives the user a durable
record that their account is active and lets them know sign-in will work going forward. It is a
secondary quality-of-life improvement that builds on the existing invitation flow.

**Independent Test**: Can be fully tested end-to-end by completing an invitation acceptance
(using a real or seeded invitation token), and then confirming a welcome email arrives at the
invited address — independent of the test-email feature or email-change flow.

**Acceptance Scenarios**:

1. **Given** an invitee has clicked a valid invitation link and successfully set a password,
   **When** their account is activated, **Then** the system sends a welcome confirmation email
   to the address the invitation was originally sent to.
2. **Given** the welcome confirmation email is sent, **Then** it clearly states that the account
   is now active and tells the user how to sign in.
3. **Given** the SMTP service is temporarily unavailable at the moment of account activation,
   **When** the welcome email cannot be sent, **Then** the account activation still succeeds and
   the error is logged — the invitee is not shown a failure just because the confirmation email
   failed.

---

### User Story 3 — User receives a confirmation email after a successful email address change (Priority: P2)

After a user clicks the verification link in their email-change request and their account email
is updated, the system sends a brief confirmation to the newly active email address. This
confirmation serves as a record of the change and alerts the user in case the change was not
made by them.

**Why this priority**: The existing flow already sends a verification link to the new address.
A post-confirmation email closes the loop, giving the user an auditable record that the change
completed. It also provides a timely security signal if the change was triggered by someone
else.

**Independent Test**: Can be fully tested by initiating and completing an email-change flow
(initiate change, click the verification link, confirm the account email is updated), and then
checking that a separate confirmation email arrives at the new address — without depending on
the invitation or test-email stories.

**Acceptance Scenarios**:

1. **Given** a user has clicked a valid email-change verification link and their account email
   has been updated, **When** the change completes, **Then** the system sends a confirmation
   email to the newly updated address.
2. **Given** the confirmation email is sent, **Then** it clearly states that the email address
   on the account was changed and includes the date of the change.
3. **Given** the SMTP service is temporarily unavailable at the moment the change completes,
   **When** the confirmation email cannot be sent, **Then** the email-address change still
   succeeds and the error is logged — the user is not shown a failure just because the
   confirmation email failed.

---

### Edge Cases

- What happens when the admin test email is sent to a malformed address?
  The system validates the format before attempting delivery and shows an inline validation
  error without making a network request.
- What happens if the invitee's email address becomes undeliverable between invitation and
  account activation?
  The welcome email send fails silently (logged), and account activation proceeds normally.
- What happens if a user changes their email address multiple times quickly and the earlier
  verification links are superseded?
  Only the most recent confirmation email (for the link that was actually clicked and
  processed) is sent; superseded flows produce no emails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an admin-only action to send a test email to a specified
  address in order to verify that SMTP delivery is operational.
- **FR-002**: The test email recipient address MUST be validated before any send attempt is
  made, and the UI MUST show an inline validation error for invalid formats.
- **FR-003**: The system MUST show a clear success or failure message to the administrator
  immediately after the test email attempt completes.
- **FR-004**: The test email action MUST be restricted to users with the administrator role;
  non-admins MUST receive an access-denied response.
- **FR-005**: The system MUST send a welcome confirmation email to the invitee's address
  immediately after their account is activated via an accepted invitation.
- **FR-006**: If the welcome confirmation email fails to send, the system MUST still complete
  the account activation and MUST log the delivery failure; no failure is surfaced to the
  invitee.
- **FR-007**: The system MUST send a confirmation email to the user's newly updated address
  immediately after a successful email-address change is confirmed via the verification link.
- **FR-008**: If the post-email-change confirmation email fails to send, the system MUST still
  complete the email-address update and MUST log the delivery failure; no failure is surfaced
  to the user.
- **FR-009**: All three email types (test, welcome, email-change confirmation) MUST clearly
  identify the application and include the date/time relevant to the action.

### Key Entities

- **Test Email Action**: An admin-initiated, ephemeral request containing a recipient address;
  no persistent record is required beyond the success/failure response.
- **Welcome Confirmation Email**: A transactional email sent once per invitation acceptance,
  linked to the invitee's address at the moment of account activation.
- **Email-Change Confirmation Email**: A transactional email sent once per successful
  email-change confirmation, addressed to the user's new (now active) email address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can complete the test-email flow (fill form, trigger send, see
  result) in under 30 seconds with no external documentation needed.
- **SC-002**: 100% of successfully activated invitation accounts trigger a welcome confirmation
  email send attempt; delivery failures are captured in application logs within the same
  request.
- **SC-003**: 100% of successfully confirmed email-address changes trigger a confirmation email
  send attempt to the new address; delivery failures are captured in application logs within
  the same request.
- **SC-004**: A failed SMTP delivery for welcome or confirmation emails never blocks or rolls
  back the underlying account or data change — the operation succeeds in all cases where the
  core action (activation or email update) succeeds.
- **SC-005**: The test email action is inaccessible to non-admin users; any attempt by a
  non-admin is rejected without leaking admin-only information.

## Assumptions

- The SMTP infrastructure is already configured via environment variables (`SMTP_HOST`,
  `SMTP_FROM`, etc.); this feature does not add SMTP settings management or a UI for changing
  those variables.
- The test email recipient defaults to the signed-in admin's own email address as a pre-filled
  suggestion, but can be overridden to any valid address.
- The welcome and confirmation emails are simple, text-based transactional messages; no
  rich HTML template engine or marketing-style layout is required.
- The existing email-change and invitation flows are already functional (implemented in
  features 014 and 017); this feature extends them with post-completion emails only.
- Email send failures are considered non-critical and are handled by fire-and-forget semantics
  (log and continue), consistent with how the application already treats SMTP errors in other
  transactional flows.
