# Feature Specification: Separate Inactive Contracts from Expired Contracts on Dashboard

**Feature Branch**: `035-dashboard-hide-inactive`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "I dont want to show inactive contracts on the dashboard under 'expired contracts'. Inactive contracts could be a gray expandable section, but should not in focus of the dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Expired Contracts only shows contracts the user still needs to act on (Priority: P1)

A user opens their dashboard to see which contracts have expired and may need renewal or cancellation follow-up. Today, contracts they already marked inactive (no longer relevant) clutter this list alongside contracts that genuinely need attention. They want the "Expired Contracts" section to only show contracts that are both past their end date and still active.

**Why this priority**: This is the core problem statement — the dashboard's most actionable section is currently noisy with irrelevant entries, undermining its purpose.

**Independent Test**: Create one ACTIVE contract with a past end date and one INACTIVE contract with a past end date. Load the dashboard and verify only the ACTIVE contract appears under "Expired Contracts".

**Acceptance Scenarios**:

1. **Given** a contract with status ACTIVE and an end date in the past, **When** the dashboard loads, **Then** the contract appears in the "Expired Contracts" section.
2. **Given** a contract with status INACTIVE and an end date in the past, **When** the dashboard loads, **Then** the contract does NOT appear in the "Expired Contracts" section.

---

### User Story 2 - Inactive contracts are still reachable in a low-emphasis section (Priority: P2)

A user wants to occasionally check on contracts they've marked inactive without those contracts competing for attention with active, expired contracts. They expect a visually de-emphasized (gray), collapsed-by-default section they can expand on demand.

**Why this priority**: Preserves visibility/access to inactive contracts (no data is hidden permanently) while keeping the dashboard's primary focus on actionable items — this is what makes the change acceptable rather than just deleting information the user might still want.

**Independent Test**: With at least one INACTIVE contract present, load the dashboard, confirm the "Inactive Contracts" section renders collapsed and visually muted, then expand it and verify the contract is listed.

**Acceptance Scenarios**:

1. **Given** one or more INACTIVE contracts exist, **When** the dashboard loads, **Then** an "Inactive Contracts" section is visible in a collapsed state by default, styled with reduced visual emphasis (gray) relative to other dashboard sections.
2. **Given** the "Inactive Contracts" section is collapsed, **When** the user clicks/taps to expand it, **Then** all of the user's INACTIVE contracts are listed.
3. **Given** the user has no INACTIVE contracts, **When** the dashboard loads, **Then** the "Inactive Contracts" section is not shown (or shows an empty state, per implementation default — see Assumptions).

---

### Edge Cases

- A contract is INACTIVE but has no end date, or has an end date in the future: it still belongs in "Inactive Contracts" (status, not date, determines inclusion there) and never in "Expired Contracts".
- A contract's status changes from ACTIVE to INACTIVE while it has a past end date: it should move out of "Expired Contracts" and into "Inactive Contracts" on next load.
- A contract is LIFETIME billing interval and INACTIVE: it is excluded from "Expired Contracts" (as today, lifetime contracts never expire) and included in "Inactive Contracts".
- Large number of inactive contracts: the collapsed section must not visually dominate the dashboard layout even before expansion (e.g., shows a count rather than full list when collapsed).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Expired Contracts" dashboard section MUST only include contracts whose status is ACTIVE and whose end date is in the past (existing date/billing-interval filtering rules remain unchanged).
- **FR-002**: The dashboard MUST present a separate "Inactive Contracts" section listing all of the user's contracts with status INACTIVE, regardless of end date.
- **FR-003**: The "Inactive Contracts" section MUST be collapsed by default and require an explicit user action to expand.
- **FR-004**: The "Inactive Contracts" section MUST be visually de-emphasized (e.g., gray/muted styling) relative to the other dashboard sections so it does not compete for attention with actionable content.
- **FR-005**: When a user has no INACTIVE contracts, the dashboard MUST NOT display the "Inactive Contracts" section.
- **FR-006**: Expanding or collapsing the "Inactive Contracts" section MUST NOT affect the content or layout of other dashboard sections.
- **FR-007**: The collapsed "Inactive Contracts" section header MUST indicate how many inactive contracts exist (e.g., a count) so users know there's something to expand without having to open it.

### Key Entities

- **Contract**: Existing entity with a `status` field (ACTIVE | INACTIVE) and an `endDate`. This feature changes which subset of contracts is surfaced in which dashboard section based on these existing attributes — no new fields are introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of contracts shown in the "Expired Contracts" section have status ACTIVE.
- **SC-002**: Users can locate any inactive contract from the dashboard within one additional click (expanding the section), with zero data loss compared to before the change.
- **SC-003**: On first dashboard load, no inactive contract content is visible until the user explicitly expands the section.

## Assumptions

- "Inactive" refers exclusively to the existing contract `status` field value `INACTIVE`; no new status or "expired" field is introduced.
- The "Inactive Contracts" section is omitted entirely (not shown as an empty collapsed section) when the user has zero inactive contracts, consistent with how other dashboard sections handle empty states.
- The existing Mantine `Accordion` component (already used for collapsible content elsewhere in the app, e.g., the FAQ page) is the expected UI pattern for the new collapsible section; this is a styling/component choice left to planning, not a hard requirement.
- This feature only affects the Dashboard view; the main Contracts list page's existing status filtering is out of scope and unchanged.
