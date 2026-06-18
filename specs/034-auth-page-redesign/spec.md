# Feature Specification: Authentication Page Redesign

**Feature Branch**: `034-auth-page-redesign`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "I would like to overhaul the public pages (sign-in & forgot-password & any future one) by using the authentication page with image, similar like the Mantine authentication-image layout. For the sign-in I would like this one (without the remember me and create account), and for forgot password this one (Mantine forgot-password layout). Both forms should still show up on the same authentication page with the image."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In with New Layout (Priority: P1)

A user navigates to the application and is presented with a visually overhauled sign-in page that features a two-column layout: a decorative image panel on the left and the sign-in form on the right. The form contains only email and password fields plus a submit button — no "remember me" checkbox and no "create account" link.

**Why this priority**: Sign-in is the primary entry point for all authenticated users. The visual overhaul must be functional before any secondary pages matter.

**Independent Test**: Can be tested by visiting the sign-in route and verifying the two-column layout renders, the form accepts credentials, and login succeeds — delivers a fully working sign-in experience.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user visits the application, **When** they land on the sign-in page, **Then** they see a two-column layout with a decorative image panel on one side and a sign-in form on the other.
2. **Given** the sign-in page is displayed, **When** the user inspects the form, **Then** the form contains only an email field, a password field, and a sign-in button — no "remember me" checkbox and no "create account" link.
3. **Given** the sign-in form is displayed, **When** the user enters valid credentials and submits, **Then** they are authenticated and redirected to the main application.
4. **Given** the sign-in form is displayed, **When** the user enters invalid credentials and submits, **Then** an error message is shown within the form and the user remains on the sign-in page.
5. **Given** the sign-in page is displayed on a narrow screen, **When** the viewport is below the breakpoint threshold, **Then** the layout collapses gracefully (image panel hides or stacks) and the form remains fully usable.

---

### User Story 2 - Forgot Password with New Layout (Priority: P2)

A user who has forgotten their password navigates to the forgot-password page and sees the same two-column layout as the sign-in page. A link on the sign-in form allows switching to the forgot-password form without leaving the page. The forgot-password form asks only for an email address and a submit button.

**Why this priority**: Password recovery is the second most important public flow. The layout must be consistent with sign-in and the transition between forms must be seamless.

**Independent Test**: Can be tested by clicking "Forgot password?" on the sign-in page, verifying the forgot-password form appears in the same layout, entering an email, and confirming a success message is shown.

**Acceptance Scenarios**:

1. **Given** the sign-in page is displayed, **When** the user clicks the "Forgot password?" link, **Then** the forgot-password form replaces the sign-in form within the same page layout (image panel unchanged).
2. **Given** the forgot-password form is displayed, **When** the user inspects the form, **Then** the form contains only an email field and a submit button.
3. **Given** the forgot-password form is displayed, **When** the user enters a valid email and submits, **Then** a confirmation message is shown indicating a reset email has been sent.
4. **Given** the forgot-password form is displayed, **When** the user clicks "Back to sign in", **Then** the sign-in form is shown again within the same page layout.
5. **Given** the forgot-password page is accessed directly via URL, **When** the page loads, **Then** the forgot-password form is shown within the two-column layout with the image panel.

---

### User Story 3 - Consistent Layout for Future Public Pages (Priority: P3)

Any future public page (e.g., password reset confirmation, email verification notice) reuses the same two-column image-panel layout established by this feature, ensuring a consistent visual identity across all unauthenticated views.

**Why this priority**: Establishing the layout as a shared wrapper now avoids per-page duplication later. Low immediate urgency but high architectural value.

**Independent Test**: Can be tested by verifying that the image-panel layout is implemented as a reusable wrapper component, not duplicated inside sign-in and forgot-password individually.

**Acceptance Scenarios**:

1. **Given** a new public page is added in the future, **When** it uses the shared authentication layout, **Then** it automatically renders the two-column image-panel structure without requiring layout code to be re-implemented.
2. **Given** the shared layout component exists, **When** a developer inspects the sign-in and forgot-password pages, **Then** both pages reference the shared layout component rather than each defining their own image panel.

---

### Edge Cases

- What happens when the user's viewport is very narrow (mobile)? The image panel should hide and the form should occupy full width.
- How does the system handle the back-navigation from forgot-password to sign-in when the forgot-password page was accessed directly via URL?
- What happens if the image resource fails to load? The form side should remain fully functional without the image.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in page MUST use a two-column layout with a decorative image panel and a form panel.
- **FR-002**: The sign-in form MUST contain only an email field, a password field, and a sign-in submit button — no "remember me" checkbox and no "create account" or registration link.
- **FR-003**: The forgot-password form MUST contain only an email field and a submit button.
- **FR-004**: Both sign-in and forgot-password forms MUST be presented within the same shared two-column layout (shared image panel component).
- **FR-005**: The sign-in page MUST include a "Forgot password?" link that transitions the user to the forgot-password form without a full page reload.
- **FR-006**: The forgot-password form MUST include a "Back to sign in" link that returns the user to the sign-in form.
- **FR-007**: The forgot-password page MUST be directly accessible via its own URL and render the two-column layout when accessed directly.
- **FR-008**: The two-column layout MUST be implemented as a reusable shared component usable by future public pages.
- **FR-009**: On small viewports, the image panel MUST be hidden or collapsed so the form remains fully usable.
- **FR-010**: All existing authentication functionality (credential validation, error messaging, password reset email trigger) MUST continue to work unchanged after the visual redesign.
- **FR-011**: The visual design MUST follow the Mantine UI component library's authentication patterns and theming already used in the application.

### Key Entities

- **Authentication Layout**: The shared two-column wrapper that renders an image panel alongside a form slot; usable by any public page.
- **Sign-In Form**: The email + password form embedded within the authentication layout.
- **Forgot-Password Form**: The email-only form embedded within the authentication layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reach the sign-in form, enter credentials, and be authenticated in under 30 seconds on a standard connection.
- **SC-002**: Users can navigate from the sign-in form to the forgot-password form and back without a full page reload.
- **SC-003**: The sign-in and forgot-password pages render correctly at mobile (< 768 px), tablet (768–1024 px), and desktop (> 1024 px) viewport widths.
- **SC-004**: The image panel is absent from the sign-in form on mobile viewports, and the form occupies 100 % of the available width.
- **SC-005**: All existing Playwright end-to-end tests covering authentication flows continue to pass after the redesign without modification to test logic.
- **SC-006**: The authentication layout is implemented as a single shared component referenced by both the sign-in and forgot-password pages (zero duplication of layout markup).

## Assumptions

- The application already uses Mantine UI as its component library; no additional UI library is introduced.
- The decorative image used in the image panel will be sourced from an existing asset already present in the project or a free-to-use placeholder; the specific image content is a visual detail left to the implementer.
- There is no "create account" flow in this application — the assumption is that accounts are created by an administrator — so the registration link omission is intentional and permanent.
- The "remember me" feature is not required by the application; its omission is intentional.
- Existing authentication business logic (JWT handling, session management, API calls) remains untouched; only the visual layer changes.
- The forgot-password route already exists; this feature only changes its visual presentation.
- Internationalisation (i18n) strings for the new layout elements will follow the existing pattern used in the project (English + German).
