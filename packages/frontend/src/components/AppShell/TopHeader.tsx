import { Burger, ActionIcon, Group, useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon } from '@tabler/icons-react';
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
}

/**
 * Renders the application top header with branding, mobile burger, language picker, and
 * colour-scheme toggle.
 *
 * @param props - mobileOpened: whether the mobile sidebar is expanded; toggleMobile: callback
 *   to toggle it
 */
export function TopHeader({ mobileOpened, toggleMobile }: TopHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();

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
        <KlaroIcon size={28} />
      </Group>

      <Group className={classes.right}>
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
