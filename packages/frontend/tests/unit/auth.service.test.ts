import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestPasswordReset, resetPassword, AuthError } from '../../src/services/auth.js';
import type { SessionUser } from '@pcm/shared';

const mockUser: SessionUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'MEMBER',
};

describe('auth service – requestPasswordReset', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends POST to /api/auth/forgot-password with email', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        message: 'If an account exists with that email, a password reset link has been sent.',
      }),
    } as unknown as Response);

    await requestPasswordReset({ email: 'user@example.com' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
    );
  });

  it('throws AuthError on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid email' }),
    } as unknown as Response);

    await expect(requestPasswordReset({ email: 'invalid' })).rejects.toThrow(AuthError);
  });
});

describe('auth service – resetPassword', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends POST to /api/auth/reset-password/:token with password and returns user', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUser,
    } as unknown as Response);

    const result = await resetPassword('valid-token', { password: 'new-password' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/reset-password/valid-token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'new-password' }),
      }),
    );
    expect(result).toEqual(mockUser);
  });

  it('throws AuthError on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Invalid or expired reset link' }),
    } as unknown as Response);

    await expect(resetPassword('invalid-token', { password: 'new-password' })).rejects.toThrow(
      AuthError,
    );
  });
});
