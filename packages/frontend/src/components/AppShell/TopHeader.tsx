import { Burger, Text, ActionIcon, Group, ThemeIcon } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconFileDescription, IconSun, IconMoon } from '@tabler/icons-react';
import { LanguagePicker } from './LanguagePicker.js';
import classes from './TopHeader.module.css';

interface TopHeaderProps {
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function TopHeader({ mobileOpened, toggleMobile }: TopHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();

  return (
    <div className={classes.header}>
      <Group className={classes.left}>
        <Burger
          opened={mobileOpened}
          onClick={toggleMobile}
          hiddenFrom="sm"
          size="sm"
          aria-label="Toggle navigation"
        />
        <ThemeIcon variant="light" size="md">
          <IconFileDescription size={16} />
        </ThemeIcon>
        <Text fw={600} size="sm">
          Personal Contract Management
        </Text>
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
