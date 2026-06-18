import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { AuthPage } from '../../src/pages/AuthPage.js';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // Pre-seed the session cache as null so the form renders immediately.
  qc.setQueryData(['auth', 'me'], null);
  return ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe('AuthPage — sign-in view', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders email and password input fields', () => {
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders a sign-in submit button', () => {
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not render a "remember me" checkbox', () => {
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });
    expect(screen.queryByLabelText(/remember me/i)).toBeNull();
  });

  it('does not render a "create account" link', () => {
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });
    expect(screen.queryByText(/create account/i)).toBeNull();
  });

  it('renders a "Forgot password?" button that toggles to forgot-password view', async () => {
    const user = userEvent.setup();
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });

    const forgotBtn = screen.getByRole('button', { name: /forgot password/i });
    expect(forgotBtn).toBeInTheDocument();

    await user.click(forgotBtn);

    // After clicking, the forgot-password form should be visible
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // The sign-in submit button should no longer be visible (the back link "Back to sign in" is still present)
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull();
  });

  it('shows an error alert on failed login (401)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    const user = userEvent.setup();
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('does not render a sidebar nav', () => {
    render(<AuthPage initialView="sign-in" />, { wrapper: createWrapper() });
    expect(document.querySelector('nav')).toBeNull();
  });
});

describe('AuthPage — forgot-password view', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the forgot-password form when initialView is forgot-password', () => {
    render(<AuthPage initialView="forgot-password" />, { wrapper: createWrapper() });
    // Should show email field but NOT a password field
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('renders a submit button in forgot-password view but no sign-in submit button', () => {
    render(<AuthPage initialView="forgot-password" />, { wrapper: createWrapper() });
    // The sign-in submit button should not be present
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull();
    // At least one button (send / back to sign in) should exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders a "Back to sign in" button that toggles back to sign-in view', async () => {
    const user = userEvent.setup();
    render(<AuthPage initialView="forgot-password" />, { wrapper: createWrapper() });

    const backBtn = screen.getByRole('button', { name: /back to sign in/i });
    expect(backBtn).toBeInTheDocument();

    await user.click(backBtn);

    // After clicking, sign-in form should be visible
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows success message after successful reset request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const user = userEvent.setup();
    render(<AuthPage initialView="forgot-password" />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    // Find and click the submit button (not the back button)
    const submitBtn = screen.getByRole('button', { name: /send/i });
    await user.click(submitBtn);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
