# Implementation Plan: Logo Proxy with SQLite Cache

**Branch**: `031-logo-proxy-cache` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/031-logo-proxy-cache/spec.md`

## Summary

Add a `GET /api/logos?name={name}` Fastify route that proxies logo image requests to
logo.dev using a server-side `LOGO_DEV_TOKEN` env var, caches successful responses in a new
`logo_cache` SQLite table, and returns cached bytes on subsequent requests. An admin-only
`DELETE /api/admin/logos/cache` endpoint allows cache pruning. The frontend's
`ProviderLogo.tsx` is updated to request logos through the proxy instead of directly from
logo.dev, eliminating the `VITE_LOGO_DEV_TOKEN` build-time variable entirely.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), Node.js 24, ESM modules

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3 12, Zod 3 (no new deps — Node.js 24 native `fetch()` used for proxying)
- Frontend: React 18, Vite 8, TanStack Query 5, Mantine 7

**Storage**: SQLite via better-sqlite3; new `logo_cache` table added via schema.sql + migration guard in `runMigrations()`

**Testing**: Vitest (unit + integration); Playwright (e2e)

**Target Platform**: Linux (Docker), Node.js 24

**Project Type**: Monorepo web application (Fastify backend + React/Vite frontend)

**Performance Goals**: Logo proxy adds negligible latency; cache hit path is a single SQLite SELECT returning a pre-fetched binary blob

**Constraints**: No new npm dependencies; uses existing SQLite connection and Fastify plugin patterns

**Scale/Scope**: Personal-use tool; logo cache expected to hold tens to low hundreds of entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Test-First | Integration tests for `/api/logos` and `DELETE /api/admin/logos/cache` written before implementation; unit test for `logoUrl()` change in frontend | ✅ Planned |
| II. Type Safety | All new route handlers fully typed; DB query result typed; `Buffer` return type explicit; no `any` | ✅ Planned |
| III. Simplicity (YAGNI) | No cache TTL, no eviction policy, no deduplication — minimal for v1; `logoUrl()` change is one line; no new npm packages | ✅ Planned |

**Post-design re-check**: No complexity violations. The new `logo_cache` table is a single DDL statement. The route is ~40 lines. The frontend change is one line in `logoUrl()`. No abstractions introduced beyond a single route file.

## Project Structure

### Documentation (this feature)

```text
specs/031-logo-proxy-cache/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
packages/backend/
├── src/
│   ├── db/
│   │   ├── schema.sql                  ← ADD logo_cache table DDL
│   │   └── client.ts                   ← ADD migration guard in runMigrations()
│   ├── routes/
│   │   ├── logos.ts                    ← NEW: GET /api/logos proxy route
│   │   └── admin.ts                    ← ADD: DELETE /api/admin/logos/cache
│   └── server.ts                       ← REGISTER logosRoutes; ADD /api/logos to PUBLIC_ROUTES
└── tests/
    └── integration/
        ├── logos.route.test.ts         ← NEW: integration tests for logos proxy
        └── admin.route.test.ts         ← ADD: tests for cache prune endpoint

packages/frontend/
├── src/
│   └── components/
│       └── ProviderLogo.tsx            ← UPDATE: logoUrl() uses /api/logos proxy
└── .env                                ← REMOVE VITE_LOGO_DEV_TOKEN
    .env.example                        ← REMOVE VITE_LOGO_DEV_TOKEN

packages/backend/
└── .env.example                        ← ADD LOGO_DEV_TOKEN

docker-compose.yml                      ← ADD LOGO_DEV_TOKEN to environment
```

## Complexity Tracking

No Constitution violations. No entry needed.

---

## Implementation Tasks

### Task 1: Add `logo_cache` table to schema and migration

**Files**: `packages/backend/src/db/schema.sql`, `packages/backend/src/db/client.ts`

Add at the end of `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS logo_cache (
  name         TEXT PRIMARY KEY,
  data         BLOB NOT NULL,
  content_type TEXT NOT NULL,
  cached_at    INTEGER NOT NULL
);
```

Add migration guard in `runMigrations()` in `client.ts` (after existing migration guards):

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

---

### Task 2: Create `logos.ts` route (proxy + cache)

**File**: `packages/backend/src/routes/logos.ts`

Public route (no auth). Logic:

1. Read `name` query param; trim + lowercase; return 400 if blank.
2. Check `logo_cache` for existing row — if found, reply with `data` blob and `content_type`.
3. If not cached: fetch `https://img.logo.dev/name/{encodeURIComponent(name)}?token={token}` using native `fetch()`.
4. If fetch result is not 2xx: return `502 Bad Gateway`; do not cache.
5. If fetch succeeded: read `arrayBuffer()`, get `content-type` header, insert row into `logo_cache`, reply with binary data.
6. Set `Cache-Control: public, max-age=86400` on all 200 responses.

JSDoc required on all functions.

---

### Task 3: Register logos route + public route guard

**File**: `packages/backend/src/server.ts`

- Import and register `logosRoutes`.
- Add to `PUBLIC_ROUTES`:
  ```ts
  (m, p) => m === 'GET' && p === '/api/logos',
  ```

---

### Task 4: Add cache prune endpoint to admin routes

**File**: `packages/backend/src/routes/admin.ts`

Add inside `adminRoutes` (the existing admin hook already enforces the ADMIN role check):

```ts
fastify.delete('/api/admin/logos/cache', async (_request, reply) => {
  const result = fastify.db.prepare('DELETE FROM logo_cache').run();
  return reply.send({ deleted: result.changes });
});
```

JSDoc required.

---

### Task 5: Update `ProviderLogo.tsx`

**File**: `packages/frontend/src/components/ProviderLogo.tsx`

Replace the `logoUrl` implementation:

```ts
// Before
const token = import.meta.env['VITE_LOGO_DEV_TOKEN'] as string | undefined;
return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${token ?? ''}`;

// After
return `/api/logos?name=${encodeURIComponent(name)}`;
```

Remove the `token` variable entirely. Update JSDoc.

---

### Task 6: Environment variable cleanup

- **`packages/frontend/.env`**: Remove `VITE_LOGO_DEV_TOKEN=...`
- **`packages/frontend/.env.example`**: Remove `VITE_LOGO_DEV_TOKEN` line (if present)
- **`packages/backend/.env.example`**: Add:
  ```
  # Logo.dev token for provider logo proxy (get yours at https://logo.dev)
  # LOGO_DEV_TOKEN=pk_your_token_here
  ```
- **`docker-compose.yml`**: Add to `environment`:
  ```yaml
  # LOGO_DEV_TOKEN: pk_your_token_here
  ```

---

### Task 7: Write integration tests

**Files**:
- `packages/backend/tests/integration/logos.route.test.ts` (new)
- `packages/backend/tests/integration/admin.route.test.ts` (extend)

**`logos.route.test.ts`** must cover:
- Returns 400 when `name` is missing
- Returns 400 when `name` is blank/whitespace
- Returns cached blob when entry exists in `logo_cache` (no outbound fetch)
- Stores successful logo.dev response in cache (mock `fetch`)
- Returns 502 when logo.dev fetch fails (mock `fetch`)
- Does not cache non-2xx logo.dev responses (mock `fetch`)
- Sets `Cache-Control: public, max-age=86400` on 200 responses
- Name is normalised to lowercase before cache lookup

**`admin.route.test.ts`** additions:
- `DELETE /api/admin/logos/cache` returns `{ deleted: N }` for admin
- `DELETE /api/admin/logos/cache` returns `{ deleted: 0 }` when cache is empty
- `DELETE /api/admin/logos/cache` returns 403 for a member
- `DELETE /api/admin/logos/cache` returns 401 for unauthenticated request

---

### Task 8: Documentation updates

Per project constitution and CLAUDE.md requirements:

- **`README.md`** + **`README.de.md`**: Note that `LOGO_DEV_TOKEN` replaces `VITE_LOGO_DEV_TOKEN` in the configuration section.
- **`docs/user-guide.md`** + **`docs/user-guide.de.md`**: Document the admin cache prune action (where to find it, what it does, when to use it).
