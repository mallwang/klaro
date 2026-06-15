# Quickstart Validation Guide: Compact Contract Form Layout

**Feature**: 026-compact-contract-form

## Prerequisites

- Node.js LTS installed, `pnpm` available
- Repository cloned and dependencies installed (`pnpm install`)

## Run Unit Tests

```bash
cd packages/frontend
pnpm test --run
```

All `ContractForm` tests must pass (including the new layout-grouping tests written before implementation).

## Run the Dev Server

```bash
pnpm --filter frontend dev
```

Open `http://localhost:5173` in a browser, sign in, and navigate to **Add Contract**.

## Validate the Layout (Desktop — 1280 px wide)

| Field Row | Expected Appearance |
|-----------|---------------------|
| Name + Category | Side by side, equal width |
| Amount + Billing Interval | Side by side, equal width |
| Status + Start Date + End Date | Three equal columns in one row |
| Cancellation Period | Number + unit inputs occupy the left half of the form only |
| Details, Service URL, Anonymize, Buttons | Full width (unchanged) |

## Validate Responsiveness (Mobile — 375 px wide)

Use browser DevTools responsive mode at 375 × 812 px (iPhone SE).

- All rows collapse to a single column
- No horizontal scrollbar appears
- All fields remain reachable

## Validate Functional Behaviour

1. Fill in Name, Amount, and click **Save** without a Name → validation error appears
2. Fill in all fields and click **Save** → contract is created and list page is shown
3. Open an existing contract via **Edit** → all pre-filled values appear in correct field positions

## Validate Edit Mode

Navigate to any existing contract and click **Edit**. Confirm:
- Pre-filled name and category appear side by side
- Pre-filled status, start date, and end date appear in the three-column row
