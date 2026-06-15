# Feature Specification: Account Settings Page Restructure

**Feature Branch**: `025-settings-page-restructure`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "I would like to restructure the account settings page and divide the parts into logical parts - one for email settings (with summary email and email language) and one for the account (name change, email change, password change, delete account)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Email Settings Section (Priority: P1)

A user opens Account Settings and immediately sees a clearly labelled "Email Settings" section
containing the summary email toggle/frequency controls and the email language selector. Both
controls are grouped visually and the section heading makes their shared purpose obvious.

**Why this priority**: This is the primary restructuring goal. The grouping gives email-related
preferences a single home and reduces cognitive load.

**Independent Test**: Open Account Settings and verify that a visible "Email Settings" heading
exists, that the summary email and email language controls appear beneath it, and that no
account-management controls appear in that section.

**Acceptance Scenarios**:

1. **Given** a signed-in user is on Account Settings, **When** the page loads, **Then** a
   section labelled "Email Settings" (or equivalent translated label) is visible and contains
   the summary email toggle and the email language selector.
2. **Given** the Email Settings section is visible, **When** the user interacts with either
   control and saves, **Then** the preference is persisted and a success notification appears,
   exactly as before the restructuring.

---

### User Story 2 - Navigate Account Section (Priority: P1)

A user opens Account Settings and sees a clearly labelled "Account" section containing display
name change, email address change, password change, and account deletion — all grouped
together as account-management actions.

**Why this priority**: This is the other half of the restructuring goal. Grouping identity and
security settings together matches user mental models ("I want to change something about my
account").

**Independent Test**: Open Account Settings and verify that a visible "Account" heading exists,
that name/email/password/delete controls appear beneath it, and that no email preference
controls appear in that section.

**Acceptance Scenarios**:

1. **Given** a signed-in user is on Account Settings, **When** the page loads, **Then** a
   section labelled "Account" (or equivalent translated label) is visible and contains the
   display name form, email change form, password change form, and danger zone.
2. **Given** the Account section is visible, **When** the user performs any action (rename,
   change email, change password, delete account), **Then** the action behaves identically
   to the pre-restructure behaviour including all guards (sole-admin block, pending email
   notice, confirmation modal).

---

### User Story 3 - Page Retains All Existing Functionality (Priority: P2)

No feature is removed or changed by this restructure. All controls, validations, guards
(sole-admin, pending email), modals, and toast notifications continue to work.

**Why this priority**: The restructure is purely organisational; any regression in existing
behaviour is a defect.

**Independent Test**: Run the existing AccountSettings test suite without modification after
the restructure — all tests should pass.

**Acceptance Scenarios**:

1. **Given** the restructured page, **When** the full existing test suite runs, **Then** every
   previously passing test continues to pass.
2. **Given** the user is the sole admin, **When** they open the Account section and attempt to
   delete their account, **Then** the same sole-admin blocking behaviour is shown.

---

### Edge Cases

- What happens when the page is viewed on a narrow viewport — do the two sections still render
  legibly without overlap?
- How does the layout look when a pending email change notice is shown inside the Account
  section?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Account Settings page MUST present all existing controls unchanged, grouped
  into exactly two named sections: "Email Settings" and "Account".
- **FR-002**: The "Email Settings" section MUST contain the summary email toggle, frequency
  selector, and email language selector — in that order.
- **FR-003**: The "Account" section MUST contain the display name form, email address/change
  form, password change form, and the danger zone (account deletion) — in that order.
- **FR-004**: Each section MUST have a visible heading that identifies it.
- **FR-005**: All existing behaviour (save handlers, toast notifications, validation, sole-admin
  guard, pending email notice, delete confirmation modal) MUST remain fully functional after
  the restructure.
- **FR-006**: Section headings MUST be internationalised using the existing i18n system
  (English and German translations required).
- **FR-007**: The visual grouping between sections MUST be clear enough that a user can
  distinguish the two sections at a glance without reading every control label.

### Key Entities

- **Account Settings page**: Single-page component rendered for authenticated users that
  exposes profile, security, and notification preference controls.
- **Email Settings section**: Logical grouping of the two email notification preference
  controls (summary email, email language).
- **Account section**: Logical grouping of identity and security controls (name, email,
  password) plus the danger zone.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing AccountSettings unit tests pass without modification after the
  restructure.
- **SC-002**: A user unfamiliar with the page can correctly identify which section to visit
  to change their email language without reading individual control labels (confirmed by
  section heading alone).
- **SC-003**: The page renders both sections within a single scroll area with no hidden or
  clipped content at standard viewport widths (≥ 320 px).
- **SC-004**: No new i18n keys are introduced without corresponding entries in both the
  English and German translation files.

## Assumptions

- The restructure is limited to visual/layout changes on the frontend; no backend API changes
  are required.
- The existing order of controls within each section (as they appear in the current page) is
  preserved unless the user specifies otherwise.
- The "danger zone" (delete account) stays at the bottom of the Account section, consistent
  with its current prominent styling.
- Mobile/narrow viewports are supported to the same degree as the current page — no dedicated
  mobile redesign is in scope.
- The two new section headings will reuse the existing i18n infrastructure; adding two new
  translation keys per language is acceptable.
