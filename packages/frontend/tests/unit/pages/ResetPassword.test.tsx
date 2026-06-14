import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthError } from '../../../src/services/auth.js';
import type { SessionUser } from '@pcm/shared';

vi.mock('../../../src/hooks/useAuth.js', () => ({
  useResetPassword: vi.fn(),
  CURRENT_USER_QUERY_KEY: ['auth', 'me'],
}));

import * as useAuth from '../../../src/hooks/useAuth.js';
import { ResetPassword } from '../../../src/pages/ResetPassword.js';

const mockUser: SessionUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'MEMBER',
};

function renderResetPasswordPage(token = 'valid-token') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
          <Routes>
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password form with title "Set a new password"', () => {
    vi.mocked(useAuth.useResetPassword).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useResetPassword>);

    renderResetPasswordPage();
    expect(screen.getByRole('heading', { name: /set a new password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows success message after submission', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(mockUser);
    vi.mocked(useAuth.useResetPassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useResetPassword>);

    renderResetPasswordPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), 'new-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'new-password');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password has been reset/i)).toBeInTheDocument();
    });
    expect(mutateAsync).toHaveBeenCalledWith({
      token: 'valid-token',
      body: { password: 'new-password' },
    });
  });

  it('shows validation error when passwords do not match', async () => {
    vi.mocked(useAuth.useResetPassword).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useResetPassword>);

    renderResetPasswordPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), 'password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'password2');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid token', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new AuthError(404, 'Invalid token'));
    vi.mocked(useAuth.useResetPassword).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useResetPassword>);

    renderResetPasswordPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/new password/i), 'new-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'new-password');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument();
    });
  });
});
