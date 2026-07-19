import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DiagnosticsReport } from '@pcm/shared';

vi.mock('../../src/hooks/useDiagnostics.js', () => ({
  useDiagnostics: vi.fn(),
}));

import { useDiagnostics } from '../../src/hooks/useDiagnostics.js';
import { DiagnosticsAdmin } from '../../src/pages/admin/DiagnosticsAdmin.js';

const sampleReport: DiagnosticsReport = {
  generatedAt: '2026-07-19T12:00:00.000Z',
  versions: {
    appVersion: '1.5.0',
    dbVersion: { status: 'ok', detail: '3.45.1' },
    runtimeVersion: 'v24.16.0',
  },
  systemChecks: {
    platform: 'linux',
    architecture: 'x64',
    containerized: { status: 'ok', detail: 'true' },
    reverseProxyDetected: { status: 'ok', detail: 'not detected' },
    internetAccess: { status: 'ok', detail: 'reachable' },
    dnsResolution: { status: 'ok', detail: '93.184.216.34' },
    websocketSupport: { status: 'ok', detail: 'disabled' },
    serverTime: { utc: '2026-07-19T12:00:00.000Z', local: '2026-07-19T14:00:00.000+02:00' },
    clockDrift: { status: 'ok', detail: '120ms' },
    domainMatch: {
      status: 'warning',
      detail: 'configured=app.example.com observed=other.example.com',
    },
    https: { status: 'ok', detail: 'true' },
  },
  environmentVariables: {
    smtpHost: { status: 'ok', detail: 'email-smtp.eu-west-1.amazonaws.com' },
    smtpPort: { status: 'ok', detail: '587' },
    smtpFrom: { status: 'ok', detail: 'noreply@example.test' },
    smtpFromName: { status: 'ok', detail: 'Klaro' },
    logoDevConfigured: { status: 'warning', detail: 'not configured' },
  },
};

function renderPage(overrides: Partial<ReturnType<typeof useDiagnostics>> = {}) {
  vi.mocked(useDiagnostics).mockReturnValue({
    data: sampleReport,
    isLoading: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useDiagnostics>);

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MantineProvider>
        <Notifications />
        <MemoryRouter>
          <DiagnosticsAdmin />
        </MemoryRouter>
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe('DiagnosticsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it('renders the Versions, System Checks, and Environment Variables section headings', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /versions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /system checks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /environment variables/i })).toBeInTheDocument();
  });

  it('displays the application, database, and runtime versions', () => {
    renderPage();
    expect(screen.getByText('1.5.0')).toBeInTheDocument();
    expect(screen.getByText('3.45.1')).toBeInTheDocument();
    expect(screen.getByText('v24.16.0')).toBeInTheDocument();
  });

  it('displays system check details with a status badge', () => {
    renderPage();
    expect(screen.getByText('linux')).toBeInTheDocument();
    expect(screen.getByText('not detected')).toBeInTheDocument();
    expect(screen.getByText('reachable')).toBeInTheDocument();
    expect(screen.getAllByText('warning').length).toBeGreaterThanOrEqual(1);
  });

  it('displays the configured SMTP values and logo.dev configuration status', () => {
    renderPage();
    expect(screen.getByText('email-smtp.eu-west-1.amazonaws.com')).toBeInTheDocument();
    expect(screen.getByText('587')).toBeInTheDocument();
    expect(screen.getByText('noreply@example.test')).toBeInTheDocument();
    expect(screen.getByText('Klaro')).toBeInTheDocument();
    expect(screen.getByText('not configured')).toBeInTheDocument();
  });

  it('shows a loading state while the report is being fetched', () => {
    renderPage({ data: undefined, isLoading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows an error message when the report fails to load', () => {
    renderPage({ data: undefined, isLoading: false, isError: true });
    expect(screen.getByText(/failed to load diagnostics/i)).toBeInTheDocument();
  });
});
