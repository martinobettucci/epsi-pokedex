import React from 'react';
import { Locale, useTranslation } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { t, locale, setLocale, languageOptions } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value as Locale);
  };

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
      <label htmlFor="language-switcher" className="uppercase tracking-[0.3em] text-xs text-indigo-300">
        {t('welcome.languageLabel')}
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={handleChange}
        className="bg-slate-900/70 border border-indigo-500/40 text-white text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
