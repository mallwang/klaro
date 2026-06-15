# Feature Specification: Compact Contract Form Layout

**Feature Branch**: `026-compact-contract-form`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "I would like to overhaul the contract new/edit page with the form by making the form and form fields a bit more compact. Place name & category in one row, put amount and interval in one row, put status, start & end in one row, put cancellation period (number and interval) to half of the row."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Compact Form Layout (Priority: P1)

A user navigates to the new-contract or edit-contract page and sees the form fields arranged in a denser, multi-column layout that fits more information on screen without scrolling.

**Why this priority**: The compact layout is the core deliverable — everything else is a detail of how specific field groups are arranged. Without this, no other story can be tested.

**Independent Test**: Navigate to the new-contract page and confirm all form fields are visible and arranged in the specified row groupings.

**Acceptance Scenarios**:

1. **Given** a user is on the new-contract page, **When** the page loads, **Then** the name and category fields appear side by side in the same row.
2. **Given** a user is on the new-contract page, **When** the page loads, **Then** the amount and billing-interval fields appear side by side in the same row.
3. **Given** a user is on the new-contract page, **When** the page loads, **Then** the status, start-date, and end-date fields appear in the same row (three columns).
4. **Given** a user is on the new-contract page, **When** the page loads, **Then** the cancellation-period number and unit inputs span only the left half of the form width, leaving the right half empty.

---

### User Story 2 - Edit Existing Contract with Compact Form (Priority: P2)

A user opens an existing contract for editing and sees the same compact layout with pre-filled values correctly positioned in each row.

**Why this priority**: The form is shared between new and edit; verifying pre-filled values appear in the correct columns confirms the layout works in both modes.

**Independent Test**: Open any existing contract in edit mode and confirm all field values are visible and correctly placed in their row groups.

**Acceptance Scenarios**:

1. **Given** a user opens an existing contract for editing, **When** the edit page loads, **Then** the pre-filled name and category values appear side by side.
2. **Given** a user opens an existing contract for editing, **When** the edit page loads, **Then** the pre-filled status, start date, and end date values appear in a single row.

---

### User Story 3 - Form Remains Functional After Layout Change (Priority: P1)

A user fills in all form fields in the compact layout and successfully saves a contract.

**Why this priority**: A cosmetic change that breaks data entry would be worse than no change. Functional correctness is non-negotiable.

**Independent Test**: Create a new contract by filling in all fields in the compact form and confirm it saves and appears in the contract list.

**Acceptance Scenarios**:

1. **Given** a user fills in all fields in the compact form, **When** they submit, **Then** the contract is saved with all correct values.
2. **Given** a user leaves optional fields blank, **When** they submit, **Then** validation behaves identically to the original form.
3. **Given** a user submits without entering a name, **When** the form validates, **Then** an error message is shown just as before the layout change.

---

### Edge Cases

- What happens on narrow viewports (mobile)? The multi-column rows should gracefully stack to single-column on small screens to remain usable.
- What happens if the name field has a very long value? The name and category row should handle overflow without breaking the layout.
- What happens to the cancellation period row on narrow viewports? It should remain usable as a single-column stack.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The form MUST display the name field and the category selector in the same horizontal row, each occupying approximately half the available form width.
- **FR-002**: The form MUST display the amount field and the billing-interval selector in the same horizontal row, each occupying approximately half the available form width.
- **FR-003**: The form MUST display the status selector, start-date field, and end-date field in the same horizontal row, each occupying approximately one third of the available form width.
- **FR-004**: The cancellation-period number input and unit selector MUST together span only the left half of the form width (i.e., the group as a whole takes 50% of the row, not the full width).
- **FR-005**: On viewports narrower than a standard tablet breakpoint, all multi-column rows MUST collapse to a single-column stacked layout so the form remains usable.
- **FR-006**: All existing field labels, placeholder text, validation rules, and submission behavior MUST remain unchanged.
- **FR-007**: Both the new-contract page and the edit-contract page MUST use the updated compact layout (the form component is shared).

### Key Entities

- **ContractForm**: The shared React component used by both `ContractNew` and `ContractEdit` pages — its layout is the subject of this feature.
- **Field row group**: A horizontal arrangement of two or three form fields that share a single row in the layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All field row groupings (name+category, amount+interval, status+start+end, cancellation half-row) are visible on a 1280 px wide desktop viewport without vertical scrolling past the form's natural height reduction.
- **SC-002**: The form can be submitted successfully with valid data after the layout change, with zero regression in validation behaviour.
- **SC-003**: On a 375 px wide mobile viewport, all fields remain reachable and the layout collapses to a single-column stack with no horizontal overflow.
- **SC-004**: All existing unit and integration tests for `ContractForm`, `ContractNew`, and `ContractEdit` continue to pass without modification to test assertions.

## Assumptions

- The existing CSS module (`ContractForm.module.css`) will be extended with new grid/flex rules for the new row groups; no new styling library is introduced.
- The shared `ContractForm` component already handles both new and edit modes; no page-level layout changes are needed beyond the component itself.
- The tablet/mobile breakpoint for column collapsing follows the existing Mantine breakpoint conventions already in use in the project.
- The "left half" constraint for the cancellation period row means the combined number + unit group occupies 50% of the form width, not that each sub-field is 25%.
- The `details` (textarea), `serviceUrl`, `anonymize`, and action buttons continue to span the full form width unchanged.
