import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/hooks/useAccounts.js', () => ({
  useAccounts: vi.fn(),
  useArchiveAccount: vi.fn(),
  useReactivateAccount: vi.fn(),
  useDeleteAccount: vi.fn(),
  useChangeAccountRole: vi.fn(),
}));

vi.mock('../../src/hooks/useInvitations.js', () => ({
  useInvitations: vi.fn(),
  useSendInvitation: vi.fn(),
  useCancelInvitation: vi.fn(),
  useResendInvitation: vi.fn(),
}));

vi.mock('../../src/hooks/useAuth.js', () => ({
  useCurrentUser: vi.fn(() => ({ data: { email: 'admin@example.com' } })),
}));

vi.mock('../../src/services/users.js', () => ({
  sendTestEmail: vi.fn(),
}));

import {
  useAccounts,
  useArchiveAccount,
  useReactivateAccount,
  useDeleteAccount,
  useChangeAccountRole,
} from '../../src/hooks/useAccounts.js';
import {
  useInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
} from '../../src/hooks/useInvitations.js';
import * as usersService from '../../src/services/users.js';
import { AccountsAdmin } from '../../src/pages/admin/AccountsAdmin.js';
import type { Account, Invitation } from '@pcm/shared';

const sampleAccounts: Account[] = [
  {
    id: '1',
    email: 'alice@example.com',
    displayName: 'Alice',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    email: 'bob@example.com',
    displayName: 'Bob',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    email: 'carol@example.com',
    displayName: 'Carol',
    role: 'MEMBER',
    status: 'ARCHIVED',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const noInvitations: Invitation[] = [];

function noop() {
  return { mutate: vi.fn(), isPending: false, error: null };
}

interface RenderPageOptions {
  accounts?: Account[];
  sendInvitationOverride?: ReturnType<typeof useSendInvitation>;
}

function renderPage({ accounts = sampleAccounts, sendInvitationOverride }: RenderPageOptions = {}) {
  vi.mocked(useAccounts).mockReturnValue({
    data: accounts,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useAccounts>);
  vi.mocked(useInvitations).mockReturnValue({
    data: noInvitations,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useInvitations>);
  vi.mocked(useArchiveAccount).mockReturnValue(
    noop() as unknown as ReturnType<typeof useArchiveAccount>,
  );
  vi.mocked(useReactivateAccount).mockReturnValue(
    noop() as unknown as ReturnType<typeof useReactivateAccount>,
  );
  vi.mocked(useDeleteAccount).mockReturnValue(
    noop() as unknown as ReturnType<typeof useDeleteAccount>,
  );
  vi.mocked(useChangeAccountRole).mockReturnValue(
    noop() as unknown as ReturnType<typeof useChangeAccountRole>,
  );
  vi.mocked(useSendInvitation).mockReturnValue(
    sendInvitationOverride ?? (noop() as unknown as ReturnType<typeof useSendInvitation>),
  );
  vi.mocked(useCancelInvitation).mockReturnValue(
    noop() as unknown as ReturnType<typeof useCancelInvitation>,
  );
  vi.mocked(useResendInvitation).mockReturnValue(
    noop() as unknown as ReturnType<typeof useResendInvitation>,
  );

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MantineProvider>
        <Notifications />
        <MemoryRouter>
          <AccountsAdmin />
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('AccountsAdmin – user table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it('renders a row for each account with display name', () => {
    renderPage();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders the email for each account', () => {
    renderPage();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders an Avatar for each user (Mantine Users Table pattern)', () => {
    renderPage();
    const avatars = screen.getAllByText(/^[ABC]$/);
    expect(avatars.length).toBeGreaterThanOrEqual(3);
  });

  it('renders role badges (Administrator / Member)', () => {
    renderPage();
    expect(screen.getByText(/administrator/i)).toBeInTheDocument();
    expect(screen.getAllByText(/member/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders an Archive button for active users', () => {
    renderPage();
    const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
    expect(archiveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a Reactivate button for archived users with a normal email', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /reactivate/i })).toBeInTheDocument();
  });

  it('renders a Delete permanently button for archived users', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /delete permanently/i })).toBeInTheDocument();
  });

  it('hides Reactivate and shows "Email reassigned" for users with a reassigned email', () => {
    const accountsWithReassigned: Account[] = [
      ...sampleAccounts.slice(0, 2),
      {
        id: '3',
        email: '3@archived.invalid',
        displayName: 'Carol',
        role: 'MEMBER',
        status: 'ARCHIVED',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    renderPage({ accounts: accountsWithReassigned });
    expect(screen.queryByRole('button', { name: /reactivate/i })).not.toBeInTheDocument();
    expect(screen.getByText(/email reassigned/i)).toBeInTheDocument();
  });
});

describe('AccountsAdmin – InviteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it('shows a success toast when invitation is sent', async () => {
    const mutate = vi.fn((_args: unknown, options: Record<string, unknown>) => {
      (options.onSuccess as () => void)();
    });
    renderPage({
      sendInvitationOverride: {
        mutate,
        isPending: false,
        error: null,
      } as unknown as ReturnType<typeof useSendInvitation>,
    });

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(await screen.findByText(/invitation sent/i)).toBeInTheDocument();
  });

  it('shows an error toast when invitation fails with 409', async () => {
    const { AuthError } = await import('../../src/services/auth.js');
    const mutate = vi.fn((_args: unknown, options: Record<string, unknown>) => {
      (options.onError as (e: unknown) => void)(new AuthError(409, 'dup'));
    });
    renderPage({
      sendInvitationOverride: {
        mutate,
        isPending: false,
        error: null,
      } as unknown as ReturnType<typeof useSendInvitation>,
    });

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'dup@example.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(
      await screen.findByText('This email address already has an account.'),
    ).toBeInTheDocument();
  });

  it('shows an error toast when invitation fails with 502', async () => {
    const { AuthError } = await import('../../src/services/auth.js');
    const mutate = vi.fn((_args: unknown, options: Record<string, unknown>) => {
      (options.onError as (e: unknown) => void)(new AuthError(502, 'mailer'));
    });
    renderPage({
      sendInvitationOverride: {
        mutate,
        isPending: false,
        error: null,
      } as unknown as ReturnType<typeof useSendInvitation>,
    });

    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /^email$/i }), 'smtp@example.com');
    await user.click(screen.getByRole('button', { name: /send invitation/i }));

    expect(
      await screen.findByText(
        'The invitation email could not be sent. Please check the SMTP configuration.',
      ),
    ).toBeInTheDocument();
  });
});

describe('AccountsAdmin – TestEmailForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it('shows a success toast when test email is sent', async () => {
    vi.mocked(usersService.sendTestEmail).mockResolvedValue(undefined);
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /send test email/i }));

    expect(await screen.findByText('Test email sent successfully.')).toBeInTheDocument();
  });

  it('shows an error toast when test email fails', async () => {
    vi.mocked(usersService.sendTestEmail).mockRejectedValue(new Error('smtp error'));
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /send test email/i }));

    expect(
      await screen.findByText('Failed to send test email. Please check your SMTP configuration.'),
    ).toBeInTheDocument();
  });
});
