import { useTranslation } from 'react-i18next';

/**
 * Hook providing locale-aware currency and date formatting using the active i18n language.
 */

/**
 * Returns formatCurrency and formatDate functions bound to the currently active locale.
 */
export function useLocaleFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  /**
   * Formats a number as a EUR currency string in the active locale.
   *
   * @param value - The numeric amount to format
   * @returns A locale-formatted currency string, e.g. "€1,234.56"
   */
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formats an ISO date string as a short date in the active locale.
   *
   * @param iso - ISO 8601 date or datetime string
   * @returns A locale-formatted date string, e.g. "14.06.2026" or "06/14/2026"
   */
  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  }

  return { formatCurrency, formatDate };
}
