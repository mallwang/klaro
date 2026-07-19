import * as os from 'node:os';
import * as https from 'node:https';
import * as dnsPromises from 'node:dns/promises';
import { existsSync, readFileSync } from 'node:fs';
import type Database from 'better-sqlite3';
import type { FastifyRequest } from 'fastify';
import type { IncomingHttpHeaders } from 'node:http';
import type { CheckResult, CheckStatus, DiagnosticsReport } from '@pcm/shared';
import { APP_VERSION } from '../server.js';

/**
 * Builds the admin diagnostics report: application/database/runtime versions plus a set of
 * live environment and connectivity checks. Every check function returns a `CheckResult`
 * object rather than throwing, so one failing or slow check can never take down the rest of
 * the report (FR-017).
 */

const DIAGNOSTICS_TARGET_HOST = 'example.com';

/**
 * Returns a human-readable message for a thrown value, falling back to a generic string for
 * non-Error throws.
 *
 * @param err - the caught value
 * @returns a string suitable for a CheckResult's `detail` field
 */
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}

/**
 * Races an async operation against a timer, resolving to a fallback value on timeout and to
 * an error-derived value if the operation throws — never rejects.
 *
 * @param fn - the async operation to run
 * @param timeoutMs - maximum time to wait before treating the operation as timed out
 * @param timeoutValue - value to resolve with if the timer fires first
 * @param failValue - factory producing a value to resolve with if `fn` throws
 * @returns the operation's result, or the timeout/failure fallback
 */
async function withTimeoutOrFail<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutValue: T,
  failValue: (err: unknown) => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(timeoutValue), timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } catch (err) {
    return failValue(err);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Runs a single diagnostics check with a per-check timeout, isolating its outcome from the
 * rest of the report (FR-016/FR-017).
 *
 * @param fn - the check to run, returning a CheckResult
 * @param timeoutMs - maximum time the check may take before being marked `timed-out`
 * @returns the check's result, or a `timed-out`/`failed` result if it exceeded the timeout or threw
 */
export async function runCheck(
  fn: () => Promise<CheckResult>,
  timeoutMs: number,
): Promise<CheckResult> {
  return withTimeoutOrFail(
    fn,
    timeoutMs,
    { status: 'timed-out', detail: `exceeded ${timeoutMs}ms` },
    (err) => ({ status: 'failed', detail: errorMessage(err) }),
  );
}

/**
 * Queries the SQLite engine version via the existing `fastify.db` connection.
 *
 * @param db - the open SQLite database connection
 * @returns `ok` with the version string, or `failed` on query error
 */
export async function checkDbVersion(db: Database.Database): Promise<CheckResult> {
  try {
    const row = db.prepare<[], { version: string }>('SELECT sqlite_version() AS version').get();
    return { status: 'ok', detail: row?.version ?? 'unknown' };
  } catch (err) {
    return { status: 'failed', detail: errorMessage(err) };
  }
}

/**
 * Detects whether the process is running inside a container by checking for `/.dockerenv` or
 * a `docker`/`kubepods` marker in `/proc/1/cgroup`.
 *
 * @returns `ok` with detail `"true"`/`"false"`; `"false"` on any read error (e.g. non-Linux host)
 */
export function checkContainerized(): CheckResult {
  try {
    if (existsSync('/.dockerenv')) return { status: 'ok', detail: 'true' };
    const cgroup = readFileSync('/proc/1/cgroup', 'utf-8');
    return { status: 'ok', detail: /docker|kubepods/.test(cgroup) ? 'true' : 'false' };
  } catch {
    return { status: 'ok', detail: 'false' };
  }
}

const FORWARDED_HEADER_NAMES = [
  'x-forwarded-for',
  'x-real-ip',
  'x-forwarded-proto',
  'x-forwarded-host',
];

/**
 * Detects whether the request arrived through a reverse proxy by inspecting common
 * forwarded-request headers.
 *
 * @param headers - the incoming request headers
 * @returns `ok` naming the forwarded header found, or detail `"not detected"` when none are present
 */
export function checkReverseProxy(headers: IncomingHttpHeaders): CheckResult {
  const found = FORWARDED_HEADER_NAMES.find((name) => headers[name] !== undefined);
  return { status: 'ok', detail: found ?? 'not detected' };
}

/**
 * Extracts the hostname portion of a URL string, tolerating a missing scheme.
 *
 * @param url - the URL or bare hostname to parse
 * @returns the hostname, or undefined if it could not be parsed
 */
function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    try {
      return new URL(`https://${url}`).hostname;
    } catch {
      return undefined;
    }
  }
}

/**
 * Compares the configured public domain (`APP_URL`) against the incoming request's Host
 * header, flagging a mismatch.
 *
 * @param configuredUrl - the value of `process.env.APP_URL`
 * @param hostHeader - the request's Host or X-Forwarded-Host header value
 * @returns `ok` when they match, `warning` otherwise, with both values in `detail`
 */
export function checkDomainMatch(
  configuredUrl: string | undefined,
  hostHeader: string | undefined,
): CheckResult {
  const configuredHost = configuredUrl ? safeHostname(configuredUrl) : undefined;
  const observedHost = hostHeader?.split(':')[0];
  const match = Boolean(configuredHost && observedHost && configuredHost === observedHost);
  return {
    status: match ? 'ok' : 'warning',
    detail: `configured=${configuredHost ?? 'unset'} observed=${observedHost ?? 'unknown'}`,
  };
}

/**
 * Determines whether the request was served over HTTPS, accounting for reverse-proxy
 * termination via `X-Forwarded-Proto`.
 *
 * @param request - the incoming Fastify request
 * @returns `ok`/detail `"true"` when HTTPS, `warning`/detail `"false"` otherwise
 */
export function checkHttps(request: FastifyRequest): CheckResult {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const isHttps = proto === 'https' || request.protocol === 'https';
  return { status: isHttps ? 'ok' : 'warning', detail: String(isHttps) };
}

const WEBSOCKET_ENABLED = false;

/**
 * Reports the application's WebSocket/real-time support status. Currently static since no
 * WebSocket transport is implemented.
 *
 * @returns `ok` with detail `"enabled"`/`"disabled"`
 */
export function checkWebsocketSupport(): CheckResult {
  return { status: 'ok', detail: WEBSOCKET_ENABLED ? 'enabled' : 'disabled' };
}

/**
 * Reports the configured SMTP host. Shows the actual hostname — this is non-secret
 * configuration, not a credential (unlike `SMTP_USER`/`SMTP_PASSWORD`, which are never read
 * here and never appear in diagnostics output per FR-015).
 *
 * @returns `ok` with the configured host, or `warning`/detail `"not set"` when `SMTP_HOST` is unset
 */
export function checkSmtpHost(): CheckResult {
  const host = process.env['SMTP_HOST'];
  return host ? { status: 'ok', detail: host } : { status: 'warning', detail: 'not set' };
}

/**
 * Reports the effective SMTP port, matching the default applied by `MailerService.fromEnv()`
 * (587) when `SMTP_PORT` is unset.
 *
 * @returns `ok` with the effective port number
 */
export function checkSmtpPort(): CheckResult {
  const port = Number.parseInt(process.env['SMTP_PORT'] || '587', 10);
  return { status: 'ok', detail: String(port) };
}

/**
 * Reports the configured SMTP "from" address, mirroring the requirement enforced by
 * `MailerService.fromEnv()`.
 *
 * @returns `ok` with the configured address, or `warning`/detail `"not set"` when `SMTP_FROM` is unset
 */
export function checkSmtpFrom(): CheckResult {
  const from = process.env['SMTP_FROM'];
  return from ? { status: 'ok', detail: from } : { status: 'warning', detail: 'not set' };
}

/**
 * Reports the configured SMTP "from" display name. Optional — `MailerService.fromEnv()` falls
 * back to the bare address when unset, so a missing value is not a misconfiguration.
 *
 * @returns `ok` with the configured name, or `ok`/detail `"not set"` when `SMTP_FROM_NAME` is unset
 */
export function checkSmtpFromName(): CheckResult {
  const fromName = process.env['SMTP_FROM_NAME'];
  return { status: 'ok', detail: fromName || 'not set' };
}

/**
 * Reports whether a logo.dev API token is configured for the provider-logo proxy. Does not
 * attempt a real request — this is a configuration-presence check only.
 *
 * @returns `ok`/detail `"configured"` when `LOGO_DEV_TOKEN` is set, `warning`/detail
 *   `"not configured"` otherwise
 */
export function checkLogoDevConfigured(): CheckResult {
  const configured = Boolean(process.env['LOGO_DEV_TOKEN']);
  return {
    status: configured ? 'ok' : 'warning',
    detail: configured ? 'configured' : 'not configured',
  };
}

interface InternetAccessOutcome {
  result: CheckResult;
  dateHeader: string | null;
}

/**
 * Performs a raw HTTPS HEAD request against a stable well-known host to probe outbound
 * internet access, capturing the response's `Date` header for reuse by the clock-drift check.
 *
 * @returns the check outcome and the remote `Date` header, or null if unavailable
 */
function performInternetAccessCheck(): Promise<InternetAccessOutcome> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: DIAGNOSTICS_TARGET_HOST, method: 'HEAD', path: '/' },
      (res) => {
        const dateHeader = typeof res.headers['date'] === 'string' ? res.headers['date'] : null;
        resolve({ result: { status: 'ok', detail: 'reachable' }, dateHeader });
        res.resume();
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Checks outbound internet access via an HTTPS HEAD request, bounded by a per-check timeout.
 *
 * @param timeoutMs - maximum time to wait before treating the check as timed out
 * @returns the check result plus the remote `Date` header (for the clock-drift check), or a
 *   `failed`/`timed-out` result with a null date header on error/timeout
 */
export async function checkInternetAccess(timeoutMs: number): Promise<InternetAccessOutcome> {
  return withTimeoutOrFail(
    performInternetAccessCheck,
    timeoutMs,
    { result: { status: 'timed-out', detail: `exceeded ${timeoutMs}ms` }, dateHeader: null },
    (err) => ({ result: { status: 'failed', detail: errorMessage(err) }, dateHeader: null }),
  );
}

/**
 * Resolves DNS for a stable well-known host to verify DNS resolution is working, bounded by a
 * per-check timeout.
 *
 * @param timeoutMs - maximum time to wait before treating the check as timed out
 * @returns `ok` with the resolved IP in `detail`, or `failed`/`timed-out` on error/timeout
 */
export async function checkDnsResolution(timeoutMs: number): Promise<CheckResult> {
  return runCheck(async () => {
    const { address } = await dnsPromises.lookup(DIAGNOSTICS_TARGET_HOST);
    return { status: 'ok' as CheckStatus, detail: address };
  }, timeoutMs);
}

/**
 * Computes clock drift between the local server clock and a trusted remote HTTP `Date` header,
 * flagging a warning when it exceeds the configured threshold.
 *
 * @param remoteDateHeader - the `Date` header from the internet-access check's HTTPS response
 * @param thresholdMs - drift beyond which the check is flagged `warning`
 * @returns `ok`/`warning` with the drift in milliseconds, or `failed` if no remote time is available
 */
export function checkClockDrift(remoteDateHeader: string | null, thresholdMs: number): CheckResult {
  if (!remoteDateHeader) return { status: 'failed', detail: 'no remote time available' };
  const remoteTime = Date.parse(remoteDateHeader);
  if (Number.isNaN(remoteTime)) return { status: 'failed', detail: 'invalid remote time' };
  const drift = Math.abs(Date.now() - remoteTime);
  return { status: drift > thresholdMs ? 'warning' : 'ok', detail: `${drift}ms` };
}

/**
 * Formats a Date as an ISO-8601 string using the server's local timezone offset (unlike
 * `Date.prototype.toISOString`, which always uses UTC).
 *
 * @param date - the date to format
 * @returns an ISO-8601 string with the local UTC offset, e.g. `2026-07-19T14:00:00.000+02:00`
 */
function toLocalIsoString(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const offH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offM = pad(Math.abs(offsetMin) % 60);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}${sign}${offH}:${offM}`
  );
}

/**
 * Builds the full admin diagnostics report: versions plus all system checks, running the
 * independent async checks concurrently via `Promise.allSettled` (FR-017).
 *
 * @param db - the open SQLite database connection
 * @param request - the incoming Fastify request, used for header-derived checks
 * @returns the complete DiagnosticsReport
 */
export async function buildDiagnosticsReport(
  db: Database.Database,
  request: FastifyRequest,
): Promise<DiagnosticsReport> {
  const timeoutMs = Number(process.env['DIAGNOSTICS_CHECK_TIMEOUT_MS'] ?? 5000);
  const driftThresholdMs = Number(process.env['DIAGNOSTICS_CLOCK_DRIFT_THRESHOLD_MS'] ?? 5000);

  const [dbVersionSettled, internetSettled, dnsSettled] = await Promise.allSettled([
    checkDbVersion(db),
    checkInternetAccess(timeoutMs),
    checkDnsResolution(timeoutMs),
  ]);

  const dbVersion: CheckResult =
    dbVersionSettled.status === 'fulfilled'
      ? dbVersionSettled.value
      : { status: 'failed', detail: errorMessage(dbVersionSettled.reason) };
  const internet: InternetAccessOutcome =
    internetSettled.status === 'fulfilled'
      ? internetSettled.value
      : {
          result: { status: 'failed', detail: errorMessage(internetSettled.reason) },
          dateHeader: null,
        };
  const dnsResolution: CheckResult =
    dnsSettled.status === 'fulfilled'
      ? dnsSettled.value
      : { status: 'failed', detail: errorMessage(dnsSettled.reason) };

  const hostHeader =
    (request.headers['x-forwarded-host'] as string | undefined) ??
    (request.headers['host'] as string | undefined);
  const now = new Date();

  return {
    generatedAt: now.toISOString(),
    versions: {
      appVersion: APP_VERSION,
      dbVersion,
      runtimeVersion: process.version,
    },
    systemChecks: {
      platform: os.platform(),
      architecture: os.arch(),
      containerized: checkContainerized(),
      reverseProxyDetected: checkReverseProxy(request.headers),
      internetAccess: internet.result,
      dnsResolution,
      websocketSupport: checkWebsocketSupport(),
      serverTime: { utc: now.toISOString(), local: toLocalIsoString(now) },
      clockDrift: checkClockDrift(internet.dateHeader, driftThresholdMs),
      domainMatch: checkDomainMatch(process.env['APP_URL'], hostHeader),
      https: checkHttps(request),
    },
    environmentVariables: {
      smtpHost: checkSmtpHost(),
      smtpPort: checkSmtpPort(),
      smtpFrom: checkSmtpFrom(),
      smtpFromName: checkSmtpFromName(),
      logoDevConfigured: checkLogoDevConfigured(),
    },
  };
}
