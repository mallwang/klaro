# Quickstart: Validate Inactive vs Expired Contracts Separation

## Prerequisites

- Backend and frontend running locally (`pnpm dev` from repo root, or per-package dev scripts).
- A logged-in user account with at least:
  - One `ACTIVE` contract with an `endDate` in the past (e.g. yesterday).
  - One `INACTIVE` contract with an `endDate` in the past.
  - One `INACTIVE` contract with no `endDate` (e.g. a lifetime/unset-date contract).

You can create these via the existing Contracts page UI (set status to Inactive in the contract
edit form) or via direct API calls to `POST /api/contracts` / `PATCH /api/contracts/:id`.

## Validation Steps

1. **Expired Contracts excludes inactive rows** (FR-001 / SC-001)
   - Open the Dashboard.
   - Confirm the "Expired Contracts" section lists only the `ACTIVE` contract with the past
     end date.
   - Confirm neither `INACTIVE` contract appears there.

2. **Inactive Contracts section appears, collapsed, muted** (FR-002, FR-003, FR-004, FR-007)
   - On the same Dashboard load, confirm an "Inactive Contracts" section is visible below the
     other sections.
   - Confirm it renders collapsed by default (no contract rows visible without interaction).
   - Confirm its header shows a count (e.g. "2") matching the number of `INACTIVE` contracts.
   - Confirm it is visually muted/gray relative to the other sections.

3. **Expanding reveals all inactive contracts** (FR-002, SC-002)
   - Click/tap the section header to expand it.
   - Confirm both `INACTIVE` contracts are listed (including the one with no `endDate`).

4. **Empty state is omitted** (FR-005)
   - Using a second test user (or after reactivating/deleting all inactive contracts), reload
     the Dashboard.
   - Confirm the "Inactive Contracts" section does not render at all.

5. **Status transition reflects immediately** (Edge case)
   - Reactivate one previously-inactive, past-end-date contract via the Contracts page.
   - Reload the Dashboard.
   - Confirm it now appears under "Expired Contracts" and no longer under "Inactive Contracts".

## Automated coverage (to be added during implementation, per TDD)

- Backend: `packages/backend/src/services/dashboard.test.ts` — assert `getExpiredContracts`
  excludes `INACTIVE` rows; assert `getInactiveContracts` returns all `INACTIVE` rows regardless
  of `endDate`/billing interval.
- Frontend: `packages/frontend/src/components/InactiveContracts.test.tsx` — assert collapsed
  default state, count display, expand-to-reveal behavior, and `null` render when the list is
  empty.
- E2E (Playwright): extend the existing dashboard e2e spec to cover steps 1–4 above.
