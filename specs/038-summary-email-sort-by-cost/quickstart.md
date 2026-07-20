# Quickstart: Validate Summary Email Sorted by Monthly Cost

Validates the change described in [spec.md](./spec.md) using the ordering rule from
[research.md](./research.md) and the row shape in [data-model.md](./data-model.md).

## Prerequisites

- Repo dependencies installed: `pnpm install` (run once from repo root).
- No environment variables or services beyond what the backend unit test suite already needs
  (SQLite is in-memory/file-based via `better-sqlite3`, no external DB required).

## Run the automated checks

```bash
pnpm --filter backend test -- notification.service.test.ts
```

Expected: all tests pass, including the new ordering assertions added under
`describe('NotificationService.sendSummaryEmailForUser')` (or a new nested `describe` for
ordering) that cover:

- Descending order by `monthlyCost` for contracts with distinct costs.
- Case-insensitive alphabetical tie-break when two contracts share the same `monthlyCost`.
- No change in behavior for zero or one active contract.

## Manual/exploratory validation

1. Seed (or use an existing test) a user with three active contracts, e.g.:
   - "Zeta Gym" — €120/month
   - "Alpha Internet" — €50/month
   - "Beta Streaming" — €12/month
2. Trigger summary-email generation for that user (e.g. via the existing
   `send-summary-email.ts` script or by calling `NotificationService.sendSummaryEmailForUser`
   directly in a scratch script/test).
3. Inspect the captured `SummaryEmailData.contracts` array (or the rendered HTML/text output)
   and confirm the row order is: Zeta Gym (€120) → Alpha Internet (€50) → Beta Streaming (€12).
4. Repeat with two contracts sharing the same `monthlyCost` and confirm they appear adjacent,
   ordered alphabetically by name.
5. Confirm the HTML and plain-text renditions show the same order (open both outputs from the
   same generated email, e.g. via the existing mailer test fixtures or a manual SMTP capture).

## Success criteria mapping

| Success Criterion | How this quickstart validates it |
|--------------------|-----------------------------------|
| SC-001 | Step 3: verifies non-increasing cost order across 3 distinct-cost contracts |
| SC-002 | Automated test + step 2 rerun: same input → same order every time |
| SC-003 | Step 3: most expensive contract (Zeta Gym) is the first row |
| SC-004 | Existing `notification.service.test.ts` suite (totals, renewals, CTA state, both formats) continues to pass unchanged |
