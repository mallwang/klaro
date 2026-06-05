# Quickstart: Validate Sortable Contract Table Columns

## Prerequisites

- pnpm installed; dependencies installed (`pnpm install` from repo root)
- Dev server running or test runner available

## Unit Test Validation

Run the frontend unit tests:

```bash
cd packages/frontend
pnpm test
```

### Expected outcomes

All existing `ContractTable` tests continue to pass.

New sort-specific tests (added during implementation) should pass, covering:

| Test scenario | Expectation |
|---|---|
| Click "Name" header once | Rows reordered A→Z |
| Click "Name" header twice | Rows reordered Z→A |
| Click "Name" header three times | Rows return to original order |
| Click "Amount" header | Rows ordered by numeric `amount`, ignoring billing interval |
| Sort active on column A, click column B | Sort switches to column B ascending; column A indicator clears |
| Contract with null `endDate` sorted asc by end date | Null-date row appears last |
| Contract with null `endDate` sorted desc by end date | Null-date row appears first |
| Two contracts with identical amounts sorted by amount | Relative order preserved (stable sort) |
| Ascending indicator visible on active sort column | `ChevronUp` icon present in header |
| Descending indicator visible on active sort column | `ChevronDown` icon present in header |
| Unsorted state | Neutral icon (`ChevronsUpDown`) on sortable headers, no directional icon |
| "Actions" header clicked | No reorder; `Actions` header has no sort icon |

## Manual Browser Validation

1. Start the full dev server:

   ```bash
   pnpm dev        # from repo root, or
   cd packages/frontend && pnpm dev
   ```

2. Navigate to the contracts list page.

3. Golden path — sort by Amount ascending:
   - Click the "Amount / Interval" column header.
   - Verify rows reorder lowest→highest by amount (ignore the billing interval label).
   - Verify a `↑` (up arrow) indicator appears on that header.

4. Toggle to descending:
   - Click "Amount / Interval" again.
   - Verify rows reorder highest→lowest.
   - Verify the indicator changes to `↓`.

5. Clear sort:
   - Click "Amount / Interval" a third time.
   - Verify rows return to the API's original order.
   - Verify no directional indicator is shown.

6. Sort by Name:
   - Click the "Name" header.
   - Verify rows are alphabetical (A→Z). With anonymization ON, sort is still by the displayed fantasy name.

7. Sort by End Date — null handling:
   - Ensure at least one contract has no end date.
   - Sort ascending; contract with no end date should appear at the bottom.
   - Sort descending; it should appear at the top.

8. Actions column check:
   - Click the "Actions" header.
   - Verify nothing happens and no sort indicator appears.

9. Regression check:
   - While sorted, use Edit on a contract — confirm navigation works.
   - While sorted, use Delete on a contract — confirm inline confirmation still works.
   - Toggle anonymization while a sort is active — confirm the sort order is maintained and names flip correctly.

## E2E Test Validation (if applicable)

```bash
cd packages/frontend
pnpm test:e2e
```

Playwright tests covering the golden-path sort flow (if added during implementation) should pass.
