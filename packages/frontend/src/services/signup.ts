import { SignupRequestSchema, type SignupRequest, type CreateSignupRequestBody } from '@pcm/shared';
import { AuthError } from './auth.js';

/**
 * HTTP client functions for the public self-service sign-up lifecycle: submission,
 * verification, and admin review (list/approve/reject/delete).
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
 * Submits a new public sign-up request.
 *
 * @param body - The sign-up payload containing the chosen email and password
 * @returns The created SignupRequest object
 */
export async function submitSignup(body: CreateSignupRequestBody): Promise<SignupRequest> {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to submit sign-up'));
  return SignupRequestSchema.parse(await res.json());
}

/**
 * Verifies a sign-up request by its token, moving it into the admin review queue.
 *
 * @param token - The verification token from the emailed link
 * @returns The email and updated status of the verified request
 */
export async function verifySignup(token: string): Promise<{ email: string; status: string }> {
  const res = await fetch(`/api/signup/${token}/verify`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to verify sign-up'));
  return (await res.json()) as { email: string; status: string };
}

/**
 * Fetches all sign-up requests visible to the current admin user.
 *
 * @returns An array of SignupRequest objects
 */
export async function listSignupRequests(): Promise<SignupRequest[]> {
  const res = await fetch('/api/signup-requests', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load sign-up requests'));
  const json = (await res.json()) as unknown[];
  return json.map((item) => SignupRequestSchema.parse(item));
}

/**
 * Approves a verified sign-up request, creating an active user account.
 *
 * @param token - The sign-up request token to approve
 */
export async function approveSignupRequest(token: string): Promise<void> {
  const res = await fetch(`/api/signup-requests/${token}/approve`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to approve sign-up'));
}

/**
 * Rejects a verified sign-up request with an optional reason.
 *
 * @param token - The sign-up request token to reject
 * @param reason - Optional free-text reason for the rejection
 */
export async function rejectSignupRequest(token: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/signup-requests/${token}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to reject sign-up'));
}

/**
 * Deletes a sign-up request entry regardless of its status.
 *
 * @param token - The sign-up request token to delete
 */
export async function deleteSignupRequest(token: string): Promise<void> {
  const res = await fetch(`/api/signup-requests/${token}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(
      res.status,
      await readErrorMessage(res, 'Failed to delete sign-up request'),
    );
}
