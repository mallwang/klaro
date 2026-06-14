import { afterEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Shared test helpers providing a fully-configured render wrapper with
 * MantineProvider, Notifications host, and a fresh QueryClient.
 */

/**
 * Renders the given UI element inside MantineProvider, Notifications, and
 * QueryClientProvider with a fresh QueryClient to prevent state leaking.
 *
 * @param ui - the React element to render
 * @returns the @testing-library/react render result
 */
export function renderWithNotifications(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        {ui}
      </MantineProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  notifications.clean();
});
