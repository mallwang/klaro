import { DiagnosticsReportSchema, type DiagnosticsReport } from '@pcm/shared';
import { AuthError } from './auth.js';

/**
 * HTTP client function for the admin-only diagnostics endpoint.
 */

/**
 * Attempts to extract a human-readable error message from a non-ok API response body.
 *
 * @param res - The failed Response object
 * @param fallback - Message to return when the body cannot be parsed or has no message field
 * @returns The server's error message, or the fallback string
 */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json: unknown = await res.json();
    if (json && typeof json === 'object' && 'message' in json && typeof json.message === 'string') {
      return json.message;
    }
  } catch {
    // ignore — fall through to the generic message
  }
  return fallback;
}

/**
 * Fetches the admin diagnostics report: versions and live system checks.
 *
 * @returns The parsed DiagnosticsReport
 */
export async function fetchDiagnostics(): Promise<DiagnosticsReport> {
  const res = await fetch('/api/admin/diagnostics', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load diagnostics'));
  return DiagnosticsReportSchema.parse(await res.json());
}
