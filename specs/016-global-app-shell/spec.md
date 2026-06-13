# Feature Specification: Global App Shell with Top-Level Header and Footer

**Feature Branch**: `016-global-app-shell`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "I would like to improve the mantine ui elements on every page we use. Lets start with the main application. The goal is to have a global footer that is shown on the bottom of the application, and a top-level navbar that shows the application icon (not existing yet, a placeholder would be enough) and the application name. The language picker and theme toggle should be inside the top-level navbar at the right."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persistent Top-Level Header on All Pages (Priority: P1)

As a user of the application, I see a consistent header bar at the top of every authenticated page. The header displays the application icon (a visual placeholder) and the application name "Personal Contract Management" on the left side. On the right side, the header contains the language picker and the theme toggle (light/dark mode switch). This header is always visible regardless of which page I am on.

**Why this priority**: The header is the primary chrome element that anchors the application identity and provides access to global controls (language and theme). Without it, the other layout improvements have no foundation. It is the most impactful visual change.

**Independent Test**: Can be fully tested by navigating to any authenticated route and confirming the header renders with app icon placeholder, app name, language picker, and theme toggle — entirely independently of footer or sidebar changes.

**Acceptance Scenarios**:

1. **Given** I am signed in and on any page, **When** I view the top of the screen, **Then** I see a header bar containing an icon placeholder and the text "Personal Contract Management" on the left, and the language picker and theme toggle on the right.
2. **Given** I am on the Dashboard page, **When** I switch the language via the language picker in the header, **Then** the UI language updates and the header remains visible.
3. **Given** I am on the Contracts list page, **When** I click the theme toggle in the header, **Then** the color scheme switches and my preference is saved for subsequent visits.
4. **Given** I am on a mobile-width viewport, **When** I view the top of the screen, **Then** the header is still visible (the icon and app name may be abbreviated or hidden to accommodate space, but the controls remain accessible).
5. **Given** I am on the Sign-In page or the Accept Invitation page (unauthenticated routes), **When** I view the page, **Then** the top-level header with language picker and theme toggle is NOT shown (these pages manage their own layout).

---

### User Story 2 - Persistent Global Footer on All Authenticated Pages (Priority: P2)

As a user, I see a consistent footer at the bottom of every authenticated page. The footer displays the application name and the copyright year. It is always anchored to the bottom of the visible area, never overlapping page content.

**Why this priority**: The footer provides a polished, finished feel and reinforces application branding. It is secondary to the header but completes the global layout frame.

**Independent Test**: Can be fully tested by scrolling to the bottom of any authenticated page and confirming the footer renders with the application name and copyright year — independently of header or sidebar changes.

**Acceptance Scenarios**:

1. **Given** I am signed in and on any page, **When** I view the bottom of the screen, **Then** I see a footer bar displaying the application name and the current copyright year.
2. **Given** the page content is shorter than the viewport height, **When** I view the page, **Then** the footer is anchored to the bottom of the viewport and does not float in the middle of the page.
3. **Given** the page content is taller than the viewport height, **When** I scroll to the bottom, **Then** the footer appears below all content and does not obscure any content while scrolling.
4. **Given** I am on an unauthenticated page (Sign-In, Accept Invitation), **When** I view the page, **Then** the global footer is NOT shown (these pages manage their own layout).

---

### User Story 3 - Language Picker and Theme Toggle Removed from Sidebar (Priority: P3)

As a user, the language picker and theme toggle are no longer duplicated in the left navigation sidebar. They now live exclusively in the top-level header. The sidebar continues to show navigation links, the app/admin segment switch (for admins), and the user name with sign-out button.

**Why this priority**: Moving these controls into the header eliminates duplication and declutters the sidebar. However, this is a relocation, not new functionality — the controls still work the same way. It depends on P1 being complete first.

**Independent Test**: Can be tested by verifying (a) the language picker and theme toggle are absent from the sidebar's settings section, and (b) the sidebar still renders all navigation links, the user section, and (for admin users) the segment switch correctly.

**Acceptance Scenarios**:

1. **Given** I am signed in and view the left sidebar, **When** I inspect the sidebar, **Then** I do NOT see the language picker or theme toggle in the sidebar.
2. **Given** I am signed in as an admin, **When** I view the sidebar, **Then** I still see the App/Admin segment control and the admin navigation links when the admin segment is selected.
3. **Given** I am signed in, **When** I view the sidebar, **Then** I still see the user display name and the sign-out button.

---

### Edge Cases

- What happens when the app icon placeholder has not loaded or the image path is missing? The header should still render cleanly with the application name visible.
- How does the header behave on very narrow mobile viewports? The app name may truncate but the language and theme controls must remain accessible (not hidden behind an overflow).
- What happens if the footer is placed inside a scrollable container rather than the viewport? The footer must stick to the bottom of the viewport or the document, not scroll away with content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a top-level header bar on all authenticated pages that is always visible at the top of the screen.
- **FR-002**: The header MUST display an application icon placeholder (e.g., a simple geometric shape or initials icon) on its left side.
- **FR-003**: The header MUST display the application name "Personal Contract Management" on its left side, adjacent to the icon.
- **FR-004**: The header MUST display the language picker control on its right side.
- **FR-005**: The header MUST display the theme toggle (light/dark mode switch) on its right side, adjacent to the language picker.
- **FR-006**: The application MUST display a global footer on all authenticated pages that is anchored to the bottom of the layout.
- **FR-007**: The footer MUST display the application name and the current copyright year.
- **FR-008**: The language picker and theme toggle MUST be removed from the left sidebar and exist only in the top-level header.
- **FR-009**: The left sidebar MUST continue to display all navigation links, the App/Admin segment switch (visible to admin users only), and the user name with sign-out button.
- **FR-010**: The top-level header and global footer MUST NOT appear on unauthenticated pages (Sign-In, Accept Invitation).
- **FR-011**: The header and footer layout MUST be consistent across all screen sizes, with the header controls remaining accessible on mobile viewports.

### Key Entities

- **AppShell**: The authenticated layout wrapper that composes the header, sidebar, main content area, and footer.
- **TopHeader**: The new persistent top bar containing the app identity (icon + name) and global controls (language picker, theme toggle).
- **GlobalFooter**: The persistent bottom bar showing application name and copyright year, anchored to the bottom of the layout.
- **NavbarSegmented**: The existing left sidebar, updated to remove the language picker and theme toggle from its settings section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every authenticated page displays the header with app icon placeholder, application name, language picker, and theme toggle without any visual regression to existing page content.
- **SC-002**: Every authenticated page displays the footer at the bottom, with the footer never overlapping page content at any viewport height.
- **SC-003**: The language picker and theme toggle in the header function identically to how they previously functioned in the sidebar — language changes apply immediately and theme preference persists across sessions.
- **SC-004**: The sidebar on all authenticated pages no longer contains the language picker or theme toggle, with no other sidebar functionality removed.
- **SC-005**: Unauthenticated pages (Sign-In, Accept Invitation) are unaffected — no header or footer is added to them.
- **SC-006**: All existing navigation, routing, and authenticated-page functionality continues to work without regression after the layout change.

## Assumptions

- The application icon does not yet exist; a placeholder (e.g., initials "PCM" in a colored badge, or a generic document icon) is acceptable for this feature and a real icon can be introduced in a future iteration.
- The top-level header is part of the authenticated layout only — unauthenticated pages (Sign-In, Accept Invitation) are explicitly out of scope and must not be modified.
- The existing `FooterSimple` component content (app name + copyright year) is sufficient for the global footer; no additional links or legal text is required at this time.
- The existing `LanguagePicker` and theme toggle components from the sidebar will be reused in the header as-is — no redesign of those controls is in scope.
- Mobile layout will keep the header visible; if horizontal space is insufficient, the application name text may be hidden but the icon and controls must remain visible.
- The sidebar (left navigation) layout and behavior beyond removing the settings section is unchanged — no sidebar redesign is in scope for this feature.
