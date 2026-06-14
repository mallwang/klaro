import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ContractData } from '@pcm/shared';

vi.mock('../../src/services/profile.js', () => ({
  deleteSelf: vi.fn(),
  AuthError: class AuthError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('../../src/services/export.js', () => ({
  exportToJson: vi.fn(),
}));

import { DeleteAccountModal } from '../../src/components/DeleteAccountModal.js';
import * as profileService from '../../src/services/profile.js';
import * as exportService from '../../src/services/export.js';

const sampleContracts: ContractData[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Netflix',
    category: 'SUBSCRIPTIONS',
    amount: 15.99,
    billingInterval: 'MONTHLY',
    status: 'ACTIVE',
    endDate: null,
    startDate: null,
    details: null,
    serviceUrl: null,
    cancellationPeriod: null,
    anonymize: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function renderModal(props: Partial<Parameters<typeof DeleteAccountModal>[0]> = {}) {
  const defaults = {
    opened: true,
    onClose: vi.fn(),
    onDeleted: vi.fn(),
    contracts: sampleContracts,
    isSoleAdmin: false,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <DeleteAccountModal {...defaults} {...props} />
        </MantineProvider>
      </QueryClientProvider>,
    ),
    onClose: props.onClose ?? defaults.onClose,
    onDeleted: props.onDeleted ?? defaults.onDeleted,
  };
}

// ─── US1: Step 1 — Export advisory ───────────────────────────────────────────

describe('DeleteAccountModal – step 1 (export advisory)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export warning text', () => {
    renderModal();
    expect(screen.getByText(/permanent|irreversible|warning/i)).toBeInTheDocument();
  });

  it('renders "Download contracts as JSON" button when contracts array is non-empty', () => {
    renderModal({ contracts: sampleContracts });
    expect(
      screen.getByRole('button', { name: /download.*json|export.*json/i }),
    ).toBeInTheDocument();
  });

  it('renders "no contracts to export" notice when contracts array is empty', () => {
    renderModal({ contracts: [] });
    expect(
      screen.queryByRole('button', { name: /download.*json|export.*json/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no contracts/i)).toBeInTheDocument();
  });

  it('clicking download button calls exportToJson with the contracts prop', async () => {
    const user = userEvent.setup();
    renderModal({ contracts: sampleContracts });
    await user.click(screen.getByRole('button', { name: /download.*json|export.*json/i }));
    expect(exportService.exportToJson).toHaveBeenCalledWith(sampleContracts);
  });

  it('clicking skip advances to step 2', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(
      screen.getByRole('button', { name: /permanently delete|confirm.*delete|delete.*account/i }),
    ).toBeInTheDocument();
  });

  it('clicking modal close button calls onClose without calling deleteSelf', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
    expect(profileService.deleteSelf).not.toHaveBeenCalled();
  });
});

// ─── US2: Step 2 — Confirmation ──────────────────────────────────────────────

describe('DeleteAccountModal – step 2 (confirmation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function advanceToStep2() {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    renderModal({ onClose, onDeleted });
    await user.click(screen.getByRole('button', { name: /skip/i }));
    return { user, onClose, onDeleted };
  }

  it('after skip: confirmation button is visible and labelled', async () => {
    await advanceToStep2();
    expect(
      screen.getByRole('button', { name: /permanently delete|confirm.*delete|delete.*account/i }),
    ).toBeInTheDocument();
  });

  it('clicking confirm calls deleteSelf() and then calls onDeleted on success', async () => {
    vi.mocked(profileService.deleteSelf).mockResolvedValue(undefined);
    const { user, onDeleted } = await advanceToStep2();
    await user.click(
      screen.getByRole('button', { name: /permanently delete|confirm.*delete|delete.*account/i }),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(profileService.deleteSelf).toHaveBeenCalled();
  });

  it('error alert rendered when deleteSelf() rejects', async () => {
    vi.mocked(profileService.deleteSelf).mockRejectedValue(new Error('server error'));
    const { user } = await advanceToStep2();
    await user.click(
      screen.getByRole('button', { name: /permanently delete|confirm.*delete|delete.*account/i }),
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('cancel button at step 2 calls onClose and does not call deleteSelf()', async () => {
    const { user, onClose } = await advanceToStep2();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
    expect(profileService.deleteSelf).not.toHaveBeenCalled();
  });
});

// ─── US3: Sole-admin disabled state ──────────────────────────────────────────

describe('DeleteAccountModal – sole-admin disabled state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function skipToStep2(isSoleAdmin: boolean) {
    const user = userEvent.setup();
    renderModal({ isSoleAdmin });
    await user.click(screen.getByRole('button', { name: /skip/i }));
    return { user };
  }

  it('when isSoleAdmin=true: confirm button is disabled and sole-admin message is visible', async () => {
    await skipToStep2(true);
    const confirmBtn = screen.getByRole('button', {
      name: /permanently delete|confirm.*delete|delete.*account/i,
    });
    expect(confirmBtn).toBeDisabled();
    expect(screen.getByText(/only administrator|sole admin|promote another/i)).toBeInTheDocument();
  });

  it('when isSoleAdmin=false: confirm button is enabled and sole-admin message is absent', async () => {
    await skipToStep2(false);
    const confirmBtn = screen.getByRole('button', {
      name: /permanently delete|confirm.*delete|delete.*account/i,
    });
    expect(confirmBtn).not.toBeDisabled();
    expect(
      screen.queryByText(/only administrator|sole admin|promote another/i),
    ).not.toBeInTheDocument();
  });
});
