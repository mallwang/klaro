import { AuthError } from './auth.js';

/**
 * HTTP client functions for user profile endpoints: display name updates, email change
 * requests, and self-service account deletion.
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
    // ignore
  }
  return fallback;
}

/**
 * Updates the authenticated user's display name.
 *
 * @param displayName - The new display name to set
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to update display name'));
}

/**
 * Submits an email change request, triggering a verification email to the new address.
 *
 * @param email - The new email address the user wants to use
 */
export async function requestEmailChange(email: string): Promise<void> {
  const res = await fetch('/api/profile/email-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to request email change'));
}

/**
 * Fetches the currently pending email change request for the authenticated user, if any.
 *
 * @returns An object containing the pending email address, or null if none is pending
 */
export async function getPendingEmailChange(): Promise<{ pendingEmail: string | null }> {
  const res = await fetch('/api/profile/email-change/pending', {
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(
      res.status,
      await readErrorMessage(res, 'Failed to fetch pending email change'),
    );
  return res.json() as Promise<{ pendingEmail: string | null }>;
}

/**
 * Confirms an email change using the token from the verification link.
 *
 * @param token - The verification token from the email change confirmation email
 */
export async function confirmEmailChange(token: string): Promise<void> {
  const res = await fetch(`/api/profile/email-change/${token}/confirm`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to confirm email change'));
}

/**
 * Permanently deletes the authenticated user's account and ends their session.
 */
export async function deleteSelf(): Promise<void> {
  const res = await fetch('/api/profile', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to delete account'));
}
