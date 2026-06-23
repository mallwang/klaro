# Research: Separate Inactive Contracts from Expired Contracts on Dashboard

No items in the Technical Context were marked `NEEDS CLARIFICATION` — this feature reuses
existing, well-established patterns in the codebase. The notes below record the decisions made
while confirming those patterns, for traceability.

## Decision: Filter "Expired Contracts" by `status = 'ACTIVE'`

- **Decision**: Add `AND status = 'ACTIVE'` to the SQL query in
  `DashboardService.getExpiredContracts` (`packages/backend/src/services/dashboard.ts`).
- **Rationale**: `status` (`ACTIVE` | `INACTIVE`) and "expired" (derived from `end_date < today`)
  are orthogonal today — the query currently ignores `status` entirely. Adding the filter is the
  minimal change that satisfies FR-001 without touching the schema or any other query.
- **Alternatives considered**: Introducing a combined `EXPIRED` status value was rejected — it
  would require a DB migration and conflate a manually-set field with a derived one, which the
  spec's Assumptions explicitly rule out.

## Decision: New `getInactiveContracts` query, mirroring `getExpiredContracts`'s shape

- **Decision**: Add a sibling private method `getInactiveContracts(ownerId)` that selects all
  contracts with `status = 'INACTIVE'` for the user, sorted by name, and returns objects shaped
  like the existing `ExpiredContract`/`UpcomingRenewal` row mappers (id, name, category, endDate
  nullable, anonymize, logoName, useGenericIcon).
- **Rationale**: Matches the existing per-section query pattern in `DashboardService` exactly
  (one private method per section, aggregated in `getDashboardData`), keeping the change
  consistent with current conventions rather than introducing a new abstraction.
- **Alternatives considered**: Filtering inactive contracts client-side from a single
  "all contracts" payload was rejected — the dashboard API is intentionally pre-aggregated
  per-section server-side for every other widget, and reusing that convention avoids sending
  unnecessary contract data to the client just to filter it in the browser.

## Decision: Mantine `Accordion` for the collapsible "Inactive Contracts" section

- **Decision**: Reuse Mantine's `Accordion`/`Accordion.Item`/`Accordion.Control`/`Accordion.Panel`
  components, the same pattern already used in `packages/frontend/src/pages/Faq.tsx`.
- **Rationale**: It's the only collapsible-content pattern already established in this codebase;
  introducing a second one (e.g. raw `Collapse` + custom toggle state) would violate the
  Simplicity (YAGNI) principle for no functional benefit.
- **Alternatives considered**: Mantine `Collapse` + manual `useState` toggle — rejected as
  redundant with the existing `Accordion` usage.

## Decision: Omit the section entirely when there are zero inactive contracts

- **Decision**: `Dashboard.tsx` renders `<InactiveContracts>` conditionally
  (`data.inactiveContracts.length > 0`), and/or the component itself returns `null` when empty.
- **Rationale**: Matches FR-005 and keeps behavior consistent with how an empty section would
  otherwise show no value to the user; avoids dead UI chrome.
- **Alternatives considered**: Always rendering the Accordion with an "no inactive contracts"
  empty state — rejected per spec Assumptions, which call for omission to match other dashboard
  sections' empty-state handling.
