# Feature Specification: Manage Accounts Page Overhaul

**Feature Branch**: `028-admin-account-page-overhaul`

**Created**: 2026-06-16

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accounts List at the Top (Priority: P1)

An admin opens the Manage Accounts page and immediately sees the list of all user accounts as the primary content — without having to scroll past invitation or utility forms.

**Why this priority**: The primary purpose of the page is account management. Making the accounts table the first thing visible aligns the page structure with the admin's primary intent and reflects the page's purpose in its name.

**Independent Test**: Can be fully tested by navigating to Manage Accounts and verifying the accounts table appears before any other content section.

**Acceptance Scenarios**:

1. **Given** an admin is on the Manage Accounts page, **When** the page loads, **Then** the accounts table is the first visible content section below the page title.
2. **Given** an admin is on the Manage Accounts page, **When** the page loads, **Then** the invitation section and test email section appear below the accounts table.

---

### User Story 2 - Compact Invitations Section (Priority: P2)

An admin wants to invite a new user and view pending invitations in one cohesive section. The invite email field and send button appear above the invitations table — no separate card required — so the workflow is compact and self-contained.

**Why this priority**: The current layout has the invite form as a standalone card separate from the invitations table, which breaks the conceptual grouping. Combining them into one section reduces visual noise and makes the invite-and-track workflow obvious.

**Independent Test**: Can be tested by sending a new invitation and observing that the sent invitation appears in the table directly below the invite input row, without any page-level separation between form and table.

**Acceptance Scenarios**:

1. **Given** an admin is in the Invitations section, **When** they view it, **Then** the email input and send button appear as an inline row directly above the invitations table.
2. **Given** an admin submits a new invitation, **When** the request succeeds, **Then** the new invitation appears in the table in the same section without a page reload.
3. **Given** no invitations exist yet, **When** the admin views the Invitations section, **Then** the invite input row is still visible and an empty-state message occupies the table area.

---

### User Story 3 - Consistent Page Width (Priority: P2)

The Manage Accounts page uses a constrained, centred layout consistent with the My Account page — not full-width and not narrower than needed — giving it the same visual weight as other settings pages.

**Why this priority**: The current full-width layout feels inconsistent with the My Account page (`maw={900} mx="auto"`). Using a matching constraint makes the admin area feel like part of the same design system.

**Independent Test**: Can be verified by comparing the rendered width of the Manage Accounts page against the My Account page side by side; both should have the same maximum content width and be centred in the viewport.

**Acceptance Scenarios**:

1. **Given** an admin visits Manage Accounts, **When** the viewport is wider than the content max-width, **Then** the page content is centred with matching visual width as the My Account page.
2. **Given** an admin visits Manage Accounts, **When** the viewport is narrow (mobile), **Then** the content fills the available width without horizontal overflow.

---

### User Story 4 - Test Email at the Bottom (Priority: P3)

An admin who needs to verify email delivery can find the test email utility at the bottom of the page, clearly separated as a secondary/diagnostic tool rather than a primary workflow.

**Why this priority**: The test email function is an infrequently used diagnostic utility. Placing it at the bottom signals its secondary nature without removing it, and prevents it from interrupting the primary account management flow.

**Independent Test**: Can be tested by scrolling to the bottom of the page and confirming the test email form is the last section.

**Acceptance Scenarios**:

1. **Given** an admin is on the Manage Accounts page, **When** they scroll to the bottom, **Then** the test email section is the last visible section.
2. **Given** an admin sends a test email, **When** the request succeeds, **Then** a success notification appears and the form remains available for further use.

---

### User Story 5 - Aligned Invitations Section Header (Priority: P2)

The invitations section header text ("Invitations") aligns visually with the table content below it — specifically with the first column — so the section looks polished and intentional rather than misaligned.

**Why this priority**: The current implementation places a bold `Text` element with padding inside a `Paper` that also contains a borderless `Table`, causing the "Invitations" label to visually float above and to the left of the "Email" column header with inconsistent spacing. This is a visual defect that erodes trust in the UI quality.

**Independent Test**: Can be verified by inspecting the pixel alignment of the "Invitations" section title against the "Email" column header in the rendered page.

**Acceptance Scenarios**:

1. **Given** an admin views the Invitations section, **When** it contains invitations, **Then** the section heading and the table column headers share consistent left-edge alignment.
2. **Given** an admin views the Invitations section, **When** it is empty, **Then** the section heading still aligns correctly with where table content would appear.

---

### Edge Cases

- What happens when the accounts list is empty? The section should still render with an appropriate loading or empty state.
- What happens when there are no invitations? The invitations table area shows an empty-state message; the invite input is still usable.
- What happens when the user is not an admin? The page is guarded by `RequireAdmin`; no change to that behaviour.
- What happens when the page is viewed on a narrow viewport? The constrained layout should collapse gracefully, matching the responsive behaviour of the My Account page.
- What happens when sections use `Title` hierarchy? Section headings should use `Title order={3}` consistent with My Account page sectioning, preserving accessibility heading order.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST display the accounts list as the first content section after the page title.
- **FR-002**: The page MUST display an invitations section below the accounts list, containing an inline invite form (email input + send button) directly above the invitations table.
- **FR-003**: The invite form MUST NOT be rendered as a separate, standalone card (`Paper`) disconnected from the invitations table.
- **FR-004**: The test email form MUST be the last section on the page.
- **FR-005**: The page content MUST be constrained to the same maximum width as the My Account page and centred horizontally.
- **FR-006**: The page MUST use the same sectioning pattern as the My Account page: named sections with `Title order={3}` headings and visual dividers between major sections.
- **FR-007**: The section heading for the invitations area MUST align visually with the first column of the invitations table beneath it (no offset caused by inconsistent padding between heading and table container).
- **FR-008**: All existing functionality (archive, reactivate, delete account, change role, resend/cancel invitation, send test email) MUST continue to work unchanged after the layout overhaul.
- **FR-009**: The sole-admin guard (preventing the last admin from being archived or demoted) MUST remain intact.
- **FR-010**: Responsive behaviour on narrow viewports MUST be preserved — content must not overflow horizontally.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can locate the accounts table without scrolling on a 1280 px wide viewport.
- **SC-002**: An admin can send an invitation and see the new invitation in the table in the same visual section, without navigating away.
- **SC-003**: The left edge of the invitations section heading and the left edge of the "Email" column header differ by no more than the standard table cell padding (i.e. they are visually flush at the content boundary).
- **SC-004**: The rendered maximum content width of the Manage Accounts page is equal to that of the My Account page.
- **SC-005**: All existing account and invitation actions remain functional after the layout change (no regression).

## Assumptions

- The My Account page's layout (`maw={900} mx="auto"` on the outer Stack) is the reference for the target width constraint; the same value is applied here.
- Section separation uses `Divider` between the three major sections (Accounts, Invitations, Test Email), consistent with the My Account page pattern.
- The invite form inline row (email input + button) replaces the `InviteForm` standalone `Paper` card; it is rendered as a `Group` directly inside the Invitations section, above the table.
- The invitations table header (`Text fw={600}` inside `Paper`) is removed; alignment is achieved by placing the section `Title order={3}` outside the table `Paper`, so the table's first column aligns naturally with the section title using consistent padding.
- No backend or API changes are required; this is a frontend layout-only change.
- i18n keys already in use for all labels remain unchanged; no new translation keys are needed.
- The `InviteForm` and `TestEmailForm` sub-components may be refactored or inlined as needed to achieve the layout, but their core mutation logic is preserved.
