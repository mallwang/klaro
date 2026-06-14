import {
  SessionUserSchema,
  type SessionUser,
  type SignInBody,
  type ChangePasswordBody,
} from '@pcm/shared';

/**
 * HTTP client functions for authentication endpoints: sign-in, sign-out, current user, and
 * password change.
 */

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

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
 * Fetches the currently authenticated user from the session cookie.
 *
 * @returns The authenticated SessionUser, or null if the session is absent or expired
 */
export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load current user'));
  return SessionUserSchema.parse(await res.json());
}

/**
 * Submits sign-in credentials and returns the resulting session user on success.
 *
 * @param body - Email and password credentials
 * @returns The authenticated SessionUser
 */
export async function signIn(body: SignInBody): Promise<SessionUser> {
  const res = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new AuthError(res.status, await readErrorMessage(res, 'Sign-in failed'));
  return SessionUserSchema.parse(await res.json());
}

/**
 * Signs the current user out by invalidating the server-side session.
 */
export async function signOut(): Promise<void> {
  const res = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new AuthError(res.status, await readErrorMessage(res, 'Sign-out failed'));
}

/**
 * Sends a password change request, revoking all other active sessions on success.
 *
 * @param body - The current password and the desired new password
 */
export async function changePassword(body: ChangePasswordBody): Promise<void> {
  const res = await fetch('/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to change password'));
}
