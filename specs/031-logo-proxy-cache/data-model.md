# Data Model: Logo Proxy with SQLite Cache

## New Entity: LogoCacheEntry

Stored in the `logo_cache` SQLite table.

| Column         | SQLite Type | Constraints                | Description                                              |
|----------------|-------------|----------------------------|----------------------------------------------------------|
| `name`         | TEXT        | PRIMARY KEY                | Lowercased, trimmed provider name used as the cache key  |
| `data`         | BLOB        | NOT NULL                   | Raw image bytes as returned by logo.dev                  |
| `content_type` | TEXT        | NOT NULL                   | MIME type from logo.dev (e.g. `image/png`, `image/svg+xml`) |
| `cached_at`    | INTEGER     | NOT NULL                   | Unix epoch seconds at insertion time                     |

### DDL

```sql
CREATE TABLE IF NOT EXISTS logo_cache (
  name         TEXT PRIMARY KEY,
  data         BLOB NOT NULL,
  content_type TEXT NOT NULL,
  cached_at    INTEGER NOT NULL
);
```

### Access Patterns

| Operation       | Query                                              | Used by               |
|-----------------|----------------------------------------------------|-----------------------|
| Cache lookup    | `SELECT data, content_type FROM logo_cache WHERE name = ?` | `GET /api/logos`  |
| Cache insert    | `INSERT OR REPLACE INTO logo_cache …`              | `GET /api/logos`  |
| Cache prune     | `DELETE FROM logo_cache`                           | `DELETE /api/admin/logos/cache` |
| Count after prune | `changes()` (SQLite row count from last statement) | admin response body |

### Validation Rules

- `name` is normalised (lowercased + trimmed) before lookup and insertion; the original name from logo.dev is not stored.
- Only responses with HTTP 2xx status from logo.dev are inserted.
- A subsequent request for a cached name overwrites (`INSERT OR REPLACE`) — no stale checks in v1.

---

## Existing Entities (unchanged)

No changes to `users`, `sessions`, `contracts`, `invitations`, or any other existing table.

---

## Migration Strategy

Added as:
1. A `CREATE TABLE IF NOT EXISTS logo_cache …` block at the end of `schema.sql` (picked up by fresh database initialisation).
2. An inline guard in `runMigrations()` in `packages/backend/src/db/client.ts` (picked up by existing databases):

```ts
const hasLogoCache = instance
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='logo_cache'")
  .get();
if (!hasLogoCache) {
  instance.exec(`CREATE TABLE logo_cache (
    name         TEXT PRIMARY KEY,
    data         BLOB NOT NULL,
    content_type TEXT NOT NULL,
    cached_at    INTEGER NOT NULL
  )`);
}
```
