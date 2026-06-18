import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthImageLayout } from '../../src/components/AuthImageLayout.js';

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MantineProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  );
}

describe('AuthImageLayout', () => {
  it('renders children in the form column', () => {
    renderWithProviders(
      <AuthImageLayout>
        <div data-testid="test-child">Test Content</div>
      </AuthImageLayout>,
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('accepts arbitrary children without sign-in-specific logic', () => {
    renderWithProviders(
      <AuthImageLayout>
        <div data-testid="custom-child" />
      </AuthImageLayout>,
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  it('renders the page shell without a sidebar nav', () => {
    renderWithProviders(
      <AuthImageLayout>
        <span>content</span>
      </AuthImageLayout>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    // PublicLayout-based shell has no sidebar nav element
    expect(document.querySelector('nav')).toBeNull();
  });

  it('renders with a custom imageUrl prop without error', () => {
    renderWithProviders(
      <AuthImageLayout imageUrl="https://example.com/img.jpg">
        <span>form</span>
      </AuthImageLayout>,
    );
    expect(screen.getByText('form')).toBeInTheDocument();
  });
});
