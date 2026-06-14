import { AuthError } from './auth.js';

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

export async function confirmEmailChange(token: string): Promise<void> {
  const res = await fetch(`/api/profile/email-change/${token}/confirm`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok)
    throw new AuthError(res.status, await readErrorMessage(res, 'Failed to confirm email change'));
}
