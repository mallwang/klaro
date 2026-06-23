# API Contract: `GET /api/dashboard`

Existing endpoint (`packages/backend/src/routes/dashboard.ts`), response shape extended.

## Response body change

```diff
 {
   "totalMonthlySpending": number,
   "contractsByCategory": CategorySummary[],
   "upcomingRenewals": UpcomingRenewal[],
-  "expiredContracts": ExpiredContract[]
+  "expiredContracts": ExpiredContract[],   // now only status === 'ACTIVE'
+  "inactiveContracts": InactiveContract[]   // new
 }
```

### `InactiveContract`

```ts
{
  id: string;            // uuid
  name: string;
  category: Category;
  endDate: string | null; // YYYY-MM-DD, nullable
  anonymize: boolean;
  logoName: string | null;
  useGenericIcon: boolean;
}
```

## Behavioral contract

- `expiredContracts` MUST only contain contracts with `status === 'ACTIVE'` whose `endDate` is in
  the past (existing date/billing-interval rules unchanged).
- `inactiveContracts` MUST contain every contract with `status === 'INACTIVE'` owned by the
  requesting user, regardless of `endDate` or billing interval, sorted by name.
- Both arrays are scoped to the authenticated user (`user_id`), consistent with every other
  field in this response.
- No breaking change to existing consumers of `expiredContracts`/other fields — this is a
  superset response (new field added, one field's row-set narrowed per FR-001, which is the bug
  fix this feature implements).
