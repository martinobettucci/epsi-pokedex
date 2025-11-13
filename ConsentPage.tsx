import React from 'react';
import Button from './components/Button';
import { useTranslation } from './i18n';

interface ConsentPageProps {
  onAccept: () => void;
}

const ConsentPage: React.FC<ConsentPageProps> = ({ onAccept }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-black to-indigo-950 px-4 py-8 text-gray-100">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/60 p-8 text-left shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-bold text-cyan-300 mb-4">{t('consent.title')}</h1>
        <p className="text-lg text-gray-200 mb-6 leading-relaxed">{t('consent.body')}</p>
        <ul className="space-y-3 text-sm text-gray-300 mb-6">
          <li>• {t('consent.pointDevice')}</li>
          <li>• {t('consent.pointHosting')}</li>
          <li>• {t('consent.pointNoCollection')}</li>
          <li>• {t('consent.pointAcceptance')}</li>
        </ul>
        <div className="flex justify-end">
          <Button variant="primary" size="lg" onClick={onAccept}>
            {t('consent.button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
