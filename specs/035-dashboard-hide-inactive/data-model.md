# Data Model: Separate Inactive Contracts from Expired Contracts on Dashboard

No database schema changes. This feature only changes which existing `contracts` rows are
selected into which dashboard response field.

## Existing Entity (unchanged)

### Contract (`contracts` table)

Relevant existing fields (see `packages/shared/src/schemas/contract.ts` and
`packages/backend/src/db/client.ts`):

| Field      | Type                          | Notes                                              |
|------------|-------------------------------|-----------------------------------------------------|
| `status`   | `'ACTIVE' \| 'INACTIVE'`      | Manually set by the user; DB `CHECK` constraint     |
| `endDate`  | `string (YYYY-MM-DD) \| null` | Nullable; LIFETIME contracts may have no end date   |
| `category`, `name`, `anonymize`, `logoName`, `useGenericIcon` | — | Already exposed in other dashboard sections |

## New / Changed Response Shapes (`packages/shared/src/schemas/dashboard.ts`)

### `InactiveContractSchema` (new)

| Field           | Type                            | Notes                                                  |
|------------------|----------------------------------|---------------------------------------------------------|
| `id`             | `string` (uuid)                 | Contract id                                              |
| `name`           | `string`                        | Subject to anonymization on the frontend                |
| `category`       | `CategoryEnum`                  | Same enum reused from other dashboard sections           |
| `endDate`        | `string (YYYY-MM-DD) \| null`   | Nullable — INACTIVE contracts may lack an end date       |
| `anonymize`      | `boolean`                       | Per-contract anonymize flag (existing invariant applies) |
| `logoName`       | `string \| null`                | Provider logo, same as other sections                    |
| `useGenericIcon` | `boolean`                       | Same as other sections                                   |

Unlike `ExpiredContractSchema`, there is no `daysOverdue` field — "inactive" is a status, not a
date-derived metric, so no day-count is computed.

### `DashboardResponseSchema` (changed)

Adds one field:

```ts
inactiveContracts: z.array(InactiveContractSchema)
```

Existing fields (`totalMonthlySpending`, `contractsByCategory`, `upcomingRenewals`,
`expiredContracts`) are unchanged in shape. `expiredContracts` rows are unchanged in shape but
narrower in scope (see Query Changes below).

## Query Changes (`packages/backend/src/services/dashboard.ts`)

### `getExpiredContracts` (changed)

Add `AND status = 'ACTIVE'` to the existing `WHERE` clause. No change to selected columns or
output mapping — only the result set shrinks to exclude `INACTIVE` rows.

### `getInactiveContracts` (new, private method)

```sql
SELECT id, name, category, end_date, anonymize, logo_name, use_generic_icon
FROM contracts
WHERE status = 'INACTIVE'
  AND user_id = ?
ORDER BY name COLLATE NOCASE
```

Row mapping mirrors `getExpiredContracts`'s mapper, minus the `daysOverdue` computation, and
passes `end_date` straight through as nullable `endDate`.

`getDashboardData` calls this new method and includes the result under `inactiveContracts` in
the returned `DashboardResponse`.

## State Transitions

No new states are introduced. `status` already toggles between `ACTIVE` and `INACTIVE` via
existing contract-edit flows; this feature only changes how the dashboard reads that existing
field. A contract moving from `ACTIVE` to `INACTIVE` (or vice versa) is reflected on next
dashboard load with no additional logic required.
