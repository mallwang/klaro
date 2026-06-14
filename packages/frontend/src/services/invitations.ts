import {
  InvitationSchema,
  type Invitation,
  type SendInvitationBody,
  type SessionUser,
  SessionUserSchema,
} from '@pcm/shared';
import { AuthError } from './auth.js';

/**
 * HTTP client functions for invitation lifecycle endpoints: send, list, cancel, resend, and
 * accept.
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
 * Sends a new invitation to the given email address.
 *
 * @param body - The invitation payload containing the recipient email
 * @returns The created Invitation object
 */
export async function sendInvitation(body: SendInvitationBody): Promise<Invitation> {
  const res = await fetch('/api/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to send invitation'));
  return InvitationSchema.parse(await res.json());
}

/**
 * Fetches all invitations visible to the current admin user.
 *
 * @returns An array of Invitation objects
 */
export async function listInvitations(): Promise<Invitation[]> {
  const res = await fetch('/api/invitations', { credentials: 'include' });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to load invitations'));
  const json = (await res.json()) as unknown[];
  return json.map((item) => InvitationSchema.parse(item));
}

/**
 * Cancels a pending invitation by its token.
 *
 * @param token - The invitation token to cancel
 */
export async function cancelInvitation(token: string): Promise<void> {
  const res = await fetch(`/api/invitations/${token}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to cancel invitation'));
}

/**
 * Resends a pending invitation, issuing a fresh token and expiry.
 *
 * @param token - The existing invitation token to resend
 * @returns The updated Invitation object with the new token
 */
export async function resendInvitation(token: string): Promise<Invitation> {
  const res = await fetch(`/api/invitations/${token}/resend`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to resend invitation'));
  return InvitationSchema.parse(await res.json());
}

/**
 * Accepts an invitation by token, activating the account and starting a session.
 *
 * @param token - The invitation token from the acceptance link
 * @param password - The password the new user chose for their account
 * @returns The newly authenticated SessionUser
 */
export async function acceptInvitation(token: string, password: string): Promise<SessionUser> {
  const res = await fetch(`/api/invitations/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to accept invitation'));
  return SessionUserSchema.parse(await res.json());
}
