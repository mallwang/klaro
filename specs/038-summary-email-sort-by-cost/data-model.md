# Phase 1 Data Model: Summary Email Table Sorted by Monthly Cost

No new entities, fields, or persisted state are introduced by this feature. It reorders an
existing in-memory collection before it is handed to the email renderer.

## Contract (summary-email row)

Existing shape, already defined via `SummaryEmailData['contracts']` in
`packages/shared/src/types/user.ts` and produced in
`packages/backend/src/services/notification.service.ts`. No fields are added or removed.

| Field            | Type              | Role in this feature                                   |
|------------------|-------------------|----------------------------------------------------------|
| `name`           | `string`          | Tie-break sort key (case-insensitive, ascending)          |
| `billingInterval`| `BillingInterval` | Unaffected — display only                                 |
| `monthlyCost`    | `number`          | Primary sort key (descending)                             |
| `anonymize`      | `boolean`         | Unaffected — display-masking only, not part of sort logic |

## Ordering rule (derived, not persisted)

```text
sort(contracts) by:
  1. monthlyCost   DESC
  2. name          ASC, case-insensitive   (tie-break)
```

This ordering is computed at email-generation time in `NotificationService` and is not stored;
regenerating the email for the same underlying contract data always yields the same order
(SC-002), because the comparator is a pure function of `monthlyCost` and `name`.

## State transitions

None. This feature does not add, remove, or transition any entity state — it only changes the
iteration order of an already-filtered (`status = 'ACTIVE'`) read-only list.
