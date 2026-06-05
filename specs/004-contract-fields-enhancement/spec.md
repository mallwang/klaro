# Feature Specification: Enhance Contract Fields

**Feature Branch**: `004-contract-fields-enhancement`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Now I would like to enhance the contracts by adding the opportunity to set the start date, a detail free text field, a URL to the service/provider, and the cancellation/withdrawal period."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Additional Contract Details When Creating (Priority: P1)

When creating a new contract, the user can optionally provide: a start date indicating when the service began, additional notes in a free-text details field, a URL pointing to the service provider's website, and the notice period required to cancel the contract.

**Why this priority**: These fields complete the basic contract record and are most valuable when entered at creation time. The start date and cancellation period are particularly important for understanding contract obligations.

**Independent Test**: Can be fully tested by creating a new contract with all four new fields populated and verifying they are saved and displayed correctly in the contract detail view.

**Acceptance Scenarios**:

1. **Given** a user is creating a new contract, **When** they fill in the start date, notes, service URL, and cancellation period fields, **Then** the contract is saved with all four fields persisted and displayed in the contract detail view.
2. **Given** a user is creating a new contract, **When** they leave all four new fields empty, **Then** the contract is saved successfully — all four fields are optional.
3. **Given** a user enters a service URL, **When** they save the contract, **Then** the system validates the URL format and rejects malformed values with a clear error message.

---

### User Story 2 - Update Existing Contract with New Fields (Priority: P2)

A user editing an existing contract can add or update the start date, details, service URL, and cancellation period on any previously saved contract, including those created before this feature was introduced.

**Why this priority**: Existing contracts are equally important; users should be able to enrich historical records without re-creating them.

**Independent Test**: Can be fully tested by opening an existing contract in edit mode, populating the new fields, saving, and confirming the changes are reflected in the contract detail view.

**Acceptance Scenarios**:

1. **Given** an existing contract with no values for the new fields, **When** the user edits the contract and sets all four new fields, **Then** the changes are saved and visible in the contract detail view.
2. **Given** a contract already has a start date set, **When** the user updates the start date, **Then** the new value replaces the old one.
3. **Given** a contract has a details note, **When** the user clears the details field, **Then** the field is saved as empty/blank without error.

---

### User Story 3 - View Contract Details Including New Fields (Priority: P3)

When viewing a contract's detail page, the user sees the start date, details notes, service URL, and cancellation period displayed clearly alongside existing contract information.

**Why this priority**: Visibility of the information is the final step in the data lifecycle, making the added fields actionable for the user.

**Independent Test**: Can be fully tested by navigating to a contract detail view and verifying all four fields are displayed when populated, and gracefully absent when not set.

**Acceptance Scenarios**:

1. **Given** a contract has all four new fields populated, **When** the user views the contract detail page, **Then** all four fields are visible with their values.
2. **Given** a contract has no values for the new fields, **When** the user views the contract detail page, **Then** empty fields are either hidden or shown clearly as "not set", without cluttering the display.
3. **Given** a contract has a service URL, **When** the user views the contract detail page, **Then** the URL is displayed as a clickable link that opens the provider's website.

---

### Edge Cases

- What happens when a user enters a start date in the future? Future start dates are allowed — some contracts are pre-arranged before the service begins.
- What happens when the cancellation period is set but the contract has no renewal date? The field is informational and is displayed as-is regardless of other field values.
- How does the system handle very long details text? A maximum of 2,000 characters applies; the user receives a clear character-count indicator and error if exceeded.
- What happens when a malformed URL is entered in the service URL field? The system rejects it with a clear, user-readable error message before saving.
- What happens to existing contracts that were created before this feature existed? They load and display correctly with the new fields shown as empty/not set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to set an optional start date on a contract when creating or editing it.
- **FR-002**: Users MUST be able to enter an optional free-text details/notes field on a contract when creating or editing it; the field MUST accept up to 2,000 characters.
- **FR-003**: Users MUST be able to enter an optional service URL on a contract when creating or editing it; the URL MUST be validated for proper format before the contract is saved.
- **FR-004**: Users MUST be able to set an optional cancellation/withdrawal period on a contract — expressed as a numeric value and a unit (days, weeks, or months) — when creating or editing it.
- **FR-005**: All four new fields MUST be optional; no existing or new contract creation flow may be blocked because any of these fields are empty.
- **FR-006**: The contract detail view MUST display all four new fields when they contain values.
- **FR-007**: Service URLs MUST be rendered as clickable hyperlinks in the contract detail view, opening in a new browser tab.
- **FR-008**: Existing contracts MUST display gracefully when the new fields have no stored value — no errors, no broken layout, no placeholder garbage.
- **FR-009**: The system MUST display a character count indicator in the details field and prevent saving when the 2,000-character limit is exceeded.

### Key Entities

- **Contract**: Extended with four new optional attributes:
  - `startDate` — calendar date on which the service contract begins
  - `details` — plain-text notes up to 2,000 characters providing additional context about the contract
  - `serviceUrl` — a validated URL string pointing to the service provider's website
  - `cancellationPeriod` — a structured duration consisting of a numeric value and a unit (days, weeks, or months) representing the required notice period to cancel the contract

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add all four new fields to a contract in a single create or edit session without additional navigation steps.
- **SC-002**: 100% of existing contracts load and display correctly after the feature is deployed — no broken layouts or runtime errors for records lacking the new fields.
- **SC-003**: URL validation prevents saving of malformed service URLs and surfaces a user-readable error message in every case; valid URLs are accepted without false rejections.
- **SC-004**: The cancellation period field supports exactly three units (days, weeks, months), covering the most common contract notice terms.
- **SC-005**: Users can complete adding all four new fields to an existing contract in under 2 minutes from opening the edit view to saving.

## Assumptions

- All four new fields are optional — no business rule requires any of them to be set for a contract to be valid.
- The cancellation period is informational only for this feature; the system does not calculate "cancel by" deadlines or trigger automated reminders based on it. That capability is considered a future enhancement.
- The start date does not affect billing date calculations in this feature; it serves purely as a reference date for the user's awareness.
- The details field accepts plain text only — rich text formatting and markdown rendering are out of scope.
- The service URL must be a well-formed absolute URL (e.g., https://example.com); partial or relative URLs are not accepted.
- This enhancement applies to the single-user personal contract management context — no multi-user permissions or access control changes are required.
- The 2,000-character limit for the details field covers typical contract notes usage; it may be revisited in a future iteration based on user feedback.
