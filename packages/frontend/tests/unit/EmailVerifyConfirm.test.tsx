import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthError } from '../../src/services/auth.js';

vi.mock('../../src/services/profile.js', () => ({
  updateDisplayName: vi.fn(),
  requestEmailChange: vi.fn(),
  getPendingEmailChange: vi.fn(),
  confirmEmailChange: vi.fn(),
}));

import * as profileService from '../../src/services/profile.js';
import { EmailVerifyConfirm } from '../../src/pages/EmailVerifyConfirm.js';

function renderConfirmPage(token = 'test-token') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MemoryRouter initialEntries={[`/email-change/confirm/${token}`]}>
          <Routes>
            <Route path="/email-change/confirm/:token" element={<EmailVerifyConfirm />} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('EmailVerifyConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state initially', () => {
    vi.mocked(profileService.confirmEmailChange).mockReturnValue(new Promise(() => {}));
    renderConfirmPage();
    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
  });

  it('shows a success message after the token is confirmed', async () => {
    vi.mocked(profileService.confirmEmailChange).mockResolvedValue(undefined);
    renderConfirmPage();
    expect(await screen.findByText(/email address has been updated/i)).toBeInTheDocument();
  });

  it('shows an expired message after a 410 error', async () => {
    vi.mocked(profileService.confirmEmailChange).mockRejectedValue(new AuthError(410, 'expired'));
    renderConfirmPage();
    expect(await screen.findByText(/link has expired/i)).toBeInTheDocument();
  });

  it('shows a not-found message after a 404 error', async () => {
    vi.mocked(profileService.confirmEmailChange).mockRejectedValue(new AuthError(404, 'not found'));
    renderConfirmPage();
    expect(await screen.findByText(/link is not valid/i)).toBeInTheDocument();
  });
});
