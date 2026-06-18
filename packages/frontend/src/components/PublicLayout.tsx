import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { AuthHeader } from './AppShell/AuthHeader.js';

/**
 * Page layout for unauthenticated public routes (e.g. FAQ). Uses the same slim
 * AuthHeader as the auth pages — no footer, no sidebar.
 */

interface PublicLayoutProps {
  readonly children: ReactNode;
}

/**
 * Renders the public page shell with AuthHeader and scrollable content area.
 *
 * @param props - children: page content
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AuthHeader showSignIn />
      <Box style={{ flex: 1, padding: 'var(--mantine-spacing-xl)' }}>{children}</Box>
    </Box>
  );
}
