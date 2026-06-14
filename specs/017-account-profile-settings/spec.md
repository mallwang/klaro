# Feature Specification: Account Profile Settings

**Feature Branch**: `017-account-profile-settings`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I would like to have a way to change the account email address and user name from the user account settings. This should be possible for both the admin and normal users. Additionally, the users name and role should be displayed at the bottom left with a user icon (similar like the one from the user management). E-Mails for verification of the new email must be used."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Update Display Name (Priority: P1)

Any authenticated user (admin or member) navigates to their account settings page and changes their display name. The change is reflected immediately throughout the application.

**Why this priority**: Display name changes are the simplest profile update, have no security implications requiring verification, and are needed by all user types.

**Independent Test**: Can be fully tested by navigating to account settings, entering a new display name, saving, and confirming the name updates in the sidebar and elsewhere in the app.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the account settings page, **When** they enter a new display name and submit the form, **Then** the display name is updated and the sidebar immediately reflects the new name.
2. **Given** a logged-in user, **When** they submit an empty display name, **Then** the form rejects the submission with a validation error message.
3. **Given** a logged-in user, **When** they submit a display name that is too long (>100 characters), **Then** the form rejects the submission with a clear error.

---

### User Story 2 — Display User Info in Sidebar (Priority: P1)

The bottom-left corner of the application sidebar permanently shows the current user's display name and role (Admin / Member) with a user avatar icon, regardless of which page the user is on.

**Why this priority**: This is a UI presence requirement that establishes user identity context across all screens. It shares priority with display name editing because both are needed for a coherent "profile" experience.

**Independent Test**: Can be tested by signing in, observing the sidebar footer contains the user's name, role label, and an avatar/user icon — without navigating anywhere else.

**Acceptance Scenarios**:

1. **Given** any authenticated user on any page, **When** the sidebar is visible, **Then** the bottom-left shows a user icon, the user's display name, and their role (e.g., "Admin" or "Member").
2. **Given** a user whose display name was just updated, **When** the user returns to any page, **Then** the sidebar reflects the updated display name.
3. **Given** an admin user, **When** the sidebar footer is shown, **Then** the role label reads "Admin"; for a member it reads "Member".

---

### User Story 3 — Request Email Address Change (Priority: P2)

Any authenticated user initiates an email address change from account settings. They are informed that a verification email will be sent to the new address before the change takes effect.

**Why this priority**: Email changes require a multi-step verification flow, making them more complex than display name changes. However, users must be able to keep their account email current.

**Independent Test**: Can be fully tested by entering a new email address in account settings, submitting, receiving the verification email, and confirming the in-app message explains that verification is pending.

**Acceptance Scenarios**:

1. **Given** a logged-in user on account settings, **When** they enter a new valid email address and submit, **Then** a verification email is sent to the new address and the UI shows a "check your email" confirmation message.
2. **Given** a logged-in user, **When** they enter an email address already used by another account, **Then** the request is rejected with a conflict message.
3. **Given** a logged-in user, **When** they enter an invalid email format and submit, **Then** the form rejects the submission with a validation error before any email is sent.
4. **Given** a logged-in user who submitted an email change request, **When** they close the settings page and return, **Then** they can see that a pending email change is awaiting verification.

---

### User Story 4 — Confirm Email Address Change via Verification Link (Priority: P2)

The user receives a verification email at their new address. Clicking the link in the email confirms the change and updates their account email.

**Why this priority**: This is the completion step of User Story 3 — without it, email changes cannot actually take effect.

**Independent Test**: Can be tested end-to-end: initiate email change, simulate receiving the verification email (or inspect the token), visit the verification link, and confirm the account email is updated.

**Acceptance Scenarios**:

1. **Given** a user with a pending email change, **When** they click the verification link in the email, **Then** their account email is updated and they are shown a success confirmation.
2. **Given** a user clicking a verification link that has expired (older than 24 hours), **Then** they are shown a clear error explaining the link has expired, with an option to request a new one.
3. **Given** a user clicking a verification link that has already been used, **Then** they are shown a message that the change was already completed.
4. **Given** a user with a pending email change who initiates another change request, **When** they click the link from the first request, **Then** the first link is invalid (superseded by the newer request).

---

### Edge Cases

- What happens when the user is signed out of their session during a pending email change? The verification link must still work when clicked, signing them in or prompting sign-in first.
- How does the system handle a user who changes their email to an address they previously owned and then re-requests the same change?
- What happens if the new email belongs to an archived account?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All authenticated users (admin and member roles) MUST be able to access an account settings page where they can update their profile.
- **FR-002**: Users MUST be able to update their display name from the account settings page.
- **FR-003**: The system MUST validate that display names are not empty and do not exceed 100 characters.
- **FR-004**: Users MUST be able to initiate an email address change from the account settings page.
- **FR-005**: The system MUST send a verification email to the new address when an email change is requested; the current email address MUST remain active until verification is complete.
- **FR-006**: The verification link sent by email MUST expire after 24 hours.
- **FR-007**: Clicking a valid, unexpired verification link MUST update the user's email address and invalidate any other pending email-change tokens for that account.
- **FR-008**: The system MUST reject email change requests where the new address is already in use by another active account.
- **FR-009**: The sidebar MUST display a user avatar icon, the current user's display name, and their role label at the bottom-left on every authenticated page.
- **FR-010**: The sidebar user info MUST update immediately when the display name is changed without requiring a page reload.
- **FR-011**: The system MUST allow only one pending email change per user at a time; submitting a new email change request supersedes any previous pending request.

### Key Entities

- **User**: Existing entity extended with an optional `pendingEmail` field (the unverified new address) and a `emailVerificationToken` with an expiry timestamp.
- **EmailVerificationToken**: Represents a pending email change: references the user, stores the proposed new email, a secure token, and an expiry time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can update their display name in under 30 seconds from opening account settings.
- **SC-002**: Users can initiate an email change request in under 60 seconds and receive a confirmation in the UI that a verification email was sent.
- **SC-003**: The verification email is delivered within 2 minutes under normal conditions.
- **SC-004**: 100% of verification links older than 24 hours are rejected with a clear expiry message.
- **SC-005**: The sidebar user info (name, role, avatar) is visible on every authenticated page without additional navigation.
- **SC-006**: Email change requests referencing an already-used email address are rejected with a user-friendly conflict message 100% of the time.

## Assumptions

- The existing application already has a working email delivery system (used for invitation emails); this feature reuses the same infrastructure.
- Account settings is a new dedicated page/route, separate from the admin-only user management screen.
- The sidebar user info block is added to the existing left navigation sidebar that already exists in the app shell.
- Display name changes take effect immediately without any verification step.
- Verification links are accessed via a dedicated URL route in the application; the user does not need to be signed in when clicking the link (they may be prompted to sign in first if no active session exists).
- The role displayed in the sidebar is the user's current role and is not editable from the account settings page (role management remains an admin-only function in user management).
- Users cannot change their own role from account settings.
