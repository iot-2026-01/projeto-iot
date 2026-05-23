export type SupportedLocale = 'pt-BR' | 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'en'];

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'pt-BR': 'Português',
  'en': 'English',
};

export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';
export const STORAGE_KEY = 'i18n-locale';
