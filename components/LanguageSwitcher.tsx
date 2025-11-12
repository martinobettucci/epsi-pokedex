import React from 'react';
import { useTranslation } from 'react-i18next';

const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
];

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  const currentLanguage = i18n.resolvedLanguage || 'en';

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
      <label htmlFor="language-switcher" className="uppercase tracking-[0.3em] text-xs text-indigo-300">
        {t('welcome.languageLabel')}
      </label>
      <select
        id="language-switcher"
        value={currentLanguage}
        onChange={handleChange}
        className="bg-slate-900/70 border border-indigo-500/40 text-white text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
