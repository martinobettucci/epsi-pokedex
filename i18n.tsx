import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

type Locale = 'en' | 'fr' | 'it';
type TranslationParams = Record<string, string | number>;

const translations: Record<Locale, Record<string, unknown>> = {
  en,
  fr,
  it,
};

const fallbackLocale: Locale = 'en';

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
];

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: TranslationParams) => string;
  languageOptions: typeof languageOptions;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const resolvePath = (obj: Record<string, unknown>, path: string): string | undefined => {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
};

const applyParams = (value: string, params?: TranslationParams): string => {
  if (!params) return value;
  return Object.entries(params).reduce((acc, [key, paramValue]) => {
    return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(paramValue));
  }, value);
};

const detectBrowserLocale = (): Locale => {
  if (typeof navigator === 'undefined') {
    return fallbackLocale;
  }

  const preferred = navigator.languages?.find((lang) =>
    languageOptions.some((option) => lang.toLowerCase().startsWith(option.code))
  ) || navigator.language;

  const matched = languageOptions.find((option) =>
    preferred?.toLowerCase().startsWith(option.code)
  );
  return matched?.code || fallbackLocale;
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => detectBrowserLocale());

  const contextValue = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    languageOptions,
    t: (path: string, params?: TranslationParams) => {
      const text =
        resolvePath(translations[locale], path) ??
        resolvePath(translations[fallbackLocale], path) ??
        path;
      return applyParams(text, params);
    },
  }), [locale]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export type { Locale };
