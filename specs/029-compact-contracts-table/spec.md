# Feature Specification: Compact Contracts Table

**Feature Branch**: `029-compact-contracts-table`

**Created**: 2026-06-16

**Status**: Draft

**Input**: Overhaul the contracts table to be more compact, match the dashboard panel row density (single-line rows with no wrapping when content fits), and use the same action button style as the Manage Accounts page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact Single-Line Rows (Priority: P1)

A user opens the Contracts page and sees the list of their contracts. Each row is compact and fits on a single line without wrapping — provider logo, name, category icon+label, amount/interval, status, and end date all appear on one row with no line breaks.

**Why this priority**: The primary goal is density. Users with many contracts benefit most from seeing more rows at once without scrolling. This is the core visual change.

**Independent Test**: Open the Contracts page with at least 5 contracts of varying name lengths. Every row should display all columns in a single line without content wrapping to a second line.

**Acceptance Scenarios**:

1. **Given** the contracts list has contracts with short and medium-length names, **When** the user views the page at normal desktop width, **Then** every row occupies a single line with no cell content wrapping.
2. **Given** a contract name is long, **When** it is displayed in the table, **Then** the name is truncated with an ellipsis rather than wrapping onto a second line.
3. **Given** the table is viewed on a narrower viewport, **When** content no longer fits, **Then** the existing horizontal scroll container handles overflow (no regression to the current wrapping behaviour).

---

### User Story 2 - Consistent Action Buttons (Priority: P2)

A user wants to edit or delete a contract. The action buttons in the contracts table look and feel identical to those in the Manage Accounts table — compact borderless buttons (`variant="default"`, `size="compact-sm"`) for neutral actions, and a filled red button only during the delete-confirmation step.

**Why this priority**: Visual consistency across admin and user-facing tables reduces cognitive load. The current contracts table mixes a text anchor link for Edit with a subtle-variant button for Delete, which is inconsistent with the Manage Accounts pattern.

**Independent Test**: Compare the Contracts page action column with the Manage Accounts page. The Edit and Delete buttons should use the same visual style as the Archive/Reactivate/Make Admin buttons in Manage Accounts (compact, default variant).

**Acceptance Scenarios**:

1. **Given** a contract row in its default state, **When** the user views the Actions column, **Then** Edit and Delete are both rendered as compact default-variant buttons, not as anchor links or subtle-variant buttons.
2. **Given** the user clicks Delete, **When** the inline confirmation appears, **Then** the Confirm button uses `variant="filled" color="red"` and the Cancel button uses `variant="default"`, matching the Manage Accounts delete modal pattern.
3. **Given** the user clicks Edit, **When** they are navigated to the edit page, **Then** the navigation works identically to the current behaviour (no regression).

---

### Edge Cases

- What happens when a contract name is very long (> 40 characters)? The name cell must truncate with an ellipsis and not expand the row height.
- What happens when the amount/interval cell content is long (e.g. a long billing interval label)? It must stay on one line; the column may expand horizontally but must not wrap vertically.
- What happens on mobile-width viewports? The `Table.ScrollContainer` already provides horizontal scroll — this must remain intact.
- What happens when a row is in the pending-delete state? The Confirm/Cancel buttons must still fit on one line within the actions cell.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each contract row MUST display all columns (name, category, amount, status, end date, actions) on a single line without vertical content wrapping at default desktop widths.
- **FR-002**: Long contract names MUST be truncated with an ellipsis instead of wrapping to a second line.
- **FR-003**: The Edit action MUST be rendered as a `Button` with `size="compact-sm"` and `variant="default"`, replacing the current `Anchor` link.
- **FR-004**: The Delete action in its default state MUST be rendered as a `Button` with `size="compact-sm"` and `variant="default"`, replacing the current `variant="subtle" color="red"` style.
- **FR-005**: The delete-confirmation Confirm button MUST use `variant="filled"` with a red color; the Cancel button MUST use `variant="default"`.
- **FR-006**: Row vertical padding MUST be reduced compared to the current default Mantine table row height, achieving a density comparable to the Manage Accounts table rows.
- **FR-007**: All existing functionality MUST be preserved: sorting, anonymization flip animation, locale-aware date and currency formatting, and delete confirmation flow.
- **FR-008**: The horizontal scroll container behavior for narrow viewports MUST remain unchanged.

### Key Entities

- **ContractTable**: The component under [ContractTable.tsx](packages/frontend/src/components/ContractTable.tsx) and its associated CSS module [ContractTable.module.css](packages/frontend/src/components/ContractTable.module.css).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1280px viewport width, a typical contract row (name ≤ 30 chars, standard category, amount, status, end date) occupies exactly one line of content height — verified visually and by computed row height being consistent with the Manage Accounts table row height.
- **SC-002**: A contract name exceeding 30 characters is truncated with an ellipsis and does not increase the row height beyond the single-line baseline.
- **SC-003**: The Edit and Delete buttons in a default row are visually indistinguishable in style from the action buttons in the Manage Accounts table (both use `compact-sm` size and `default` variant).
- **SC-004**: All existing unit tests for `ContractTable` continue to pass without modification (or are updated only to reflect the button style change, not behaviour changes).
- **SC-005**: No regression in the anonymization flip animation or sort behaviour, confirmed by manual testing and existing tests.

## Assumptions

- The change is purely visual/presentational; no API or data model changes are required.
- "Same as dashboard" refers to the compact row density of the `UpcomingRenewals` and `ExpiredContracts` panels — specifically their minimal vertical padding and single-line row layout — not to converting the table into a card/list format.
- The Mantine table `verticalSpacing` prop (or equivalent CSS override) is the primary mechanism for reducing row height; the exact value will be determined during implementation to match Manage Accounts table density.
- The Edit button navigating to `/contracts/:id/edit` via React Router remains the intended behaviour; only the visual element changes from `Anchor` to `Button`.
- Mobile/narrow-viewport behaviour continues to rely on the existing `Table.ScrollContainer` horizontal scroll and is not in scope for further optimisation.
