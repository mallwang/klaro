# Quickstart Validation Guide: Logo Proxy with SQLite Cache

## Prerequisites

- Node.js 24 + pnpm installed
- A running instance of the app (`pnpm dev` from repo root, or Docker)
- A valid `LOGO_DEV_TOKEN` set in `packages/backend/.env` (or Docker env)

---

## Scenario 1: Logo served via proxy on first request

**Setup**: Start the dev server with `LOGO_DEV_TOKEN` set.

```bash
# packages/backend/.env
LOGO_DEV_TOKEN=pk_dTJBcEKxQgCQUZhio2o9Vw
```

**Validate**:
1. Open the contract list in the browser.
2. Open DevTools → Network tab → filter by `logos`.
3. Observe requests to `/api/logos?name=...` (not to `img.logo.dev`).
4. Each request returns 200 with a binary image body and `image/*` content type.

**Expected outcome**: Provider logos appear; no outbound `logo.dev` requests visible in browser network tab.

---

## Scenario 2: Cache hit on second request

**Setup**: After Scenario 1, inspect the SQLite database.

```bash
sqlite3 data/contracts.db "SELECT name, content_type, cached_at FROM logo_cache LIMIT 10;"
```

**Validate**:
1. Rows appear for each provider name that was loaded.
2. Reload the contract list page.
3. In server logs, confirm no outbound fetch to `img.logo.dev` for cached names.

**Expected outcome**: Cache contains rows; reload does not trigger logo.dev traffic.

---

## Scenario 3: Cache survives server restart

**Setup**: Rows exist in `logo_cache` (from Scenario 2).

**Validate**:
1. Stop and restart the backend.
2. Reload the contract list.
3. Logos appear immediately (served from cache without logo.dev calls).

**Expected outcome**: Cache persists across restarts.

---

## Scenario 4: Admin prune endpoint

**Setup**: Cache contains entries. Sign in as an admin.

```bash
curl -X DELETE http://localhost:3000/api/admin/logos/cache \
  -H "Cookie: session=<admin-session-cookie>" \
  -v
```

**Expected outcome**:
- Response `200 { "deleted": N }` where N > 0.
- `sqlite3 data/contracts.db "SELECT COUNT(*) FROM logo_cache;"` returns `0`.
- Next logo load re-fetches from logo.dev and repopulates the cache.

---

## Scenario 5: Non-admin prune attempt

```bash
curl -X DELETE http://localhost:3000/api/admin/logos/cache \
  -H "Cookie: session=<member-session-cookie>" \
  -v
```

**Expected outcome**: `403 Forbidden` — cache unchanged.

---

## Scenario 6: Missing LOGO_DEV_TOKEN

**Setup**: Remove or blank out `LOGO_DEV_TOKEN`. Restart the backend.

**Validate**: Navigate to the contract list.

**Expected outcome**: All logos display the building icon fallback; no errors in the console or server logs beyond a non-2xx response from logo.dev being logged at debug level.

---

## Scenario 7: Invalid / empty name

```bash
curl "http://localhost:3000/api/logos?name=" -v
curl "http://localhost:3000/api/logos" -v
```

**Expected outcome**: Both return `400 Bad Request`.

---

## Running Tests

```bash
# Backend unit + integration tests
pnpm --filter @pcm/backend test

# Type-check all packages
pnpm -r tsc --noEmit
```

All tests must pass before the feature is merged.

---

## Docker Validation

```yaml
# docker-compose.yml — add this environment variable
environment:
  LOGO_DEV_TOKEN: pk_dTJBcEKxQgCQUZhio2o9Vw
```

```bash
docker compose up
```

Open `http://localhost:3001` → contract list → logos should appear.
Browser DevTools Network tab must show requests to `localhost:3001/api/logos?name=…`, not to `img.logo.dev`.
