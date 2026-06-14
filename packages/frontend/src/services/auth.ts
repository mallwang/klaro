import {
  SessionUserSchema,
  type SessionUser,
  type SignInBody,
  type ChangePasswordBody,
  type RequestPasswordResetBody,
  type ResetPasswordBody,
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

/**
 * Requests a password reset link for the given email address.
 *
 * @param body - The email address to send the reset link to
 * @returns A promise that resolves when the request is accepted
 */
export async function requestPasswordReset(body: RequestPasswordResetBody): Promise<void> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(
      res.status,
      await readErrorMessage(res, 'Failed to request password reset'),
    );
}

/**
 * Resets a user's password using a valid token and signs in the user.
 *
 * @param token - The password reset token from the email link
 * @param body - The new password to set
 * @returns The authenticated SessionUser
 */
export async function resetPassword(token: string, body: ResetPasswordBody): Promise<SessionUser> {
  const res = await fetch(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to reset password'));
  return SessionUserSchema.parse(await res.json());
}
