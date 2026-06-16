# Feature Specification: Mantine Form Inputs Enhancement

**Feature Branch**: `027-mantine-form-inputs`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "I would like to enhance the contract edit form with some more suitable Mantine elements. The contract amount should use the https://ui.mantine.dev/category/inputs/#currency-input (consisting with the number and a currency field to be hardcoded to EUR at the moment. Next, I would like to use for date inputs the Mantine DatePicker with allowed deselection (https://mantine.dev/dates/date-picker/#allow-deselect)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter Contract Amount with Currency (Priority: P1)

When a user fills in or edits the contract amount, they see a two-part input: a numeric field for the amount and a read-only currency badge/select showing "EUR". The currency is hardcoded and not changeable at this time, but is visually displayed so the monetary unit is always clear.

**Why this priority**: The amount is one of the most important fields on a contract. Displaying the currency unit inline eliminates ambiguity and improves data quality by making clear what unit is expected.

**Independent Test**: Can be fully tested by navigating to the contract creation or edit form and entering a numeric value — the EUR label is visible and the combined value is saved correctly.

**Acceptance Scenarios**:

1. **Given** the contract form is open, **When** the user views the amount field, **Then** a numeric input and a non-editable "EUR" indicator are displayed together as a single cohesive control.
2. **Given** the amount field shows "EUR", **When** the user types a numeric value and submits the form, **Then** the contract is saved with the entered amount and the currency is recorded as EUR.
3. **Given** an existing contract with an amount, **When** the user opens the edit form, **Then** the numeric field is pre-populated with the stored amount and "EUR" is shown.
4. **Given** the user clears the amount field, **When** attempting to submit, **Then** validation prevents submission and an appropriate error message is shown.

---

### User Story 2 - Select Start/End Dates with DatePicker (Priority: P2)

When a user fills in or edits the contract start date or end date, they interact with a Mantine DatePicker component instead of a plain browser date input. The DatePicker supports deselection, meaning a previously chosen date can be cleared by clicking it again.

**Why this priority**: The native browser date input is inconsistent across platforms and offers no deselection. The Mantine DatePicker provides a uniform, polished experience and allows optional date fields to be genuinely cleared without workarounds.

**Independent Test**: Can be fully tested by opening the contract form, selecting a start date via the DatePicker calendar, then clicking the selected date again to deselect it — the field returns to empty and the contract saves without a date.

**Acceptance Scenarios**:

1. **Given** the contract form is open, **When** the user clicks the start date field, **Then** a calendar picker opens for date selection.
2. **Given** a date has been selected in the DatePicker, **When** the user clicks the same date again, **Then** the date is deselected and the field becomes empty.
3. **Given** an existing contract with start and end dates, **When** the user opens the edit form, **Then** both DatePickers are pre-populated with the stored dates.
4. **Given** a date is set in the DatePicker, **When** the user submits the form, **Then** the selected date is correctly saved to the contract.
5. **Given** no date is selected (empty/deselected), **When** the user submits the form, **Then** the date field is saved as null/empty on the contract.

---

### Edge Cases

- What happens when a user manually types an invalid date into the DatePicker input (if direct typing is supported)?
- How does the form behave if the end date is set to a date before the start date?
- What is displayed in the EUR currency indicator when the amount field is empty?
- Does the DatePicker respect the user's locale for date formatting and first day of week?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The contract amount field MUST display a combined input consisting of a numeric entry field and a hardcoded "EUR" currency label as a single visual unit.
- **FR-002**: The currency indicator MUST be non-editable and always display "EUR"; it MUST NOT be a user-selectable dropdown at this time.
- **FR-003**: The numeric portion of the amount field MUST accept only numeric values and enforce the same validation as the current field (non-negative, required).
- **FR-004**: The start date and end date fields MUST be replaced with Mantine DatePicker components.
- **FR-005**: The DatePicker components MUST support deselection — clicking an already-selected date clears the field.
- **FR-006**: Both DatePicker fields MUST be optional (nullable); submitting without a date selected MUST result in a null value being saved.
- **FR-007**: The DatePicker components MUST be pre-populated with existing date values when editing an existing contract.
- **FR-008**: The existing form layout and field arrangement MUST be preserved; only the input controls for amount and dates are replaced.
- **FR-009**: All existing form validation logic for amount and dates MUST continue to function correctly with the new controls.
- **FR-010**: The form MUST remain fully internationalised — labels, error messages, and date display format MUST respect the active language setting.

### Key Entities

- **Contract Amount**: Numeric monetary value paired with a hardcoded EUR currency; stored as a number on the contract record.
- **Contract Date**: An optional calendar date (start or end) stored as a nullable ISO date string on the contract record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enter a contract amount without ambiguity about the currency — the EUR label is always visible alongside the numeric field.
- **SC-002**: Users can clear a previously set start or end date by interacting with the DatePicker without needing to type or use browser-specific controls.
- **SC-003**: All existing contract creation and editing flows continue to work correctly — no regression in form submission, validation, or saved data.
- **SC-004**: The form appearance is visually consistent with the Mantine design system used throughout the application.
- **SC-005**: All unit and integration tests for the contract form pass after the changes.

## Assumptions

- The currency is hardcoded to EUR for this iteration; multi-currency support is out of scope.
- The DatePicker will use the Mantine dates package already present in the project (or to be added if missing); no alternative date library will be introduced.
- The date storage format on the backend remains an ISO date string (YYYY-MM-DD); the DatePicker value will be converted to/from this format at the form layer.
- The existing form layout (two-column rows, cancellation period section) is not restructured as part of this change.
- The `cancellationPeriodValue` numeric field is out of scope for the currency input change — only the contract amount field is updated.
- The DatePicker will display dates in the user's active locale where Mantine supports it; exact locale behaviour depends on Mantine's built-in capabilities.
