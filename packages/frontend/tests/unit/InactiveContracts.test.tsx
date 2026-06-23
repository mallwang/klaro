import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { InactiveContracts } from '../../src/components/InactiveContracts.js';
import type { InactiveContract } from '@pcm/shared';

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

const STORAGE_KEY = 'pcm-anonymize';

const sampleData: InactiveContract[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Old Gym Membership',
    category: 'OTHER',
    endDate: '2026-03-01',
    anonymize: false,
    logoName: null,
    useGenericIcon: false,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Cancelled Insurance',
    category: 'INSURANCE',
    endDate: null,
    anonymize: false,
    logoName: null,
    useGenericIcon: false,
  },
];

describe('InactiveContracts', () => {
  it('renders nothing when the list is empty', () => {
    renderWithRouter(<InactiveContracts inactiveContracts={[]} />);
    expect(screen.queryByRole('heading', { name: /inactive contracts/i })).not.toBeInTheDocument();
  });

  it('renders a heading with a count, collapsed by default', () => {
    renderWithRouter(<InactiveContracts inactiveContracts={sampleData} />);
    expect(screen.getByRole('heading', { name: /inactive contracts/i })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inactive contracts/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('reveals all contracts after the header is expanded', async () => {
    renderWithRouter(<InactiveContracts inactiveContracts={sampleData} />);
    await userEvent.click(screen.getByRole('button', { name: /inactive contracts/i }));
    expect(screen.getByText('Old Gym Membership')).toBeInTheDocument();
    expect(screen.getByText('Cancelled Insurance')).toBeInTheDocument();
  });

  it('renders links to the contract edit page for each entry once expanded', async () => {
    renderWithRouter(<InactiveContracts inactiveContracts={sampleData} />);
    await userEvent.click(screen.getByRole('button', { name: /inactive contracts/i }));
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/contracts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit');
    expect(hrefs).toContain('/contracts/b2c3d4e5-f6a7-8901-bcde-f12345678901/edit');
  });

  describe('anonymization', () => {
    afterEach(() => {
      localStorage.removeItem(STORAGE_KEY);
    });

    it('shows real name when global toggle is off and anonymize flag is false', async () => {
      renderWithRouter(<InactiveContracts inactiveContracts={sampleData} />);
      await userEvent.click(screen.getByRole('button', { name: /inactive contracts/i }));
      expect(screen.getByText('Old Gym Membership')).toBeInTheDocument();
    });

    it('hides real name when global toggle is on', async () => {
      localStorage.setItem(STORAGE_KEY, '1');
      renderWithRouter(<InactiveContracts inactiveContracts={sampleData} />);
      await userEvent.click(screen.getByRole('button', { name: /inactive contracts/i }));
      expect(screen.queryByText('Old Gym Membership')).not.toBeInTheDocument();
    });

    it('hides real name for per-contract anonymize flag even when global toggle is off', async () => {
      const withAnonymized: InactiveContract[] = [
        { ...sampleData[0]!, anonymize: true },
        { ...sampleData[1]!, anonymize: false },
      ];
      renderWithRouter(<InactiveContracts inactiveContracts={withAnonymized} />);
      await userEvent.click(screen.getByRole('button', { name: /inactive contracts/i }));
      expect(screen.queryByText('Old Gym Membership')).not.toBeInTheDocument();
      expect(screen.getByText('Cancelled Insurance')).toBeInTheDocument();
    });
  });
});
