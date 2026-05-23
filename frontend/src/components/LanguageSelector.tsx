import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '../i18n/types';
import type { SupportedLocale } from '../i18n/types';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const locale = event.target.value as SupportedLocale;
    i18n.changeLanguage(locale);
  }

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      aria-label="Language selector"
      className="bg-canvas-dark text-gray-200 border border-hairline-dark rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-yellow"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
