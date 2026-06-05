# Data Model: Sortable Contract Table Columns

No new persistent entities are introduced. This feature adds transient view-state only.

## SortColumn (union type)

Identifies which column is currently the sort key.

| Value        | Maps to field on `ContractData` |
|--------------|----------------------------------|
| `'name'`     | `contract.name` (string, case-insensitive) |
| `'category'` | `contract.category` (enum string) |
| `'amount'`   | `contract.amount` (number) |
| `'status'`   | `contract.status` (enum string) |
| `'endDate'`  | `contract.endDate` (ISO date string or null) |

```
type SortColumn = 'name' | 'category' | 'amount' | 'status' | 'endDate';
```

## SortDirection (union type)

```
type SortDirection = 'asc' | 'desc';
```

## SortState (component state shape)

| Field       | Type                    | Description                                      |
|-------------|-------------------------|--------------------------------------------------|
| `column`    | `SortColumn \| null`    | The active sort column, or `null` when unsorted  |
| `direction` | `SortDirection \| null` | The active sort direction, or `null` when unsorted |

**Invariant**: `column` and `direction` are always both null or both non-null.

### Cycle transitions

```
Initial:  { column: null, direction: null }

Click sortable header H:
  if column !== H  → { column: H, direction: 'asc' }
  if direction === 'asc'  → { column: H, direction: 'desc' }
  if direction === 'desc' → { column: null, direction: null }
```

## Comparator logic per column

| Column     | Comparator                                                                 |
|------------|----------------------------------------------------------------------------|
| `name`     | `a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })`         |
| `category` | `a.category.localeCompare(b.category)`                                     |
| `amount`   | `a.amount - b.amount`                                                      |
| `status`   | `a.status.localeCompare(b.status)`                                         |
| `endDate`  | `(a.endDate ?? '9999-99-99').localeCompare(b.endDate ?? '9999-99-99')`     |

Direction modifier: multiply the comparator result by `+1` (asc) or `-1` (desc).

## No backend changes

`ContractData` (defined in `@pcm/shared`) is unchanged. No migration, no new API fields.
