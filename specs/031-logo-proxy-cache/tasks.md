# Tasks: Logo Proxy with SQLite Cache

**Input**: Design documents from `specs/031-logo-proxy-cache/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Tests**: Included — Constitution Principle I (Test-First) is NON-NEGOTIABLE. Tests MUST be
written and confirmed to FAIL before the corresponding implementation task.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Maps to user stories US1, US2, US3 from spec.md

---

## Phase 1: Setup

**Purpose**: Environment configuration so the feature can be developed and tested locally.

- [ ] T001 Add `LOGO_DEV_TOKEN` entry to `packages/backend/.env.example` (commented out, with description)
- [ ] T002 [P] Add commented `LOGO_DEV_TOKEN` entry to `docker-compose.yml` environment section

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SQLite schema changes that all three user stories depend on. Must be complete before any user story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Add `CREATE TABLE IF NOT EXISTS logo_cache …` DDL block at the end of `packages/backend/src/db/schema.sql` (columns: `name TEXT PRIMARY KEY`, `data BLOB NOT NULL`, `content_type TEXT NOT NULL`, `cached_at INTEGER NOT NULL`)
- [ ] T004 Add migration guard for `logo_cache` table in `runMigrations()` in `packages/backend/src/db/client.ts` — check `sqlite_master`, create table only if absent; add JSDoc

**Checkpoint**: `logo_cache` table is created on both fresh and migrated databases. Verify by running `pnpm --filter @pcm/backend test` — existing tests must remain green.

---

## Phase 3: User Story 1 — Provider Logos Load in Docker Deployment (Priority: P1) 🎯 MVP

**Goal**: The backend proxies logo.dev image requests using a server-side token; the browser never contacts logo.dev directly.

**Independent Test**: Start the app with `LOGO_DEV_TOKEN` set, open the contract list, confirm logos appear and DevTools shows requests only to `/api/logos?name=…`, not to `img.logo.dev`.

### Tests for User Story 1 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T005 [P] [US1] Create `packages/backend/tests/integration/logos.route.test.ts` — write failing tests for: GET `/api/logos?name=Netflix` returns 200 with binary body and `image/*` content type (mock `fetch` to return a fake PNG buffer); sets `Cache-Control: public, max-age=86400`; GET `/api/logos` (missing name) returns 400; GET `/api/logos?name=` (blank name) returns 400; logo.dev non-2xx causes 502 response (mock `fetch` to return 404)
- [ ] T006 [P] [US1] Add test to `packages/backend/tests/integration/logos.route.test.ts` — non-2xx from logo.dev does NOT insert a row into `logo_cache`

### Implementation for User Story 1

- [ ] T007 [US1] Create `packages/backend/src/routes/logos.ts`: export `logosRoutes` Fastify plugin; implement `GET /api/logos` — validate `name` param (trim+lowercase, 400 if blank); check `logo_cache`; if miss: fetch `https://img.logo.dev/name/{encodedName}?token=${LOGO_DEV_TOKEN}`; if non-2xx return 502; otherwise insert into `logo_cache` and reply with binary; if hit: reply from cache. Set `Cache-Control: public, max-age=86400` on all 200 responses. Full JSDoc on all functions.
- [ ] T008 [US1] Register `logosRoutes` in `packages/backend/src/server.ts` and add `(m, p) => m === 'GET' && p === '/api/logos'` to `PUBLIC_ROUTES`
- [ ] T009 [US1] Update `logoUrl()` in `packages/frontend/src/components/ProviderLogo.tsx` — replace logo.dev URL with `/api/logos?name=${encodeURIComponent(name)}`; remove `token` variable and `import.meta.env` reference; update JSDoc
- [ ] T010 [US1] Remove `VITE_LOGO_DEV_TOKEN=…` line from `packages/frontend/.env`

**Checkpoint**: US1 fully testable. Run `pnpm --filter @pcm/backend test` — all logos tests pass. Start dev server, open contract list, confirm logos load via `/api/logos` with no browser requests to `img.logo.dev`.

---

## Phase 4: User Story 2 — Logos Served from Cache (Priority: P2)

**Goal**: Repeat logo requests are served from SQLite without any outbound call to logo.dev.

**Independent Test**: Inspect `logo_cache` rows after first load; reload the page; confirm no fresh logo.dev call in server logs (mock spy in tests).

### Tests for User Story 2 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T011 [P] [US2] Add tests to `packages/backend/tests/integration/logos.route.test.ts` — cache hit: pre-insert a row into `logo_cache`, call `GET /api/logos?name=…`, assert `fetch` was NOT called (spy/mock) and response body matches the pre-inserted blob
- [ ] T012 [P] [US2] Add test — name normalisation: pre-insert cache row with key `"netflix"`, request `GET /api/logos?name=Netflix`, assert cache hit (no fetch call)

### Implementation for User Story 2

- [ ] T013 [US2] Verify cache lookup in `logos.ts` uses `name.trim().toLowerCase()` as the key for both SELECT and INSERT — adjust if needed after running T011/T012 tests; no separate file needed if already correct from T007

**Checkpoint**: US2 fully testable. `pnpm --filter @pcm/backend test` passes. Cache hit path confirmed by test spy — zero outbound calls for cached names.

---

## Phase 5: User Story 3 — Admin Can Prune the Logo Cache (Priority: P3)

**Goal**: An admin can wipe the logo cache via a single API call; subsequent logo requests re-fetch from logo.dev.

**Independent Test**: Populate cache, call `DELETE /api/admin/logos/cache` as admin, confirm `{ deleted: N }` response and `logo_cache` is empty.

### Tests for User Story 3 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T014 [P] [US3] Add tests to `packages/backend/tests/integration/admin.route.test.ts` — `DELETE /api/admin/logos/cache`: returns `{ deleted: N }` for admin with N rows in cache; returns `{ deleted: 0 }` when cache is already empty; returns 403 for a member; returns 401 for unauthenticated request

### Implementation for User Story 3

- [ ] T015 [US3] Add `DELETE /api/admin/logos/cache` handler inside `adminRoutes()` in `packages/backend/src/routes/admin.ts` — run `DELETE FROM logo_cache`, return `{ deleted: result.changes }`; add JSDoc

**Checkpoint**: US3 fully testable. All admin route tests pass. Prune endpoint returns correct `deleted` count and 403/401 for non-admins.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, env cleanup, and quality validation.

- [ ] T016 [P] Update `README.md` — replace `VITE_LOGO_DEV_TOKEN` reference with `LOGO_DEV_TOKEN`; document that the backend proxies logo.dev requests
- [ ] T017 [P] Update `README.de.md` — same changes as T016, in German; keep consistent with T016
- [ ] T018 [P] Update `docs/user-guide.md` — add section on admin logo cache prune: where to find it, what it does, when to use it
- [ ] T019 [P] Update `docs/user-guide.de.md` — same content as T018, in German; keep consistent with T018
- [ ] T020 Run full test suite and type-check: `pnpm -r tsc --noEmit && pnpm --filter @pcm/backend test && pnpm --filter @pcm/frontend test` — all must pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately; tasks T001 and T002 are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — tests T005/T006 can be written in parallel; implementation T007→T008→T009/T010 sequential within story
- **Phase 4 (US2)**: Depends on Phase 3 completion (cache logic lives in `logos.ts`)
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel with Phase 3 and 4 after foundational is done
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5 completion; documentation tasks T016–T019 are parallel

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 (logo_cache table exists)
- **US2 (P2)**: Depends on US1 implementation being in place (cache logic is in `logos.ts`)
- **US3 (P3)**: Depends only on Phase 2 (logo_cache table exists) — can be done in parallel with US1

### Within Each User Story

1. Test tasks MUST be written first and confirmed to FAIL (Red)
2. Implement until tests pass (Green)
3. Refactor while keeping tests green

### Parallel Opportunities

- T001 ‖ T002 (both Phase 1, different files)
- T003 → T004 (schema first, then migration guard — sequential, both in Phase 2)
- T005 ‖ T006 (different test cases, same file — write together)
- T011 ‖ T012 (both US2 test additions)
- T016 ‖ T017 ‖ T018 ‖ T019 (all Polish docs, independent files)
- US3 (T014, T015) can run in parallel with US1 (T005–T010) once Phase 2 is complete

---

## Parallel Example: Phase 3 (US1)

```text
# Write tests first (parallel):
T005: logos.route.test.ts — proxy + error tests
T006: logos.route.test.ts — non-2xx not cached test

# Confirm both FAIL, then implement sequentially:
T007: logos.ts route (proxy + cache logic)
T008: register in server.ts + PUBLIC_ROUTES

# Parallel after T009 unblocked:
T009: ProviderLogo.tsx update
T010: remove VITE_LOGO_DEV_TOKEN from .env
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: User Story 1 (T005–T010)
4. **STOP AND VALIDATE**: Logos appear via proxy in both dev and Docker; no browser calls to logo.dev
5. Deployable at this point — US2 and US3 are enhancements

### Incremental Delivery

1. Setup + Foundational → table exists
2. US1 → logos work via proxy (MVP)
3. US2 → cache behaviour verified by tests (likely already working from US1 implementation)
4. US3 → admin prune available
5. Polish → docs updated, full suite green

---

## Notes

- `[P]` tasks modify different files and have no incomplete task dependencies — safe to run in parallel
- Constitution Principle I (TDD): tests MUST fail before implementation — do not skip Red phase
- Constitution Principle II (Type Safety): all new functions must be fully typed, no implicit `any`
- Constitution Principle III (YAGNI): no TTL, no eviction, no deduplication — only what the spec requires
- `fetch()` is native in Node.js 24 — no new npm dependency needed for the proxy
- Vitest mocking via `vi.spyOn(globalThis, 'fetch')` or `vi.fn()` for the logo.dev HTTP call in tests
