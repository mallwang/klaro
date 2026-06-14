import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import type { SessionUser } from '@pcm/shared';
import { useRequestPasswordReset, useResetPassword } from '../../../src/hooks/useAuth.js';
import * as auth from '../../../src/services/auth.js';

vi.mock('../../../src/services/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof auth>();
  return {
    ...actual,
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
  };
});

const mockUser: SessionUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'MEMBER',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useRequestPasswordReset', () => {
  beforeEach(() => {
    vi.mocked(auth.requestPasswordReset).mockReset();
  });

  it('calls requestPasswordReset with the provided email', async () => {
    vi.mocked(auth.requestPasswordReset).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useRequestPasswordReset(), { wrapper: createWrapper() });
    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(auth.requestPasswordReset).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('exposes error state on failure', async () => {
    vi.mocked(auth.requestPasswordReset).mockRejectedValueOnce(
      new auth.AuthError(400, 'Invalid email'),
    );

    const { result } = renderHook(() => useRequestPasswordReset(), { wrapper: createWrapper() });
    result.current.mutate({ email: 'invalid' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.mocked(auth.resetPassword).mockReset();
  });

  it('calls resetPassword with token and password', async () => {
    vi.mocked(auth.resetPassword).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });
    result.current.mutate({ token: 'valid-token', body: { password: 'new-password' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(auth.resetPassword).toHaveBeenCalledWith('valid-token', { password: 'new-password' });
  });

  it('exposes error state on failure', async () => {
    vi.mocked(auth.resetPassword).mockRejectedValueOnce(new auth.AuthError(404, 'Invalid token'));

    const { result } = renderHook(() => useResetPassword(), { wrapper: createWrapper() });
    result.current.mutate({ token: 'invalid', body: { password: 'new-password' } });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
