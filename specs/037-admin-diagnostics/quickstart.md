# Quickstart: Admin Diagnostics Page

## Prerequisites

- Local dev environment running (`pnpm dev` from repo root — starts backend on `:3000` and
  frontend on `:5173`).
- An `ADMIN`-role account to sign in with (see `packages/backend/src/db/seed.ts` for seeded
  accounts, or promote an account via the existing admin accounts UI).

## Validate: JSON endpoint, admin-only access (User Story 1 & FR-001)

1. Sign in as a non-admin user, then `curl` the endpoint with that session cookie:
   ```bash
   curl -i -b "<session-cookie>" http://localhost:3000/api/admin/diagnostics
   ```
   Expect `403 Forbidden`.
2. Sign in as an admin user, repeat the request. Expect `200 OK` with a JSON body containing
   `versions.appVersion`, `versions.dbVersion`, `versions.runtimeVersion` (see
   `contracts/diagnostics-api.md` for the full shape).

## Validate: grouped display (User Story 1)

1. As an admin, navigate to `/admin/diagnostics` in the browser.
2. Confirm the page shows two clearly labeled sections: **Versions** and **System Checks**.

## Validate: reverse proxy / domain / HTTPS checks (User Story 2)

1. With the dev server running directly (no proxy), load the diagnostics page — expect
   `reverseProxyDetected` to show "not detected".
2. Put a simple reverse proxy in front (e.g. `nginx` or `caddy` forwarding
   `X-Forwarded-For`/`X-Forwarded-Proto`) and reload — expect `reverseProxyDetected` to report the
   header name found, and `https`/`domainMatch` to reflect the proxy's forwarded values.
3. Set `APP_URL` to a domain that does not match the `Host` header of your test request — expect
   `domainMatch` to show a `warning` status with both the configured and observed values visible.

## Validate: external connectivity checks (User Story 3)

1. With normal internet access, load the diagnostics page — expect `internetAccess` and
   `dnsResolution` to report `ok`.
2. Block outbound egress (e.g. via a firewall rule or disconnecting network) and reload — expect
   `internetAccess`/`dnsResolution` to report `failed`/`timed-out` while the rest of the page
   (versions, proxy/domain checks) still renders normally within the 6s budget (SC-002, SC-003).

## Validate: no-JavaScript fallback (FR-018 / SC-006)

1. As an admin, open `http://localhost:3000/admin/diagnostics` directly in a browser with
   JavaScript disabled (or via `curl`/`wget`).
2. Confirm the returned HTML contains both the Versions and System Checks sections with the same
   information as the JS-enabled view — no missing sections.

## Run automated tests

```bash
pnpm --filter backend test -- diagnostics
pnpm --filter frontend test -- Diagnostics
```
