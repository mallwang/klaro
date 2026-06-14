import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/services/contracts.js', () => ({
  useContracts: vi.fn(),
  useDeleteContract: vi.fn(),
}));

vi.mock('../../src/hooks/useAnonymization.js', () => ({
  useAnonymization: vi.fn(() => ({
    isAnonymized: false,
    toggleAnonymization: vi.fn(),
    getDisplayName: (name: string) => name,
  })),
}));

vi.mock('../../src/components/ContractTable.js', () => ({
  ContractTable: vi.fn(() => null),
}));

vi.mock('../../src/components/AnonymizationToggle.js', () => ({
  AnonymizationToggle: vi.fn(() => null),
}));

vi.mock('../../src/components/ExportMenu.js', () => ({
  ExportMenu: vi.fn(() => null),
}));

import { useContracts, useDeleteContract } from '../../src/services/contracts.js';
import { ContractList } from '../../src/pages/ContractList.js';

function renderContractList() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MantineProvider>
        <Notifications />
        <MemoryRouter>
          <ContractList />
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('ContractList – toast notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    vi.mocked(useContracts).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useContracts>);
    vi.mocked(useDeleteContract).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeleteContract>);
  });

  it('shows a delete error toast when useDeleteContract onError fires', async () => {
    const mutate = vi.fn((_id: unknown, options: Record<string, unknown>) => {
      (options.onError as () => void)();
    });
    vi.mocked(useDeleteContract).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useDeleteContract>);

    renderContractList();

    // Trigger delete via mutation call that fires onError
    const { ContractTable } = await import('../../src/components/ContractTable.js');
    const onDelete = vi.mocked(ContractTable).mock.calls[0]?.[0]?.onDelete;
    if (onDelete) onDelete('some-id');

    expect(
      await screen.findByText('Failed to delete contract. Please try again.'),
    ).toBeInTheDocument();
  });

  it('shows a load error toast when useContracts returns isError: true', async () => {
    vi.mocked(useContracts).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('network'),
    } as unknown as ReturnType<typeof useContracts>);

    renderContractList();

    expect(await screen.findByText('Failed to load contracts.')).toBeInTheDocument();
  });
});
