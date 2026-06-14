import { useTranslation } from 'react-i18next';
import classes from './LanguageSwitcher.module.css';

/**
 * Accessible button-group language switcher used on public pages where the full dropdown
 * LanguagePicker is not available.
 */

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

/**
 * Renders a pair of toggle buttons for switching between English and German.
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as LangCode;

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
    <div className={classes.root} role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => handleSelect(code)}
          aria-label={label}
          aria-pressed={current === code}
          className={`${classes.langButton} ${current === code ? classes.langButtonActive : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
