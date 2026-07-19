# Data Model: Admin Diagnostics Page

No database schema changes — diagnostics data is computed fresh per request and never persisted
(per spec Assumptions). The model below is the shared TypeScript/zod shape passed from backend
to frontend.

## CheckStatus

```ts
type CheckStatus = 'ok' | 'warning' | 'failed' | 'timed-out';
```

- `ok` — the check completed and the observed value is within expected bounds.
- `warning` — the check completed but found a flagged condition (e.g. domain mismatch, clock
  drift over threshold).
- `failed` — the check could not complete due to an error (e.g. DB unreachable, DNS lookup
  error).
- `failed` differs from `timed-out` only in cause (error vs. exceeding the per-check timeout);
  both render identically in the UI as a degraded state.

## CheckResult

| Field   | Type         | Description                                                            |
|---------|--------------|--------------------------------------------------------------------------|
| status  | CheckStatus  | Outcome of the check                                                    |
| detail  | string       | Human-readable value or explanation (e.g. resolved IP, drift in ms, header name found) |

Validation: `detail` MUST NOT contain secret values (SMTP credentials, DB file path, tokens) —
enforced by construction (check functions never read those env vars) rather than by runtime
scrubbing.

## VersionsGroup

| Field        | Type   | Source                                                        |
|--------------|--------|----------------------------------------------------------------|
| appVersion   | string | Workspace root `package.json` `version` field (existing `APP_VERSION`) |
| dbVersion    | CheckResult | `SELECT sqlite_version()` — `failed` on query error       |
| runtimeVersion | string | `process.version`                                            |

## SystemChecksGroup

| Field              | Type        | Corresponds to FR |
|--------------------|-------------|--------------------|
| platform           | string (`os.platform()`)     | FR-005 |
| architecture       | string (`os.arch()`)         | FR-005 |
| containerized      | CheckResult (`ok`/`failed` boolean-ish detail) | FR-006 |
| reverseProxyDetected | CheckResult (detail names the forwarded-header found, or "none") | FR-007 |
| internetAccess     | CheckResult | FR-008 |
| dnsResolution      | CheckResult (detail is resolved IP on success) | FR-009 |
| websocketSupport   | CheckResult (static, env-driven) | FR-010 |
| serverTime         | `{ utc: string; local: string }` (ISO strings) | FR-011 |
| clockDrift         | CheckResult (detail is drift in ms) | FR-012 |
| domainMatch        | CheckResult (detail includes both configured and observed host) | FR-013 |
| https              | CheckResult | FR-014 |

## DiagnosticsReport (top-level shared type)

```ts
interface DiagnosticsReport {
  generatedAt: string; // ISO timestamp of report generation
  versions: VersionsGroup;
  systemChecks: SystemChecksGroup;
}
```

- **Not persisted**: generated fresh on every `GET /api/admin/diagnostics` / `GET /admin/diagnostics` request.
- **Access control**: only constructible/servable behind the existing `ADMIN`-role `onRequest`
  hook (mirrors `packages/backend/src/routes/admin.ts`).
- **Shared location**: `packages/shared/src/types/diagnostics.ts` (TS interfaces) and
  `packages/shared/src/schemas/diagnostics.ts` (zod schema for response validation in tests),
  re-exported from `packages/shared/src/index.ts`.
