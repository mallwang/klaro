import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthPage } from '../../src/pages/AuthPage.js';
import { ResetPassword } from '../../src/pages/ResetPassword.js';

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Pre-seed session cache as null so AuthPage renders the form immediately.
  queryClient.setQueryData(['auth', 'me'], null);
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/forgot-password" element={<AuthPage initialView="forgot-password" />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ForgotPassword route', () => {
  it('renders forgot-password form at /forgot-password', () => {
    renderWithRouter(['/forgot-password']);
    expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
  });
});

describe('ResetPassword route', () => {
  it('renders ResetPassword component at /reset-password/:token', () => {
    renderWithRouter(['/reset-password/test-token']);
    expect(screen.getByRole('heading', { name: /set a new password/i })).toBeInTheDocument();
  });
});
