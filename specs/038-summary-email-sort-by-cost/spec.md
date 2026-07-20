# Feature Specification: Summary Email Table Sorted by Monthly Cost

**Feature Branch**: `038-summary-email-sort-by-cost`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "I would like to change the content table of the weekly email from order by the contract name to order it by the amount of monthly expenses"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See highest-cost contracts first in the summary email (Priority: P1)

A user who receives the periodic contract summary email opens it and looks at the table of
their active contracts. Instead of the contracts being listed alphabetically by name, they
now appear ordered by their monthly cost, with the most expensive contract at the top and the
least expensive at the bottom. This lets the user immediately see where the bulk of their
recurring spending goes without scanning the whole list.

**Why this priority**: This is the entire scope of the feature. The summary email already
exists and already lists contracts with their monthly cost; the only change is the ordering
of the rows so the email surfaces the most financially significant contracts first.

**Independent Test**: Generate a summary email for a user who has multiple active contracts
with differing monthly costs and confirm the table rows are ordered from highest monthly cost
to lowest, regardless of the contracts' names.

**Acceptance Scenarios**:

1. **Given** a user with active contracts costing €50, €12, and €120 per month, **When** the
   summary email is generated, **Then** the contract table lists them in the order €120, €50,
   €12 (highest monthly cost first).
2. **Given** a user whose alphabetically-first contract is also their cheapest, **When** the
   summary email is generated, **Then** that contract appears at or near the bottom of the
   table rather than at the top.
3. **Given** two active contracts with the same monthly cost, **When** the summary email is
   generated, **Then** the two contracts appear adjacent to each other and in a stable,
   predictable order (alphabetically by name).

---

### Edge Cases

- **Single active contract**: The table contains exactly one row; ordering has no visible
  effect and the email renders as before.
- **No active contracts**: The "no active contracts" state is shown; there is no table to
  order, so the change has no effect.
- **Tied monthly costs**: When two or more contracts share the same monthly cost, they are
  ordered deterministically by contract name so the email output is stable across runs.
- **Differing billing intervals**: Contracts billed yearly, quarterly, etc. are compared on
  their normalized monthly-cost basis (the same figure already shown in the "Monthly" column),
  not on their raw billing amount.
- **Anonymized contracts**: Contracts whose names are hidden/anonymized are ordered by the
  same monthly-cost rule; their position in the table follows their cost, not their masked
  label.
- **Both email formats**: The ordering is identical in the HTML and plain-text versions of
  the email.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The contract table in the summary email MUST be ordered by each contract's
  monthly cost in descending order (highest monthly cost first).
- **FR-002**: When two or more contracts have an equal monthly cost, the system MUST order
  those contracts deterministically by contract name (case-insensitive, ascending) so the
  output is stable across repeated sends.
- **FR-003**: The monthly cost used for ordering MUST be the normalized monthly figure already
  displayed in the email's monthly-cost column, so the ordering visibly matches the amounts
  shown to the user.
- **FR-004**: The ordering rule MUST apply identically to both the HTML and plain-text
  renditions of the summary email.
- **FR-005**: The change MUST NOT alter which contracts are included in the email, the totals
  shown, the upcoming-renewals section, or any other content — only the row order of the
  active-contract table changes.
- **FR-006**: The ordering rule MUST apply to every summary-email frequency (e.g. weekly and
  any other supported cadence), not only the weekly email.

### Key Entities *(include if feature involves data)*

- **Contract (summary row)**: Represents one active contract as it appears in the email table.
  Relevant attributes for this feature are its display name and its normalized monthly cost.
  The monthly cost is the sort key; the name is the tie-breaker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of generated summary emails containing two or more active contracts, the
  table rows appear in non-increasing order of monthly cost.
- **SC-002**: For any given user and contract set, regenerating the summary email produces the
  exact same row order every time (deterministic ordering, including for tied amounts).
- **SC-003**: A user can identify their single most expensive active contract by reading only
  the first row of the summary email table.
- **SC-004**: No summary email regresses in any other respect — totals, included contracts,
  renewals, and both email formats remain unchanged apart from the active-contract row order.

## Assumptions

- "Amount of monthly expenses" refers to each contract's normalized monthly cost (the value
  already shown in the email's monthly column), not the raw per-billing-cycle amount.
- Descending order (most expensive first) is the intended interpretation, because the value of
  the change is to surface where the largest recurring spending goes.
- Ties are broken alphabetically by contract name to keep the output deterministic; the exact
  tie-break choice is not user-visible-critical and can be adjusted without changing scope.
- The change applies to all summary-email frequencies the product supports; the user described
  it as the "weekly email" simply because that is the cadence they receive.
- Only the ordering of the active-contract table changes; no new columns, data, or user-facing
  settings are introduced, and no toggle to choose the sort order is in scope for this feature.
