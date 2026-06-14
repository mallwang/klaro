import { useTranslation } from 'react-i18next';
import { Menu, UnstyledButton, Group, Image } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import englishFlag from './images/english.png';
import germanFlag from './images/german.png';
import classes from './LanguagePicker.module.css';

/**
 * Dropdown language picker component that persists the selected locale to localStorage.
 */

const LANGUAGES = [
  { code: 'en', label: 'English', image: englishFlag },
  { code: 'de', label: 'Deutsch', image: germanFlag },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

/**
 * Renders a flag-and-label dropdown for switching the application language.
 */
export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.language as LangCode;

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  /**
   * Switches the active i18n language and persists the choice to localStorage.
   *
   * @param code - The BCP 47 language code to activate
   */
  function handleSelect(code: LangCode) {
    void i18n.changeLanguage(code);
    localStorage.setItem('pcm-lang', code);
  }

  return (
    <Menu radius="md" width="target" withinPortal={false}>
      <Menu.Target>
        <UnstyledButton className={classes.control}>
          <Group gap="xs">
            <Image src={currentLang.image} w={22} h={22} alt="" />
            <span className={classes.label}>{currentLang.label}</span>
          </Group>
          <IconChevronDown size={16} className={classes.icon} stroke={1.5} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {LANGUAGES.map(({ code, label, image }) => (
          <Menu.Item
            key={code}
            leftSection={<Image src={image} w={18} h={18} alt="" />}
            onClick={() => handleSelect(code)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
