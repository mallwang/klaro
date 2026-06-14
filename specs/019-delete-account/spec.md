# Feature Specification: Delete Account

**Feature Branch**: `019-delete-account`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I would like to add a delete account functionality, where users can delete their account. They should see a dialog/modal and are strongly advised to download their contracts as JSON, but can skip this and directly delete the account. It should be in kind of a 'danger zone' form of the account settings page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Account with Data Export Warning (Priority: P1)

A logged-in user navigates to the Account Settings page and finds a clearly marked "Danger Zone" section at the bottom. They click "Delete Account", which opens a confirmation dialog. The dialog prominently advises them to download their contracts as JSON before proceeding and provides a download button. The user can either download their data first or skip the export and proceed directly to permanently delete their account.

**Why this priority**: This is the core feature — the full deletion flow with the safety-first UX. Without this, the feature does not exist.

**Independent Test**: Can be fully tested by navigating to account settings, triggering the danger zone dialog, and verifying the export advisory and deletion flow end-to-end.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Account Settings page, **When** they scroll to the bottom, **Then** they see a visually distinct "Danger Zone" section containing a "Delete Account" button.
2. **Given** a user who clicks "Delete Account", **When** the dialog opens, **Then** it prominently displays a warning advising the user to download their contracts as JSON before deleting.
3. **Given** a user viewing the deletion dialog, **When** they click "Download contracts as JSON", **Then** a JSON file containing all their contracts is downloaded to their device.
4. **Given** a user viewing the deletion dialog, **When** they choose to skip the export, **Then** they can still proceed to the deletion confirmation step.
5. **Given** a user who confirms deletion, **When** the deletion completes, **Then** their account and all associated contract data are permanently removed, they are logged out, and redirected to the sign-in page.

---

### User Story 2 - Explicit Deletion Confirmation (Priority: P2)

Before the account is actually deleted, the user must explicitly confirm their intent through an unambiguous action (such as clicking a clearly labeled "Permanently Delete My Account" button), preventing accidental deletions.

**Why this priority**: Safety gate — ensures the user consciously commits to an irreversible action.

**Independent Test**: Can be tested by verifying that reaching the final confirmation step requires deliberate user action and that the action is clearly labeled as permanent and irreversible.

**Acceptance Scenarios**:

1. **Given** a user in the deletion dialog after the export step, **When** they view the confirmation, **Then** they see a final confirmation button labeled to make clear the action is permanent and cannot be undone.
2. **Given** a user who clicks the confirmation button, **When** deletion proceeds, **Then** the dialog shows a loading/progress state so the user knows the operation is in progress.
3. **Given** a user at any point in the dialog, **When** they click "Cancel" or dismiss the dialog, **Then** no deletion occurs and they return to the Account Settings page unchanged.

---

### User Story 3 - Admin Account Protection (Priority: P3)

A user who is the sole administrator of the system cannot delete their account. The system prevents this to avoid leaving the application without any administrator. The user must first promote another account to administrator before they can delete their own.

**Why this priority**: Edge case relevant to system integrity, but does not block the core deletion flow.

**Independent Test**: Can be tested by attempting to delete the sole admin account and verifying the system blocks the action with a clear explanation.

**Acceptance Scenarios**:

1. **Given** a user who is the only administrator, **When** they open the deletion dialog, **Then** the final confirmation step is disabled and a clear message explains they must promote another user to admin first.
2. **Given** a sole admin user who has since promoted another user to admin, **When** they open the deletion dialog, **Then** the confirmation step is available and deletion can proceed normally.

---

### Edge Cases

- What happens when the JSON export download fails? The user should be able to retry or proceed without exporting.
- What if the account has no contracts? The dialog still appears, but the export advisory notes there is nothing to download (or the download button is omitted).
- What if the deletion request fails (e.g., server error)? The user sees an error message and the account is not deleted.
- What if the user closes the browser mid-deletion? The system must ensure the account is either fully deleted or not deleted at all — no partial state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Account Settings page MUST contain a visually distinct "Danger Zone" section, clearly separated from other settings.
- **FR-002**: The Danger Zone section MUST contain a "Delete Account" button.
- **FR-003**: Clicking "Delete Account" MUST open a modal dialog — the account must NOT be deleted without the dialog flow completing.
- **FR-004**: The dialog MUST prominently advise the user to download their contracts as JSON before proceeding, including a clear explanation that deletion is permanent and irreversible.
- **FR-005**: The dialog MUST provide a "Download contracts as JSON" action that exports all of the user's contracts in JSON format.
- **FR-006**: The user MUST be able to skip the export step and proceed directly to deletion confirmation.
- **FR-007**: The final deletion step MUST require an explicit user confirmation action (e.g., a clearly labeled confirmation button).
- **FR-008**: Upon successful account deletion, ALL of the user's data (account, contracts, and associated records) MUST be permanently removed.
- **FR-009**: Upon successful deletion, the user MUST be automatically signed out and redirected to the sign-in page.
- **FR-010**: If an error occurs during deletion, the user MUST see a clear error message and the account MUST remain intact.
- **FR-011**: The dialog MUST be dismissible at any point before the final confirmation, with no changes to the account.
- **FR-012**: If the user is the sole administrator, the system MUST prevent account deletion and display a clear message instructing them to promote another user to administrator first.

### Key Entities

- **User Account**: The authenticated user's account record, including credentials and profile data.
- **Contracts**: All contract records owned by the user, which are included in the JSON export and deleted upon account removal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate, confirm, and complete account deletion in under 2 minutes from the Account Settings page.
- **SC-002**: 100% of account deletions result in complete removal of the user's data — no orphaned records remain.
- **SC-003**: Users who accidentally open the deletion dialog can dismiss it without any consequences 100% of the time.
- **SC-004**: The JSON export contains all of the user's contracts in a format consistent with the existing export feature.
- **SC-005**: Users see clear, unambiguous feedback at every step of the deletion flow (advisory, confirmation, progress, success/error).

## Assumptions

- The JSON export format for contracts is the same as the one already implemented in the existing export/import feature (feature 011).
- The "Danger Zone" section is at the bottom of the existing Account Settings page (feature 017), not a separate page.
- No email confirmation is required before deletion — the in-dialog confirmation button is sufficient.
- Deletion is immediate and permanent with no grace period or recovery option, consistent with the personal-use nature of the application.
- The feature applies to all user roles; sole administrators are blocked from deletion until another admin exists (see FR-012).
- The download triggers a browser file download; no cloud storage or email delivery is involved.
