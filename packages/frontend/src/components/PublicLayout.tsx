import type { ReactNode } from 'react';
import { AppShell, Center } from '@mantine/core';
import { TopHeader } from './AppShell/TopHeader.js';
import { FooterSimple } from './AppShell/FooterSimple.js';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 50 }}>
      <AppShell.Header>
        <TopHeader />
      </AppShell.Header>

      <AppShell.Main>
        <Center style={{ minHeight: 'calc(100dvh - 110px)', padding: 'var(--mantine-spacing-xl)' }}>
          {children}
        </Center>
      </AppShell.Main>

      <AppShell.Footer>
        <FooterSimple />
      </AppShell.Footer>
    </AppShell>
  );
}
