# Research: Logo Proxy with SQLite Cache

## HTTP Client for Server-Side Fetching

**Decision**: Use Node.js 24 native `fetch()` — no additional dependency needed.

**Rationale**: Node.js 24 ships with a stable, spec-compliant `fetch()` implementation. The project already targets Node.js 24 (locked in `package.json` `engines`). Adding `undici` or `node-fetch` would introduce an unneeded dependency. `fetch()` supports streaming and `arrayBuffer()` for binary payloads, which is exactly what we need to proxy image blobs.

**Alternatives considered**:
- `undici` (what Node's built-in fetch is based on): no meaningful advantage over native fetch for this use case.
- `axios`: significantly heavier, introduces a CommonJS dependency in an ESM project.
- `node-fetch`: legacy; not needed when native fetch is available.

---

## SQLite Binary Storage

**Decision**: Store logo image bytes as `BLOB` in a `logo_cache` table using `better-sqlite3`'s native `Buffer` binding.

**Rationale**: `better-sqlite3` maps SQLite `BLOB` columns to Node.js `Buffer` objects transparently. Storing images in SQLite co-locates the cache with the application's existing data volume, requiring no additional infrastructure (no filesystem volume, no Redis, no separate cache server). The Docker `data/` volume already persists the database, so the cache automatically survives restarts.

**Alternatives considered**:
- Filesystem cache (`data/logos/<name>.png`): would require managing a separate directory in Docker volumes and handling filenames with special characters.
- In-memory LRU cache: not durable across restarts; logos may need to be re-fetched on every restart.
- Redis: operational overhead unjustified for a personal-use tool.

---

## Schema Migration Strategy

**Decision**: Add `logo_cache` to `schema.sql` with `CREATE TABLE IF NOT EXISTS`, plus an inline migration guard in `runMigrations()` in `db/client.ts`.

**Rationale**: The project's migration pattern (seen in `db/client.ts`) is to run `schema.sql` for new databases and add incremental guards in `runMigrations()` for existing databases. The same pattern applies here: fresh databases pick up the table from `schema.sql`; existing databases get it from the migration guard.

**Migration guard pattern**:
```ts
const hasLogoCache = instance.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='logo_cache'"
).get();
if (!hasLogoCache) {
  instance.exec(`CREATE TABLE logo_cache (
    name         TEXT PRIMARY KEY,
    data         BLOB NOT NULL,
    content_type TEXT NOT NULL,
    cached_at    INTEGER NOT NULL
  )`);
}
```

---

## Cache Key Normalisation

**Decision**: Normalise the cache key to lowercase trimmed name.

**Rationale**: `"Netflix"` and `"netflix"` are the same logo. Lowercasing before lookup and before insertion avoids duplicate rows for the same provider with different capitalisation. The logo.dev API is case-insensitive anyway (`/name/Netflix` and `/name/netflix` return the same image).

---

## Public Route for `/api/logos`

**Decision**: Add `/api/logos` to `PUBLIC_ROUTES` in `server.ts`.

**Rationale**: Logo images are non-sensitive. Adding an authentication requirement would break the `<img src="/api/logos?name=Netflix">` pattern used in the frontend (browsers do not automatically attach cookies to image `src` requests in all contexts). Consistent with how images are typically served on the web.

---

## Error Handling: Non-2xx from logo.dev

**Decision**: Forward the status code from logo.dev (or a `502 Bad Gateway`) to the client; do not cache error responses.

**Rationale**: When logo.dev returns 404 (unknown provider) or 403 (invalid token), the frontend's `onError` handler on the `<img>` element will fire and fall back to the building icon. Caching errors would permanently suppress logos for misspelled names entered during the cache warm-up period.

---

## Frontend Integration

**Decision**: Update `ProviderLogo.tsx` to build the URL as `/api/logos?name={encodeURIComponent(name)}` — no auth headers or fetch calls needed; the `<img src>` attribute handles the request.

**Rationale**: The existing `logoUrl()` helper already produces a URL string used as an `<img src>`. Replacing the logo.dev URL with the proxy URL is a one-line change. The browser's native image loading handles caching at the HTTP level; no React Query fetch hook is needed.
