# Contract: Admin Diagnostics Endpoints

## `GET /api/admin/diagnostics`

**Auth**: Requires an authenticated session with `role === 'ADMIN'` (same `onRequest` hook
pattern as `packages/backend/src/routes/admin.ts`). Non-admin or unauthenticated requests receive
`403 Forbidden` (unauthenticated requests are already rejected with `401` by the global
`server.ts` session hook before reaching this route).

**Request**: No body, no query parameters.

**Response `200 OK`** — `DiagnosticsReport` (see `data-model.md`):

```json
{
  "generatedAt": "2026-07-19T12:00:00.000Z",
  "versions": {
    "appVersion": "1.5.0",
    "dbVersion": { "status": "ok", "detail": "3.45.1" },
    "runtimeVersion": "v24.16.0"
  },
  "systemChecks": {
    "platform": "linux",
    "architecture": "x64",
    "containerized": { "status": "ok", "detail": "true" },
    "reverseProxyDetected": { "status": "ok", "detail": "x-forwarded-for" },
    "internetAccess": { "status": "ok", "detail": "reachable" },
    "dnsResolution": { "status": "ok", "detail": "93.184.216.34" },
    "websocketSupport": { "status": "ok", "detail": "disabled" },
    "serverTime": { "utc": "2026-07-19T12:00:00.000Z", "local": "2026-07-19T14:00:00.000+02:00" },
    "clockDrift": { "status": "ok", "detail": "120ms" },
    "domainMatch": { "status": "ok", "detail": "configured=app.example.com observed=app.example.com" },
    "https": { "status": "ok", "detail": "true" }
  }
}
```

**Response `403 Forbidden`** (non-admin authenticated user):

```json
{ "statusCode": 403, "error": "Forbidden", "message": "Administrator access required" }
```

**Failure isolation**: Any individual check that errors or exceeds
`DIAGNOSTICS_CHECK_TIMEOUT_MS` (default 5000) resolves to `{ status: "failed" | "timed-out",
detail: "<reason>" }` within its own field — it never causes the endpoint to return a
non-`200` status or omit other fields.

## `GET /admin/diagnostics` (no-JS HTML fallback)

**Auth**: Same admin-only gate as the JSON endpoint. Non-admin/unauthenticated requests receive
a plain-text/HTML `403`/`401` page (no SPA redirect, since this route is reached without JS).

**Response `200 OK`**: `text/html` document rendering the same `DiagnosticsReport` data as two
labeled sections ("Versions", "System Checks"), using inline CSS only, no `<script>` tags,
readable in any browser with JavaScript disabled.

## Environment variables (new, both optional with defaults)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DIAGNOSTICS_CHECK_TIMEOUT_MS` | `5000` | Max time an individual live check may take before being marked `timed-out` (FR-016) |
| `DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS` | `5000` | Drift beyond which the clock-sync check is flagged `warning` (FR-012) |
