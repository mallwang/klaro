import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SessionUser } from '@pcm/shared';

vi.mock('../../src/hooks/useAuth.js', () => ({
  useCurrentUser: vi.fn(),
  CURRENT_USER_QUERY_KEY: ['auth', 'me'],
}));

vi.mock('../../src/services/profile.js', () => ({
  updateDisplayName: vi.fn(),
  requestEmailChange: vi.fn(),
  getPendingEmailChange: vi.fn(),
  deleteSelf: vi.fn(),
}));

vi.mock('../../src/services/auth.js', () => ({
  changePassword: vi.fn(),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('../../src/services/contracts.js', () => ({
  useContracts: vi.fn(() => ({ data: [] })),
}));

vi.mock('../../src/services/users.js', () => ({
  fetchAccounts: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../src/hooks/useAccounts.js', () => ({
  ACCOUNTS_QUERY_KEY: ['accounts'],
}));

vi.mock('../../src/components/DeleteAccountModal.js', () => ({
  DeleteAccountModal: vi.fn(() => null),
}));

import { useCurrentUser } from '../../src/hooks/useAuth.js';
import * as profileService from '../../src/services/profile.js';
import { AccountSettings } from '../../src/pages/AccountSettings.js';

const testUser: SessionUser = {
  id: 'user-1',
  displayName: 'Jane Smith',
  email: 'jane@example.com',
  role: 'MEMBER',
};

function renderAccountSettings(user: SessionUser | null = testUser) {
  vi.mocked(useCurrentUser).mockReturnValue({ data: user } as ReturnType<typeof useCurrentUser>);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Notifications />
          <MemoryRouter>
            <AccountSettings />
          </MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>,
    ),
  };
}

// ─── US1: Display Name section ────────────────────────────────────────────────

describe('AccountSettings – Display Name section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
  });

  it('renders the display name input pre-filled with the current user name', () => {
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /display name/i });
    expect(input).toHaveValue('Jane Smith');
  });

  it('calls updateDisplayName with the new name on submit', async () => {
    vi.mocked(profileService.updateDisplayName).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /display name/i });
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByRole('button', { name: /save display name/i }));
    await waitFor(() =>
      expect(vi.mocked(profileService.updateDisplayName).mock.calls[0]?.[0]).toBe('New Name'),
    );
  });

  it('shows a success toast after saving display name', async () => {
    vi.mocked(profileService.updateDisplayName).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /display name/i });
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByRole('button', { name: /save display name/i }));
    expect(await screen.findByText('Display name updated.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows an error toast when updateDisplayName fails', async () => {
    vi.mocked(profileService.updateDisplayName).mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /display name/i });
    await user.clear(input);
    await user.type(input, 'Bad Name');
    await user.click(screen.getByRole('button', { name: /save display name/i }));
    expect(
      await screen.findByText('Failed to update display name. Please try again.'),
    ).toBeInTheDocument();
  });

  it('does not call updateDisplayName when display name is empty', async () => {
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /display name/i });
    await user.clear(input);
    const btn = screen.getByRole('button', { name: /save display name/i });
    await user.click(btn);
    expect(profileService.updateDisplayName).not.toHaveBeenCalled();
  });
});

// ─── US3: Email Address section ───────────────────────────────────────────────

describe('AccountSettings – Email Address section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    vi.mocked(profileService.updateDisplayName).mockResolvedValue(undefined);
  });

  it('renders the current email as read-only text', () => {
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
    renderAccountSettings();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders a pending verification notice when pending email is present', async () => {
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({
      pendingEmail: 'new@example.com',
    });
    renderAccountSettings();
    await waitFor(() => expect(screen.getByText(/new@example\.com/i)).toBeInTheDocument());
  });

  it('calls requestEmailChange and shows success toast on success', async () => {
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
    vi.mocked(profileService.requestEmailChange).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /new email address/i });
    await user.type(input, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /request email change/i }));
    await waitFor(() =>
      expect(vi.mocked(profileService.requestEmailChange).mock.calls[0]?.[0]).toBe(
        'new@example.com',
      ),
    );
    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
  });

  it('shows a conflict error toast when requestEmailChange throws a 409', async () => {
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
    const { AuthError } = await import('../../src/services/auth.js');
    vi.mocked(profileService.requestEmailChange).mockRejectedValue(new AuthError(409, 'conflict'));
    const user = userEvent.setup();
    renderAccountSettings();
    const input = screen.getByRole('textbox', { name: /new email address/i });
    await user.type(input, 'taken@example.com');
    await user.click(screen.getByRole('button', { name: /request email change/i }));
    expect(
      await screen.findByText('This email address is already in use by another account.'),
    ).toBeInTheDocument();
  });
});

// ─── Password section ─────────────────────────────────────────────────────────

describe('AccountSettings – Password section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
  });

  it('shows a success toast after changing password', async () => {
    const { changePassword } = await import('../../src/services/auth.js');
    vi.mocked(changePassword).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAccountSettings();
    await user.type(screen.getByLabelText(/current password/i), 'old-pass');
    await user.type(screen.getByLabelText(/new password/i), 'new-pass-long');
    await user.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument();
  });

  it('shows an error toast when password change fails with 401', async () => {
    const { changePassword, AuthError } = await import('../../src/services/auth.js');
    vi.mocked(changePassword).mockRejectedValue(new AuthError(401, 'wrong'));
    const user = userEvent.setup();
    renderAccountSettings();
    await user.type(screen.getByLabelText(/current password/i), 'wrong-pass');
    await user.type(screen.getByLabelText(/new password/i), 'new-pass-long');
    await user.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();
  });
});

// ─── Danger Zone section ──────────────────────────────────────────────────────

describe('AccountSettings – Danger Zone section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    vi.mocked(profileService.getPendingEmailChange).mockResolvedValue({ pendingEmail: null });
  });

  it('renders the Danger Zone Paper section', () => {
    renderAccountSettings();
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
  });

  it('renders the "Delete Account" button', () => {
    renderAccountSettings();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });
});
