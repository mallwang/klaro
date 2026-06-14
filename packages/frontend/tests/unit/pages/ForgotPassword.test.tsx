import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthError } from '../../../src/services/auth.js';

vi.mock('../../../src/hooks/useAuth.js', () => ({
  useRequestPasswordReset: vi.fn(),
}));

import * as useAuth from '../../../src/hooks/useAuth.js';
import { ForgotPassword } from '../../../src/pages/ForgotPassword.js';

function renderForgotPasswordPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={['/forgot-password']}>
          <ForgotPassword />
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email form with title "Reset your password"', () => {
    vi.mocked(useAuth.useRequestPasswordReset).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useRequestPasswordReset>);

    renderForgotPasswordPage();
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows success message after submission', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth.useRequestPasswordReset).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useRequestPasswordReset>);

    renderForgotPasswordPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
    });
    expect(mutateAsync).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('shows validation error for invalid email', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new AuthError(400, 'Invalid email'));
    vi.mocked(useAuth.useRequestPasswordReset).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAuth.useRequestPasswordReset>);

    renderForgotPasswordPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'invalid@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });
});
