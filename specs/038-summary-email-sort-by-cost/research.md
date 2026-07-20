# Phase 0 Research: Summary Email Table Sorted by Monthly Cost

No `NEEDS CLARIFICATION` markers remain in the Technical Context — this section documents the
small set of implementation decisions made while confirming the approach against the existing
codebase.

## Decision: Where to apply the sort

- **Decision**: Sort the `contracts` array where it is assembled in
  `NotificationService.sendSummaryEmailForUser` (`packages/backend/src/services/notification.service.ts:172`),
  immediately after mapping `contractRows` to the `SummaryEmailData` contract shape and before
  it is placed on `data.contracts`.
- **Rationale**: `mailer.strings.ts` (`buildContractRowsHtml` / plain-text equivalent) iterates
  `data.contracts` in the order it receives — it has no sorting logic of its own. Sorting once
  at the data-assembly layer guarantees identical ordering in both the HTML and plain-text
  renditions (FR-004) without touching the rendering code, and applies uniformly regardless of
  `summary_email_frequency` (FR-006), since all frequencies flow through the same method.
- **Alternatives considered**:
  - *Sort in the SQL query* (`ORDER BY monthly_cost DESC`) — rejected because the tie-break
    (case-insensitive name ascending) is easier and less error-prone to express in a JS
    comparator than in SQLite SQL (`COLLATE NOCASE` ordering nuances), and keeping the row
    shape/ordering decision in one place (the mapping step) is simpler to test in isolation.
  - *Sort inside `mailer.strings.ts` at render time* — rejected because it would duplicate the
    sort in both the HTML and text builders (or require a shared helper there), and it conflates
    a data-ordering concern with a presentation concern. The chosen location keeps `mailer.strings.ts`
    a pure renderer of whatever order it's given.

## Decision: Sort key and direction

- **Decision**: Use each contract's `monthlyCost` (the already-computed normalized monthly
  figure, i.e. `r.monthly_cost` from the `MONTHLY_FACTOR_SQL` calculation), descending.
- **Rationale**: This is the same figure already rendered in the email's monthly-cost column
  (FR-003), so the visible order matches the visible numbers. Descending order surfaces the
  largest recurring expenses first, matching the feature's stated value (SC-003).
- **Alternatives considered**: Sorting by raw `amount`/`billing_interval` pair was rejected —
  it would not produce a meaningful global order across mixed billing intervals (e.g. a
  yearly and a monthly contract aren't comparable without normalization), and the normalized
  value already exists.

## Decision: Tie-break rule

- **Decision**: When `monthlyCost` is equal, order by contract `name`, case-insensitive,
  ascending.
- **Rationale**: Guarantees deterministic, stable output (SC-002) without introducing any new
  data or configuration. Matches the existing alphabetical-by-name behavior for the (common)
  case where all contracts happen to share a cost, minimizing behavioral surprise for that edge
  case.
- **Alternatives considered**: Preserving original (pre-sort) relative order for ties via a
  stable sort with no explicit tie-break — rejected because it would depend on incidental SQL
  row order (no `ORDER BY` currently exists on the query), which is not guaranteed stable across
  SQLite versions/query plans, undermining SC-002's determinism requirement.

## Decision: Anonymized contracts

- **Decision**: Anonymized contracts are sorted using their real `monthlyCost`, exactly like
  any other contract; anonymization only affects the displayed label (handled separately, see
  `sendSummaryEmailForUser`'s existing anonymize handling), not sort order.
- **Rationale**: The spec's edge case explicitly calls for this (position follows cost, not the
  masked label); the existing anonymize flag is orthogonal to the row's `monthlyCost` field, so
  no special-casing is needed in the comparator.
- **Alternatives considered**: None — this falls out naturally from sorting on `monthlyCost`
  rather than `name`.
