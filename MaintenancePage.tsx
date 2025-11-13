import React from 'react';
import Button from './components/Button';
import { useTranslation } from './i18n';

interface MaintenancePageProps {
  onRetry: () => void;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-gray-100 px-4">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-black/70 p-8 text-center shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-bold text-red-400 mb-4">{t('maintenance.title')}</h1>
        <p className="text-lg text-gray-300 mb-4">{t('maintenance.body')}</p>
        <p className="text-sm text-gray-400 mb-6">{t('maintenance.invite')}</p>
        <Button variant="primary" onClick={onRetry}>{t('maintenance.button')}</Button>
      </div>
    </div>
  );
};

export default MaintenancePage;
