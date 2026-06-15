# Data Model: Scheduled Summary Email

## Schema Changes

### `users` table — two new columns (migration-guarded)

| Column | Type | Constraint | Default | Notes |
|---|---|---|---|---|
| `summary_email_enabled` | `INTEGER` | `NOT NULL` | `0` | Boolean flag: 0 = disabled, 1 = enabled |
| `summary_email_frequency` | `TEXT` | `CHECK(... IN ('WEEKLY','MONTHLY'))` | `NULL` | NULL when disabled; required when enabled |

Migration guard (follows existing `PRAGMA table_info` pattern in `client.ts`):

```sql
-- Guard: only add columns when they are absent
ALTER TABLE users ADD COLUMN summary_email_enabled   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN summary_email_frequency TEXT
  CHECK(summary_email_frequency IN ('WEEKLY','MONTHLY'));
```

Also update `schema.sql` so fresh deployments include the columns from the start.

---

## Computed Entities (not persisted)

### `NotificationPreferences`

Returned by `GET /api/profile/notification-preferences`. Derived from user row + next-send calculation.

```ts
interface NotificationPreferences {
  summaryEmailEnabled: boolean;
  summaryEmailFrequency: 'WEEKLY' | 'MONTHLY' | null;
  nextSendAt: string | null;   // ISO 8601 UTC datetime; null when disabled
}
```

### `SummaryEmailData`

Assembled at send time for a single user. Not stored.

```ts
type CtaState = 'cancellation-due' | 'no-contracts' | 'none';

interface ContractRow {
  name: string;           // anonymized placeholder when anonymize = true
  billingInterval: string;
  monthlyCost: number;
  anonymize: boolean;
}

interface RenewalRow {
  name: string;           // anonymized placeholder when anonymize = true
  endDate: string;        // YYYY-MM-DD
  cancellationDeadline: string;  // YYYY-MM-DD
  daysUntilDeadline: number;
  anonymize: boolean;
}

interface SummaryEmailData {
  userEmail: string;
  displayName: string;
  totalMonthlySpending: number;
  contracts: ContractRow[];
  upcomingRenewals: RenewalRow[];
  ctaState: CtaState;
  dashboardUrl: string;
}
```

---

## Entity Relationships

```
users
  ├── summary_email_enabled   (new)
  ├── summary_email_frequency (new)
  └── [all existing columns unchanged]

contracts
  └── [unchanged — queried at send time to build SummaryEmailData]
```

No new foreign keys or join tables are introduced.

---

## Validation Rules

| Field | Rule |
|---|---|
| `summaryEmailFrequency` | Required when `summaryEmailEnabled` is `true`; rejected otherwise |
| `summaryEmailFrequency` value | Must be `'WEEKLY'` or `'MONTHLY'` |
| Setting `summaryEmailEnabled = false` | Clears `summaryEmailFrequency` to `NULL` in the database |
