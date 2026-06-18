import { Box, Group, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { Link, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBrandGithub, IconBrandDocker, IconSun, IconMoon } from '@tabler/icons-react';
import { KlaroIcon } from '../KlaroIcon.js';
import { LanguagePicker } from './LanguagePicker.js';
import classes from './AuthHeader.module.css';

/**
 * Slim header for public pages: app logo on the left, nav links centred,
 * GitHub, Docker, language picker, and theme toggle on the right.
 */

interface AuthHeaderProps {
  /** Show a "Sign in" link in the right section for unauthenticated public pages. */
  readonly showSignIn?: boolean;
}

/**
 * Renders the public page header with a body-colour background and a bottom border,
 * matching the Mantine header-simple style.
 *
 * @param props - showSignIn: when true, a Sign in link is shown on the right
 */
export function AuthHeader({ showSignIn }: AuthHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const faqActive = useMatch('/faq');
  const signInActive = useMatch('/sign-in');

  return (
    <Box component="header" className={classes.header}>
      <Group h="100%" px="md" justify="space-between">
        {/* Left: branding */}
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

        {/* Centre: navigation links */}
        <Group gap={5}>
          <Link
            to="/faq"
            className={[classes.link, faqActive ? classes.linkActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            {t('nav.faq')}
          </Link>
          {showSignIn && (
            <Link
              to="/sign-in"
              className={[classes.link, signInActive ? classes.linkActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {t('auth.signInTitle')}
            </Link>
          )}
        </Group>

        {/* Right: utility actions */}
        <Group gap="xs">
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
      </Group>
    </Box>
  );
}
