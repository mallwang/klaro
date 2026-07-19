# Research: Admin Diagnostics Page

## 1. No-JavaScript rendering requirement (FR-018 / SC-006)

**Decision**: Add a second Fastify route, `GET /admin/diagnostics`, registered alongside the
existing `GET /api/admin/diagnostics` JSON endpoint. It calls the same
`buildDiagnosticsReport()` service function and renders a minimal server-generated HTML document
(inline `<style>`, no client JS, no build step) with the same grouped versions/checks structure.
The React SPA route at `/admin/diagnostics` remains the primary experience when JS is available;
the plain route is a fallback reachable directly (e.g. bookmarked, or when the SPA fails to
hydrate).

**Rationale**: The app is a client-rendered SPA (`packages/frontend`, served as a static bundle
by `fastifyStatic` — see `server.ts`). Adding a full SSR framework (Next.js, etc.) to satisfy one
page's no-JS requirement would be a large, YAGNI-violating architecture change. A single
hand-written HTML template on the backend keeps the fallback simple and reuses the exact same
report-building logic as the JSON API, so the two views can never drift out of sync.

**Alternatives considered**:
- Server-side rendering the React component (`react-dom/server`) — rejected: would require
  pulling frontend rendering into the backend build, adding complexity disproportionate to one
  diagnostics page.
- `<noscript>` fallback content embedded in `index.html` — rejected: the SPA shell itself needs
  JS to bootstrap the router, so a `<noscript>` block in `index.html` can show a message but
  cannot display live diagnostics data.

## 2. Reverse-proxy / forwarded-IP detection (FR-007)

**Decision**: Read raw incoming request headers directly (`request.headers['x-forwarded-for']`,
`x-real-ip`, `x-forwarded-proto`, `x-forwarded-host`) rather than relying on Fastify's
`trustProxy` option (which is not currently enabled in `server.ts` and changes request.hostname/
protocol semantics app-wide). Report "detected" plus the name of whichever forwarded header was
present; report "not detected" when none are present.

**Rationale**: Enabling `trustProxy` globally would change request handling behavior for every
route, which is out of scope for a diagnostics page. Reading the headers directly is inert and
side-effect-free.

**Alternatives considered**: Enabling `@fastify/http-proxy`-style trust-proxy config —
rejected, changes app-wide behavior for a read-only diagnostic.

## 3. Domain / HTTPS check (FR-013, FR-014)

**Decision**: Compare the hostname portion of `process.env.APP_URL` (already used elsewhere in
the codebase — `auth.ts`, `invitations.ts`, `signup.ts`, `profile.ts` — as the canonical
configured public URL) against the incoming request's `Host` header (or `x-forwarded-host` if
present). HTTPS status is derived from `x-forwarded-proto === 'https'` when behind a proxy,
falling back to `request.protocol` otherwise.

**Rationale**: `APP_URL` is already the project's established "configured public domain" env
var — no new configuration surface needed.

## 4. Internet access & DNS resolution checks (FR-008, FR-009)

**Decision**: Use Node's built-in `node:dns/promises` `lookup()` against a stable well-known
hostname (`example.com`) for the DNS check. For the internet-access check, perform an HTTPS
`HEAD` request (`node:https`) to the same host. Both wrapped in a timeout race
(`Promise.race` against a timer, default 5000ms, configurable via `DIAGNOSTICS_CHECK_TIMEOUT_MS`
env var) so a hung DNS/network call can't stall the response beyond the budget.

**Rationale**: No new dependency needed — Node's built-ins cover both checks. `example.com` is
IANA-reserved for documentation/testing and stable long-term.

**Alternatives considered**: A dedicated `is-online` / `dns-lookup` npm package — rejected per
Simplicity principle; built-ins are sufficient.

## 5. Time-sync / clock-drift check (FR-012)

**Decision**: Reuse the same outbound HTTPS HEAD request made for the internet-access check and
read the response's `Date` header as a trusted external time source. Compute
`Math.abs(localNow - remoteDate)` and flag a warning when drift exceeds a configurable threshold
(default 5000ms via `DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS`).

**Rationale**: Avoids adding an NTP client dependency; HTTP `Date` headers are accurate to the
second and sufficient for flagging gross clock drift, which is the spec's concern (not
sub-second precision timekeeping).

**Alternatives considered**: An NTP client library (e.g. `ntp-client`) — rejected as an
unnecessary dependency; more precise than needed for a coarse drift warning.

## 6. Container detection (FR-006)

**Decision**: Check for the presence of `/.dockerenv` (via `node:fs.existsSync`) or a
`docker`/`kubepods` substring in `/proc/1/cgroup`, matching common lightweight container-detection
techniques. Report `false` on any read error (e.g. non-Linux host) rather than throwing.

**Rationale**: Standard, dependency-free technique; matches Vaultwarden's own approach of
filesystem-based detection.

## 7. WebSocket support flag (FR-010)

**Decision**: The application does not currently implement WebSocket/real-time support (no `ws`
or `socket.io` dependency in `packages/backend/package.json`). Report this as a static
`enabled: false` check backed by a `WEBSOCKET_ENABLED` env-var-driven constant, so the check
becomes accurate automatically if real-time support is added later without requiring diagnostics
code changes beyond flipping the constant.

**Rationale**: Matches current reality; avoids fabricating a check against infrastructure that
doesn't exist. Keeps the check forward-compatible per YAGNI (no speculative real-time plumbing
added now).

## 8. Database engine version (FR-003, Assumption)

**Decision**: Query `SELECT sqlite_version() AS version` via the existing `fastify.db`
(better-sqlite3) decorator, matching the pattern already used in `admin.ts` for `logo_cache`
queries. On query failure, report the check as `failed` rather than throwing.

## 9. Versions (FR-002, FR-004)

**Decision**: Application version reuses the existing `APP_VERSION` constant already computed in
`server.ts` from the workspace root `package.json` (exposed via the `x-klaro-version` response
header) — export it so the diagnostics service can reuse it directly rather than re-reading the
file. Runtime version is `process.version`.

## 10. Per-check timeout / isolation strategy (FR-016, FR-017, SC-002, SC-003)

**Decision**: Model each check as an independent async function returning
`{ status: 'ok' | 'warning' | 'failed' | 'timed-out', detail: string }`. Run all checks via
`Promise.allSettled`, with each individual check's promise wrapped in a timeout race. A check
that throws or times out resolves to a `failed`/`timed-out` result object rather than rejecting
the overall report — so one bad check can never crash the rest of the response.

**Rationale**: Directly satisfies FR-017/SC-003 ("a single check failure MUST NOT prevent the
page from loading") with a simple, dependency-free pattern (no circuit-breaker library needed).
