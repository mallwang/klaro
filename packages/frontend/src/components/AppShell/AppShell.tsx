import type { ReactNode } from 'react';
import { AppShell as MantineAppShell, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavbarSegmented } from './NavbarSegmented.js';
import { FooterSimple } from './FooterSimple.js';
import { TopHeader } from './TopHeader.js';
import classes from './AppShell.module.css';

/**
 * Root application shell composing the header, collapsible sidebar navigation, main content
 * area, and footer.
 */

interface AppShellProps {
  children: ReactNode;
}

/**
 * Renders the full-page Mantine AppShell layout with responsive mobile navigation support.
 *
 * @param props - children: page content to render in the main area
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      footer={{ height: 50 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <TopHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar className={classes.navbar}>
        <NavbarSegmented />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main className={classes.main}>
        <Box className={classes.content}>{children}</Box>
      </MantineAppShell.Main>

      <MantineAppShell.Footer>
        <FooterSimple />
      </MantineAppShell.Footer>
    </MantineAppShell>
  );
}
