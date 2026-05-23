import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, STORAGE_KEY } from './types';
import type { SupportedLocale } from './types';

export function getPersistedLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
  } catch {
    // localStorage unavailable — ignore
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — ignore silently
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en': { translation: en },
    },
    lng: getPersistedLocale(),
    fallbackLng: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    parseMissingKeyHandler: (key: string) => key,
    returnNull: false,
  });

// Persist locale on language change
i18n.on('languageChanged', persistLocale);

export default i18n;
