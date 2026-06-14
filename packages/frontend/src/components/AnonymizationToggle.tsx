import { useTranslation } from 'react-i18next';
import { Switch } from '@mantine/core';

/**
 * Toggle switch for enabling or disabling the global contract name anonymization mode.
 */

interface AnonymizationToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

/**
 * Renders a labeled switch that controls whether contract names are replaced with fantasy
 * aliases.
 *
 * @param props - isActive: current anonymization state; onToggle: callback to flip the state
 */
export function AnonymizationToggle({ isActive, onToggle }: AnonymizationToggleProps) {
  const { t } = useTranslation();

  return (
    <Switch
      checked={isActive}
      onChange={onToggle}
      aria-label={t('anonymization.toggleAriaLabel')}
      label={isActive ? t('anonymization.showReal') : t('anonymization.hideReal')}
      size="sm"
    />
  );
}
