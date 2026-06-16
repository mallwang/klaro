import {
  AccountSchema,
  AccountListResponseSchema,
  type Account,
  type CreateAccountBody,
  type Role,
  type SendTestEmailBody,
} from '@pcm/shared';
import { AuthError } from './auth.js';

/**
 * HTTP client functions for admin-only user account management and SMTP test endpoints.
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
 * Fetches all user accounts visible to the current admin.
 *
 * @returns An array of Account objects
 */
export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/users', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load accounts'));
  return AccountListResponseSchema.parse(await res.json());
}

/**
 * Creates a new user account with the given details.
 *
 * @param body - The account creation payload including email, display name, and role
 * @returns The created Account object
 */
export async function createAccount(body: CreateAccountBody): Promise<Account> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to create account'));
  return AccountSchema.parse(await res.json());
}

/**
 * Archives a user account by ID, revoking all active sessions.
 *
 * @param id - UUID of the account to archive
 */
export async function archiveAccount(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}/archive`, { method: 'POST', credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to archive account'));
}

/**
 * Reactivates a previously archived account by ID.
 *
 * @param id - UUID of the account to reactivate
 */
export async function reactivateAccount(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}/reactivate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to reactivate account'));
}

/**
 * Permanently deletes an archived account by ID.
 *
 * @param id - UUID of the archived account to delete
 */
export async function deleteAccount(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to delete account'));
}

/**
 * Changes the role of a user account.
 *
 * @param id - UUID of the account to update
 * @param role - The new role to assign
 */
export async function changeAccountRole(id: string, role: Role): Promise<void> {
  const res = await fetch(`/api/users/${id}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to change account role'));
}

/**
 * Fetches the current logo cache contents from the admin endpoint.
 *
 * @returns the total entry count and the sorted list of cached provider name keys
 */
export async function getLogoCacheInfo(): Promise<{ count: number; keys: string[] }> {
  const res = await fetch('/api/admin/logos/cache', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to fetch logo cache info'));
  return (await res.json()) as { count: number; keys: string[] };
}

/**
 * Deletes all entries from the server-side logo cache and returns the count of removed rows.
 *
 * @returns the number of cache entries deleted
 */
export async function pruneLogoCache(): Promise<number> {
  const res = await fetch('/api/admin/logos/cache', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to prune logo cache'));
  const json = (await res.json()) as { deleted: number };
  return json.deleted;
}

/**
 * Sends a test email to the given address to verify SMTP configuration.
 *
 * @param body - The test email payload containing the recipient address
 */
export async function sendTestEmail(body: SendTestEmailBody): Promise<void> {
  const res = await fetch('/api/admin/email/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to send test email'));
}
