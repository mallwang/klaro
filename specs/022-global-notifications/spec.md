# Feature Specification: Global Notification System

**Feature Branch**: `022-global-notifications`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I would like to add a global notification system as described in https://mantine.dev/x/notifications/. The goal is to show both errors (from the API) and any successful action should be shown as notification (auto close after 5 seconds). This also includes the current DOM elements, e.g. for the manage accounts actions, the contract actions or for the account settings. The only inline DOM elements that are fine are for public pages like invitation accept or password reset, there no notifications should be used."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Success Actions Show Toast Notifications (Priority: P1)

When a user completes a successful action (e.g., saving account settings, deleting a
contract, inviting a new user), a toast notification appears in the top-right corner of the
screen confirming the action was successful. The notification auto-dismisses after 5 seconds
without requiring any user interaction.

**Why this priority**: This is the primary UX improvement — replacing scattered inline success
messages with a consistent, non-intrusive confirmation pattern that does not disrupt the user's
current view or require scrolling to see the result.

**Independent Test**: Can be fully tested by performing any successful action in the
authenticated area (e.g., saving a password change in Account Settings) and observing a
toast notification appearing and disappearing after 5 seconds.

**Acceptance Scenarios**:

1. **Given** a user saves a new password in Account Settings, **When** the save succeeds, **Then** a green success toast notification appears, contains a meaningful message, and auto-closes after 5 seconds.
2. **Given** a user deletes a contract, **When** the deletion succeeds, **Then** a success toast appears and the contract list updates without an inline message.
3. **Given** an admin invites a new user, **When** the invitation is sent successfully, **Then** a success toast appears and the invitation form clears.
4. **Given** a success toast is visible, **When** 5 seconds elapse, **Then** the toast dismisses automatically without user interaction.
5. **Given** a success toast is visible, **When** the user clicks the close button on the toast, **Then** the toast dismisses immediately.

---

### User Story 2 - API Errors Show Toast Notifications (Priority: P1)

When an action fails due to an API or server error (e.g., network failure, conflict, server
unavailable), a toast notification appears in the top-right corner with a clear error message.
The error toast auto-dismisses after 5 seconds.

**Why this priority**: Equally important to success notifications — users currently need to
scroll to find inline error alerts. A consistent toast for errors ensures visibility regardless
of scroll position or modal state.

**Independent Test**: Can be fully tested by triggering an API error (e.g., attempting to
invite an already-existing email address) and confirming an error toast appears instead of an
inline alert.

**Acceptance Scenarios**:

1. **Given** an admin invites a user with an already-registered email, **When** the API returns a 409 conflict, **Then** a red error toast appears with a descriptive message (e.g., "User already exists").
2. **Given** a user attempts to change their email but the mail server is unavailable, **When** the API returns a 502 error, **Then** a red error toast appears indicating the email could not be sent.
3. **Given** a contract delete fails due to a server error, **When** the error is received, **Then** a red error toast appears in place of an inline alert.
4. **Given** multiple errors occur in quick succession, **When** each fails, **Then** each error is shown as a separate toast notification stacked visually.

---

### User Story 3 - Public Pages Retain Inline Feedback (Priority: P2)

Pages accessible without authentication (Accept Invitation, Reset Password, Forgot Password,
Email Verify Confirm) continue to show inline feedback messages rather than toast
notifications. This maintains appropriate UX for flows where the user may not have an
established app shell context.

**Why this priority**: These pages have a different UX context (minimal shell, no navigation)
where inline feedback is more appropriate and prominent. Ensuring they are explicitly excluded
prevents regressions.

**Independent Test**: Can be fully tested by visiting the password reset page, entering an
invalid token, and verifying the error appears inline below the form (not as a toast).

**Acceptance Scenarios**:

1. **Given** a user visits the Reset Password page and submits an expired token, **When** the API rejects it, **Then** an inline error message appears on the page (no toast notification).
2. **Given** a user visits the Accept Invitation page and the invitation has expired, **When** the page loads, **Then** an inline error message is shown (no toast notification).
3. **Given** a user visits the Forgot Password page and submits, **When** the action succeeds, **Then** an inline confirmation message appears (no toast notification).
4. **Given** a user visits the Email Verify Confirm page, **When** an error occurs, **Then** the error appears inline (no toast notification).

---

### User Story 4 - Notification System Available Globally (Priority: P1)

The notification infrastructure is set up once at the application root level so that any
part of the authenticated application can trigger a notification without each page or
component managing its own feedback state.

**Why this priority**: Without a global provider, each page must independently manage
success/error state — the current root cause of the scattered inline-alert pattern. A global
setup eliminates that pattern at the source.

**Independent Test**: Can be tested by navigating between different pages (Contract List →
Account Settings → Admin Accounts) and verifying that triggering actions on each page produces
consistent toast notifications in the same position.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** any authenticated page triggers a success notification, **Then** the toast appears in a consistent position (top-right) regardless of which page triggered it.
2. **Given** a notification is triggered from within a modal dialog, **When** the notification appears, **Then** it is visible above the modal overlay.

---

### Edge Cases

- What happens when multiple notifications are triggered simultaneously? They stack visually without overlapping.
- What happens when a notification is triggered and the user navigates to a different page before it auto-closes? The notification remains visible during the transition and auto-closes normally.
- What happens when the page has no app shell (public pages)? The notification provider is not active; public pages use their own inline feedback.
- What happens if an action produces both an error and a success (e.g., partial import)? Both notifications can appear; the ImportResultSummary component has its own inline summary and may retain it for detailed results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST integrate a notification package that supports toast-style, auto-dismissing notifications.
- **FR-002**: The notification provider MUST be mounted at the application root level so all authenticated pages can trigger notifications.
- **FR-003**: All success feedback on authenticated pages MUST be delivered via toast notifications, not inline DOM elements.
- **FR-004**: All API error feedback on authenticated pages MUST be delivered via toast notifications, not inline DOM elements.
- **FR-005**: Success notifications MUST auto-dismiss after 5 seconds.
- **FR-006**: Error notifications MUST auto-dismiss after 5 seconds.
- **FR-007**: Users MUST be able to manually dismiss any notification before auto-close.
- **FR-008**: The following pages and components MUST be migrated from inline alerts to toast notifications:
  - Account Settings (password change success/error, email change success/error)
  - Accounts Admin (invite user success/error, resend invitation success/error, archive/reactivate/delete account errors)
  - Contract List (delete contract success/error, load error)
  - Contract Form (save/submit errors)
  - Contract New (create success)
  - Contract Edit (update success)
  - Delete Account Modal (error states)
  - Contract Import (import error — the detailed result summary component may retain its inline summary)
- **FR-009**: The following pages MUST retain their existing inline feedback and MUST NOT use toast notifications:
  - Accept Invitation (`/accept-invitation`)
  - Reset Password (`/reset-password`)
  - Forgot Password (`/forgot-password`)
  - Email Verify Confirm (`/verify-email`)
- **FR-010**: Notifications MUST be visually distinct by type: success (green) and error (red).
- **FR-011**: Multiple simultaneous notifications MUST stack visually without hiding each other.
- **FR-012**: Notifications triggered from within modals MUST be visible above the modal overlay.

### Key Entities

- **Notification**: A transient UI message with a type (success/error), a message text, and an auto-close duration of 5 seconds.
- **Notification Provider**: A global application-level component that manages the notification queue and renders the notification container.
- **Authenticated Page**: Any page rendered within the application shell requiring a logged-in session (as opposed to public pages).
- **Public Page**: A page accessible without authentication — Accept Invitation, Reset Password, Forgot Password, Email Verify Confirm. These retain inline feedback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero inline `<Alert>` components remain on authenticated pages for success or API error feedback after migration.
- **SC-002**: All authenticated-page success and error feedback appears as toast notifications within 200 ms of the triggering action completing.
- **SC-003**: All toast notifications auto-dismiss within 5 seconds (±200 ms) without user interaction.
- **SC-004**: All four public pages (Accept Invitation, Reset Password, Forgot Password, Email Verify Confirm) retain inline feedback and produce no toast notifications.
- **SC-005**: Triggering three rapid successive actions each produce a visible, independently dismissible toast notification.

## Assumptions

- `@mantine/notifications` (the official Mantine notifications package) will be added as a new dependency — it is not currently installed.
- The Mantine version constraint is `^7.x` to match the existing `@mantine/core` version.
- The notification position is top-right, consistent with standard web app conventions.
- The `ImportResultSummary` component provides a detailed multi-line result breakdown that cannot be conveyed in a single toast; it retains its inline display. Only top-level import errors (not the summary) should use a toast if applicable.
- The `SignIn` page is a public-facing page and retains its existing inline error display (no toast).
- Contract load errors (when the contract list fails to fetch) are shown as a toast notification since the user is authenticated and in the app shell.
- Existing i18n (translation) keys for error and success messages will be reused; no new translation keys are required unless a message is new.
