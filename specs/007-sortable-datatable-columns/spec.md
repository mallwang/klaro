# Feature Specification: Sortable Contract Table Columns

**Feature Branch**: `007-sortable-datatable-columns`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "I would like to allow the contract datatable to have sortable columns. All except the "Actions" header should be sortable. The "Amount" column should be simple sorted by just the amount, not including its interval."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sort Contracts by Column (Priority: P1)

A user viewing the contracts table wants to sort the list by a particular column to find contracts more quickly — for example, sorting by amount to see the most expensive contracts first, or sorting by end date to see which contracts are expiring soonest.

**Why this priority**: Sorting is the core feature of this spec and delivers immediate value by itself. It works independently of any other story.

**Independent Test**: Can be fully tested by clicking a column header and verifying the rows reorder correctly, delivering a usable sorted list.

**Acceptance Scenarios**:

1. **Given** the contracts table is displayed with at least two rows, **When** the user clicks the "Name" column header, **Then** the rows are sorted alphabetically (A → Z) by contract name.
2. **Given** the rows are sorted ascending by a column, **When** the user clicks the same column header again, **Then** the rows are sorted descending (reverse order).
3. **Given** the rows are sorted descending by a column, **When** the user clicks the same column header a third time, **Then** the sort is cleared and rows return to their default (insertion) order.
4. **Given** the contracts table is displayed, **When** the user clicks the "Amount" column header, **Then** rows are sorted by the numeric amount value only, ignoring the billing interval label.
5. **Given** the contracts table is displayed, **When** the user clicks the "Actions" column header, **Then** nothing happens — the column is not sortable.

---

### User Story 2 - Visual Sort Direction Indicator (Priority: P2)

A user wants to see at a glance which column the table is currently sorted by and in which direction, so they know the current view state without having to guess.

**Why this priority**: The sort indicator makes the feature discoverable and its current state transparent. It depends on the core sort logic from P1 being in place.

**Independent Test**: Can be fully tested by sorting a column and verifying a visual cue (arrow or icon) appears on the active column header showing direction.

**Acceptance Scenarios**:

1. **Given** no sort is active, **When** the user views the column headers, **Then** no directional indicator is shown on any header (or all headers show a neutral/unsorted state).
2. **Given** the user has clicked a sortable column header once, **When** the user views the table, **Then** the active column header shows an ascending indicator (e.g., up arrow).
3. **Given** the user has clicked a sortable column header twice, **When** the user views the table, **Then** the active column header shows a descending indicator (e.g., down arrow).
4. **Given** a sort is active on one column and the user clicks a different sortable column, **Then** the indicator moves to the newly sorted column and the previous column returns to unsorted appearance.

---

### Edge Cases

- What happens when two contracts have the same value in the sorted column? Rows with equal values maintain their relative order (stable sort).
- What happens when a contract has no end date? Rows with a missing end date are placed at the end when sorting by end date (ascending), and at the beginning when descending.
- How does sorting interact with the anonymization toggle? Sorting operates on the underlying data; the displayed (possibly anonymized) name is what is used for name-column sorting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The table MUST support click-to-sort on the following columns: Name, Category, Amount, Status, End Date.
- **FR-002**: The "Actions" column MUST NOT be sortable; clicking its header MUST have no effect.
- **FR-003**: Clicking a sortable column header MUST cycle through three states in order: ascending → descending → unsorted (default).
- **FR-004**: The "Amount" column sort MUST order rows by the numeric amount value only, independent of the billing interval.
- **FR-005**: Each sortable column header MUST display a visual indicator showing the current sort direction (ascending, descending, or unsorted/neutral).
- **FR-006**: Only one column MAY be sorted at a time; activating a new column clears the previous sort.
- **FR-007**: Rows with equal values in the sorted column MUST maintain their relative original order (stable sort).
- **FR-008**: Rows with a null/missing end date, when sorted by end date, MUST be treated as the latest possible date (sorted to the end ascending, beginning descending).

### Key Entities

- **Sort State**: The currently active sort column (if any) and its direction (ascending, descending, or none). Persists only for the current page session — no persistence across page reloads is required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking any sortable column header correctly reorders all displayed rows within one interaction, with no visible delay.
- **SC-002**: The active sort column and direction are always visually communicated to the user via a header indicator.
- **SC-003**: Sorting by Amount produces results ordered solely by numeric value; two contracts with identical amounts but different billing intervals appear adjacent without interleaving.
- **SC-004**: The "Actions" column header is visually distinguishable from sortable headers (e.g., no hover cursor change or sort icon) and remains non-interactive.
- **SC-005**: All existing table functionality (edit, delete, anonymization flip, responsive layout) continues to work correctly after the sort feature is introduced.

## Assumptions

- The sort is client-side only — all contracts are already loaded in the browser; no new API calls are needed.
- Sort state does not need to be persisted across page reloads or shared via URL.
- The default (unsorted) order is the order in which contracts are returned from the API.
- Mobile/responsive layout is considered in scope: sortable headers must be tappable and indicators must be visible at small screen widths.
