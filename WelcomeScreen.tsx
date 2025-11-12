// WelcomeScreen.tsx

import React, { useState } from 'react';
import Button from './components/Button';
import Modal from './components/Modal';
import { Sparkles, Coins, Gem, Trophy, PlayCircle, ArrowRightCircle } from 'lucide-react';
import { MinimonRarity } from './types'; // Import MinimonRarity for display
import { getRarityResellValue, getRarityMinidekScoreValue } from './utils/gameHelpers'; // Import rarity helpers
import { useTranslation } from './i18n';
import LanguageSwitcher from './components/LanguageSwitcher';

interface WelcomeScreenProps {
  canContinueGame: boolean;
  hasUnarchivedProgress: boolean; // Indicates if there are minimons that would be lost on a new game
  onStartNewGame: (archiveCurrent: boolean) => void;
  onContinueGame: () => void;
  onViewHallOfFame: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  canContinueGame,
  hasUnarchivedProgress,
  onStartNewGame,
  onContinueGame,
  onViewHallOfFame,
}) => {
  const { t } = useTranslation();
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);

  const handleStartNewGameClick = async () => {
    if (hasUnarchivedProgress) {
      setIsNewGameModalOpen(true);
    } else {
      onStartNewGame(false); // No existing progress, just start fresh
    }
  };

  // Helper to get all rarity values for display
  const allRarities = Object.values(MinimonRarity);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full p-8 sm:p-10 text-left border border-indigo-700/50 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 md:max-w-2xl">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-cyan-400 drop-shadow-lg tracking-wide">
              {t('welcome.title')}
            </h1>
            <p className="text-lg text-gray-300 max-w-prose">
              {t('welcome.subtitle')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 text-left">
          {/* Generation Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Sparkles className="h-6 w-6 text-blue-400" />
              {t('welcome.cards.generation.title')}
            </h2>
            <p className="text-gray-300 mb-2 flex items-center gap-1">
              {t('welcome.cards.generation.cost', { cost: 10 })}
            </p>
            <p className="text-sm text-gray-400">
              {t('welcome.cards.generation.description')}
            </p>
          </div>

          {/* Reselling Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-lime-700 hover:shadow-xl hover:shadow-lime-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-lime-300 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Coins className="h-6 w-6 text-lime-300" />
              {t('welcome.cards.resell.title')}
            </h2>
            <p className="text-gray-300 mb-2">
              {t('welcome.cards.resell.description')}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {allRarities.map(rarity => (
                <div key={`resell-${rarity}`} className="flex items-center gap-1 text-gray-200">
                  <span className="font-semibold">{rarity}</span>: {getRarityResellValue(rarity as MinimonRarity)} tokens
                </div>
              ))}
            </div>
          </div>

          {/* Minidek Score Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-fuchsia-700 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-fuchsia-400 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Trophy className="h-6 w-6 text-fuchsia-400" />
              {t('welcome.cards.score.title')}
            </h2>
            <p className="text-gray-300 mb-2">
              {t('welcome.cards.score.description')}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
              {allRarities.map(rarity => (
                <div key={`score-${rarity}`} className="flex items-center gap-1 text-gray-200">
                  <span className="font-semibold">{rarity}</span>: {getRarityMinidekScoreValue(rarity as MinimonRarity)} pts
                </div>
              ))}
            </div>
            <p className="text-gray-300">
              {t('welcome.cards.score.bonus')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
          {canContinueGame && (
            <Button
              variant="primary"
              size="lg"
              onClick={onContinueGame}
              className="flex items-center justify-center gap-2"
            >
              <PlayCircle className="h-5 w-5" />
              {t('welcome.actions.continue')}
            </Button>
          )}
          <Button
            variant={canContinueGame ? "secondary" : "primary"}
            size="lg"
            onClick={handleStartNewGameClick}
            className="flex items-center justify-center gap-2"
          >
            <Gem className="h-5 w-5" />
            {t('welcome.actions.start')}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onViewHallOfFame}
            className="flex items-center justify-center gap-2"
          >
            <Trophy className="h-5 w-5" />
            {t('welcome.actions.hallOfFame')}
          </Button>
        </div>

        <div className="mt-10 relative sm:max-w-3xl sm:mx-auto">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900/80 to-black border border-cyan-500/30 shadow-[0_20px_60px_rgba(15,118,255,0.45)]" />
          <div className="relative rounded-2xl border border-cyan-500/30 p-6 text-left bg-gradient-to-br from-indigo-900/40 to-slate-900/50 shadow-lg">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-indigo-200 mb-3">
              <ArrowRightCircle className="h-5 w-5 text-cyan-300" />
              {t('welcome.guide.title')}
            </div>
            <p className="text-cyan-100 mb-3 leading-relaxed">
              {t('welcome.guide.paragraph1')}
            </p>
            <p className="text-cyan-100 mb-3 leading-relaxed">
              {t('welcome.guide.paragraph2')}
            </p>
            <p className="text-sm text-indigo-200">
              {t('welcome.guide.paragraph3')}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        title={t('welcome.modal.title')}
        onConfirm={() => {
          onStartNewGame(true); // Archive current progress
          setIsNewGameModalOpen(false);
        }}
        confirmButtonText={t('welcome.modal.confirm')}
        cancelButtonText={t('common.cancel')}
        confirmButtonVariant="primary"
      >
        <p className="text-gray-200">
          {t('welcome.modal.body')}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {t('welcome.modal.warning')}
        </p>
      </Modal>
      <footer className="mt-8 text-center text-xs text-gray-400">
        {t('footer.prefix')} <span aria-hidden="true">♥</span> {t('footer.suffix')}{' '}
        <a
          href="https://p2enjoy.studio"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-300 hover:underline"
        >
          P2Enjoy Studio
        </a>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
