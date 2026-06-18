import { Burger, ActionIcon, Anchor, Group, Text, useMantineColorScheme } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon, IconBrandGithub, IconBrandDocker } from '@tabler/icons-react';
import { LanguagePicker } from './LanguagePicker.js';
import { KlaroIcon } from '../KlaroIcon.js';
import classes from './TopHeader.module.css';

/**
 * Fixed top header bar with the app name, mobile nav burger, language picker, and dark/light
 * mode toggle.
 */

interface TopHeaderProps {
  readonly mobileOpened?: boolean;
  readonly toggleMobile?: () => void;
  readonly showSignIn?: boolean;
}

/**
 * Renders the application top header with branding, mobile burger, language picker, and
 * colour-scheme toggle.
 *
 * @param props - mobileOpened: whether the mobile sidebar is expanded; toggleMobile: callback
 *   to toggle it; showSignIn: whether to show a Sign In link for public pages
 */
/**
 * Returns the i18n key for the current page title based on the route pathname.
 *
 * @param pathname - the current location pathname
 * @returns an i18n key string, or null if no dedicated title exists for the route
 */
function usePageTitle(pathname: string): string | null {
  const { t } = useTranslation();
  if (pathname === '/') return t('dashboard.title');
  if (pathname.startsWith('/contracts/import')) return t('import.title');
  if (pathname.startsWith('/contracts/new')) return t('contractNew.title');
  if (/^\/contracts\/[^/]+\/edit/.test(pathname)) return t('contractEdit.title');
  if (pathname.startsWith('/contracts')) return t('contractList.title');
  if (pathname.startsWith('/account')) return t('accountSettings.title');
  if (pathname.startsWith('/faq')) return t('nav.faq');
  if (pathname.startsWith('/admin')) return t('accountsAdmin.title');
  return null;
}

export function TopHeader({ mobileOpened, toggleMobile, showSignIn }: TopHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const pageTitle = usePageTitle(pathname);

  return (
    <div className={classes.header}>
      <Group className={classes.left}>
        {toggleMobile && (
          <Burger
            opened={mobileOpened ?? false}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
        )}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <KlaroIcon size={28} />
        </Link>
      </Group>

      {pageTitle && (
        <Text fw={600} size="sm" hiddenFrom="sm" className={classes.pageTitle} truncate>
          {pageTitle}
        </Text>
      )}

      <Group className={classes.right}>
        {showSignIn && (
          <Anchor component={Link} to="/sign-in" size="sm" fw={500}>
            {t('auth.signInTitle')}
          </Anchor>
        )}
        <ActionIcon
          component="a"
          href="https://github.com/mallwang/klaro"
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          variant="default"
          radius="xl"
          aria-label="GitHub repository"
        >
          <IconBrandGithub size={18} stroke={1.5} />
        </ActionIcon>
        <ActionIcon
          component="a"
          href="https://hub.docker.com/r/walefish/klaro"
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          variant="default"
          radius="xl"
          aria-label="Docker Hub"
        >
          <IconBrandDocker size={18} stroke={1.5} />
        </ActionIcon>
        <LanguagePicker />
        <ActionIcon
          onClick={toggleColorScheme}
          variant="default"
          size="lg"
          aria-label={colorScheme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
        >
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
      </Group>
    </div>
  );
}
