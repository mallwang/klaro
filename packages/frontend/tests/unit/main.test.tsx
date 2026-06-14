import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForgotPassword } from '../../src/pages/ForgotPassword.js';
import { ResetPassword } from '../../src/pages/ResetPassword.js';

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ForgotPassword route', () => {
  it('renders ForgotPassword component at /forgot-password', () => {
    renderWithRouter(['/forgot-password']);
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
  });
});

describe('ResetPassword route', () => {
  it('renders ResetPassword component at /reset-password/:token', () => {
    renderWithRouter(['/reset-password/test-token']);
    expect(screen.getByRole('heading', { name: /set a new password/i })).toBeInTheDocument();
  });
});
