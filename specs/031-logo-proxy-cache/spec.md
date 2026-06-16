# Feature Specification: Logo Proxy with Cache

**Feature Branch**: `031-logo-proxy-cache`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Backend proxy for logo.dev with SQLite cache. Add a GET /api/logos?name={name} endpoint that proxies image requests to logo.dev using a server-side LOGO_DEV_TOKEN env var. Cache responses durably in a new SQLite logo_cache table (columns: name TEXT PRIMARY KEY, data BLOB, content_type TEXT, cached_at INTEGER). Add an admin-only DELETE /api/admin/logos/cache endpoint to prune the cache. Update ProviderLogo.tsx to call the proxy endpoint instead of logo.dev directly. Add LOGO_DEV_TOKEN to docker-compose.yml environment section and backend .env.example. No VITE_LOGO_DEV_TOKEN needed anymore."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provider Logos Load in Docker Deployment (Priority: P1)

As a self-hosted user pulling the pre-built Docker image, I want provider logos to appear in the contract list and contract form without requiring me to rebuild the image or expose any token to the browser, so that I can simply set an environment variable and have logos work.

**Why this priority**: This is the primary motivation for the feature — the current build-time approach breaks for pre-built Docker images. Without this, logos simply never appear in a Docker deployment.

**Independent Test**: Can be tested by spinning up the Docker container with `LOGO_DEV_TOKEN` set, navigating to the contract list, and verifying logos appear for contracts with provider names.

**Acceptance Scenarios**:

1. **Given** the application is running in Docker with `LOGO_DEV_TOKEN` set, **When** a user views the contract list, **Then** provider logos are fetched through the backend and displayed for each contract.
2. **Given** the application is running in Docker with `LOGO_DEV_TOKEN` unset or empty, **When** a user views the contract list, **Then** the generic building icon is shown as a fallback (graceful degradation, no errors).
3. **Given** the application is running, **When** the browser's network traffic is inspected, **Then** no request to `logo.dev` is visible — only requests to the application's own domain appear.

---

### User Story 2 - Logos Are Served From Cache (Priority: P2)

As a user navigating between pages repeatedly, I want previously fetched logos to be served instantly from a server-side cache, so that repeated page loads are fast and do not repeatedly call the external logo service.

**Why this priority**: Reduces external API calls and improves perceived performance for repeat visits — a direct quality-of-life gain.

**Independent Test**: Can be tested by inspecting the SQLite database after the first logo load and confirming a row exists in `logo_cache`, then reloading and verifying no outbound call to logo.dev was made.

**Acceptance Scenarios**:

1. **Given** a provider logo has been fetched once, **When** the same provider name is requested again, **Then** the response is served from the local cache without making an outbound call to logo.dev.
2. **Given** the cache contains a logo, **When** the server restarts, **Then** the cached logo is still served (cache survives restarts — it is durable in SQLite).
3. **Given** a logo fetch from logo.dev fails (e.g. network error or unknown provider), **When** the proxy receives the error response, **Then** the frontend receives an appropriate non-200 status and falls back to the building icon; the failed lookup is not cached.

---

### User Story 3 - Admin Can Prune the Logo Cache (Priority: P3)

As an administrator, I want to be able to clear the logo cache, so that outdated or stale logos are refreshed on the next request without requiring a server restart or database access.

**Why this priority**: Logos change infrequently, but when a provider updates their branding, the admin needs a way to force a refresh without manual database intervention.

**Independent Test**: Can be tested by populating the cache, calling the admin prune endpoint, and confirming the cache table is empty and subsequent logo requests trigger fresh fetches.

**Acceptance Scenarios**:

1. **Given** the cache contains entries, **When** an admin calls the prune endpoint, **Then** all entries are deleted and subsequent logo requests fetch fresh images from logo.dev.
2. **Given** a non-admin user calls the prune endpoint, **When** the server processes the request, **Then** it responds with a 403 Forbidden and the cache is unchanged.
3. **Given** the cache is already empty, **When** an admin calls the prune endpoint, **Then** the endpoint succeeds with a 200 response indicating zero entries were removed.

---

### Edge Cases

- What happens when `name` is an empty string or whitespace? The proxy should return a 400 error; the frontend already suppresses requests for empty names.
- What happens when logo.dev returns a non-image content type? The proxy forwards the status and content type as-is; if non-2xx, the frontend falls back to the building icon.
- What happens when the logo.dev request times out? The proxy returns an error status; the frontend falls back gracefully.
- What happens when the same name is requested concurrently before it is cached? The first request populates the cache; subsequent requests may briefly hit logo.dev in parallel but all subsequent calls serve from cache. No deduplication is required for v1.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a publicly accessible `GET /api/logos?name={name}` endpoint that fetches and returns logo images for the given provider name.
- **FR-002**: The proxy endpoint MUST use the `LOGO_DEV_TOKEN` environment variable on the server to authenticate with logo.dev — the token MUST NOT be sent to the browser.
- **FR-003**: Successful logo responses MUST be stored durably in the SQLite database in a `logo_cache` table with columns: `name TEXT PRIMARY KEY`, `data BLOB`, `content_type TEXT`, `cached_at INTEGER`.
- **FR-004**: On subsequent requests for a cached provider name, the system MUST serve the response from the cache without making an outbound call to logo.dev.
- **FR-005**: The cache MUST survive server restarts (durability provided by SQLite persistence).
- **FR-006**: Only logo responses with a successful status from logo.dev MUST be cached; error responses MUST NOT be stored.
- **FR-007**: The system MUST provide an admin-only `DELETE /api/admin/logos/cache` endpoint that removes all entries from the logo cache and returns the count of deleted rows.
- **FR-008**: The prune endpoint MUST return `403 Forbidden` for non-admin authenticated users and `401 Unauthorized` for unauthenticated requests.
- **FR-009**: The frontend's `ProviderLogo` component MUST be updated to request logos through `/api/logos?name={name}` instead of directly from logo.dev.
- **FR-010**: The `VITE_LOGO_DEV_TOKEN` environment variable MUST be removed from the frontend; `LOGO_DEV_TOKEN` MUST be documented in the backend `.env.example` and `docker-compose.yml`.
- **FR-011**: When `LOGO_DEV_TOKEN` is not set, the proxy MUST still function but will receive an authentication error from logo.dev; the frontend MUST fall back to the building icon.
- **FR-012**: The proxy endpoint MUST be accessible without authentication (public route), as logos are non-sensitive and are needed on pages visible to all authenticated users.

### Key Entities

- **LogoCacheEntry**: A cached logo record identified by provider name. Stores the raw image binary, its MIME content type, and the Unix timestamp of when it was cached.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After configuring `LOGO_DEV_TOKEN` in Docker, provider logos appear in the contract list without any code change or image rebuild.
- **SC-002**: The browser's network tab shows zero outbound requests to `logo.dev` — all logo traffic goes to the application's own domain.
- **SC-003**: A provider logo requested a second time is served from cache with no outbound network call to logo.dev, measurable by database row count and absence of logo.dev traffic in server logs.
- **SC-004**: The admin cache prune endpoint empties the cache table, verified by row count returning to zero.
- **SC-005**: Non-admin users receive a 403 response from the prune endpoint with no cache modification.
- **SC-006**: When `LOGO_DEV_TOKEN` is absent, the frontend displays the building icon fallback without throwing any errors.

## Assumptions

- The existing SQLite database connection is reused for the `logo_cache` table; no separate database or caching service is introduced.
- Logo images from logo.dev are binary (PNG/SVG/WebP); the proxy forwards the content type header verbatim.
- No automatic time-based cache expiry is implemented in v1 — the cache grows until an admin prunes it or the entry is overwritten by a fresh request with the same name.
- The proxy endpoint does not require the user to be authenticated, consistent with how images are typically served (logos are non-sensitive).
- `VITE_LOGO_DEV_TOKEN` in the frontend `.env` file becomes unused; it will be removed from `.env` and `.env.example`.
- The logo.dev API endpoint used is `https://img.logo.dev/name/{encodedName}?token={token}`, consistent with the current frontend implementation.
- Cache-control and ETag headers from logo.dev are not forwarded to the browser in v1; the browser may re-request logos on each page load, but the server will serve them from SQLite without an outbound call.
