import React from 'react';
import { useTranslation } from '../i18n';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="mt-8 flex items-center justify-center gap-1 text-xs text-gray-400">
      <span>{t('footer.prefix')}</span>
      <span aria-hidden="true" className="text-rose-400">
        ♥
      </span>
      <span>{t('footer.suffix')}</span>
      <a
        href="https://p2enjoy.studio"
        target="_blank"
        rel="noreferrer"
        className="text-indigo-300 hover:underline"
      >
        P2Enjoy Studio
      </a>
    </footer>
  );
};

export default Footer;
