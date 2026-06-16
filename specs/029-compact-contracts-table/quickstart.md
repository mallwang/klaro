# Quickstart Validation: Compact Contracts Table

**Branch**: `029-compact-contracts-table` | **Date**: 2026-06-16

## Prerequisites

- Dev server running (`pnpm dev` from repo root or `packages/frontend`)
- At least one contract in the database with a name longer than 25 characters
- Browser at ~1280px wide (normal desktop)

## Validation Scenarios

### S1: Single-line rows (P1 core goal)

1. Navigate to **Contracts** (`/contracts`).
2. Inspect the contracts table.
3. **Expected**: Every row occupies a single line — no cell content wraps onto a second line at standard desktop width.
4. **Expected**: Rows appear visually tighter than before (less vertical padding per row).

### S2: Long name truncation

1. Ensure a contract with a name > 30 characters exists (create one if needed).
2. Navigate to **Contracts**.
3. **Expected**: The long name is cut off with an ellipsis (`…`) in the Name column. The row height does NOT increase.
4. **Expected**: Hovering over the truncated name shows the full name in the browser's native tooltip (if `title` attribute is added) — or at minimum confirms no layout expansion.

### S3: Edit action button style

1. Navigate to **Contracts**.
2. Inspect the Actions column of any row in default state.
3. **Expected**: "Edit" is rendered as a compact bordered button (`variant="default"`), not as an underlined anchor link.
4. **Expected**: Clicking Edit navigates to `/contracts/:id/edit` — same as before.

### S4: Delete button style (default state)

1. Navigate to **Contracts**.
2. Inspect the Actions column of any row in default state.
3. **Expected**: "Delete" is rendered as a compact bordered button (`variant="default"`), without a red background or red text.

### S5: Delete confirmation style

1. Click the "Delete" button on any contract row.
2. **Expected**: The row switches to confirmation mode showing "Confirm" (filled red button) and "Cancel" (default bordered button).
3. Click Cancel → row returns to default state.
4. Click Delete again → click Confirm → contract is deleted.

### S6: Cross-browser visual comparison with Manage Accounts

1. Open **Manage Accounts** (`/admin/accounts`) in one tab.
2. Open **Contracts** (`/contracts`) in another tab.
3. **Expected**: The action buttons in both tables have the same visual weight and size.

### S7: Regression — sorting still works

1. Navigate to **Contracts** and click the **Name** column header.
2. **Expected**: Rows sort A→Z; clicking again sorts Z→A; clicking a third time resets to default.

### S8: Regression — anonymization still works

1. Enable the global anonymization toggle.
2. Navigate to **Contracts**.
3. **Expected**: Contract names are replaced with fantasy names; the flip animation plays on toggle.

## Running Unit Tests

```bash
pnpm --filter frontend test --run ContractTable
```

**Expected**: All tests green, including the updated test verifying Edit renders as a `button` role element (not a `link` role element).
