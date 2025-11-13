// App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { AppState as AppStateType, MinimonStatus, MinimonRarity, Minimon, ArchiveTelemetry, StyleBadge } from './types';
import WelcomeScreen from './WelcomeScreen';
import MainGameScreen from './MainGameScreen';
import HallOfFame from './HallOfFame';
import { Loader2 } from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas';
import { balanceConfig, calculateDeckScore } from './utils/gameHelpers';
import { useTranslation } from './i18n';
import Footer from './components/Footer';

type AppScreen = 'loading' | 'welcome' | 'mainGame' | 'hallOfFame';
const SCORE_VERSION = 'v2.0';

const SPEEDY_RUN_SECONDS = 60;

const determineStyleBadge = (minimons: Minimon[], telemetry: ArchiveTelemetry): StyleBadge => {
  if (telemetry.sessionDurationSeconds < SPEEDY_RUN_SECONDS) return 'Speedy gonzales';
  if (telemetry.soldHighRarity) return 'Brave run';
  if (telemetry.quickFlipCount >= 3) return 'No brainer';
  if (telemetry.resellCount === 0) return 'No player';
  const owned = minimons.filter((m) => m.status === MinimonStatus.OWNED).length;
  const resold = minimons.filter((m) => m.status === MinimonStatus.RESOLD).length;
  if (owned >= resold * 2 && owned >= 3) {
    return 'Curator';
  }
  if (resold >= owned && resold >= 2) {
    return 'Flipper';
  }
  return 'Risk-taker';
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [canContinueGame, setCanContinueGame] = useState<boolean>(false);
  const [hasUnarchivedProgress, setHasUnarchivedProgress] = useState<boolean>(false);
  const [sessionTelemetry, setSessionTelemetry] = useState({
    rolls: 0,
    tokensSpent: 0,
    resellCount: 0,
    quickFlipCount: 0,
    soldHighRarity: false,
    startTimestamp: Date.now(),
  });

  const recordGeneration = useCallback(() => {
    setSessionTelemetry((prev) => ({
      ...prev,
      rolls: prev.rolls + 1,
      tokensSpent: prev.tokensSpent + balanceConfig.generationCost,
    }));
  }, []);

  const resetTelemetry = useCallback(() => {
    setSessionTelemetry({ rolls: 0, tokensSpent: 0, resellCount: 0, quickFlipCount: 0, soldHighRarity: false, startTimestamp: Date.now() });
  }, []);

  const calculateMinidekScore = useCallback((minimons: Minimon[], tokenBalance = 0, quickFlipBonus = 0) => {
    return calculateDeckScore(minimons, tokenBalance, quickFlipBonus);
  }, []);

  const initializeApp = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      const appState = await indexedDbService.getAppState();
      const minimons = await indexedDbService.getMinimons();

      const newCanContinueGame = appState.hasActiveGame && minimons.length > 0;
      const newHasUnarchivedProgress = minimons.length > 0;

      setCanContinueGame(newCanContinueGame);
      setHasUnarchivedProgress(newHasUnarchivedProgress);

      if (newCanContinueGame) {
        setCurrentScreen('mainGame');
      } else {
        setCurrentScreen('welcome');
      }
    } catch (error) {
      console.error('Failed to initialize app state:', error);
      setCurrentScreen('welcome');
    } finally {
      setIsLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const host = window.location.hostname;
    if (!host.endsWith('.lelabs.tech')) {
      return;
    }
    if (document.querySelector('script[data-website-id="2e3013b5-1045-41e9-8afb-8ab45d6536ec"]')) {
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://analytics.p2enjoy.studio/umami.js';
    script.setAttribute('data-website-id', '2e3013b5-1045-41e9-8afb-8ab45d6536ec');
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const handleStartNewGame = useCallback(async (archiveCurrent: boolean) => {
    setIsLoadingApp(true);
    try {
      if (archiveCurrent) {
        const minimonsToArchive = await indexedDbService.getMinimons();
        const tokenBalanceObj = await indexedDbService.getTokenBalance();
        const baseTelemetry: ArchiveTelemetry = {
          rolls: sessionTelemetry.rolls,
          tokensSpent: sessionTelemetry.tokensSpent,
          resellCount: sessionTelemetry.resellCount,
          quickFlipCount: sessionTelemetry.quickFlipCount,
          soldHighRarity: sessionTelemetry.soldHighRarity,
          sessionDurationSeconds: Math.round((Date.now() - sessionTelemetry.startTimestamp) / 1000),
          styleBadge: 'Curator',
        };
        const styleBadge = determineStyleBadge(minimonsToArchive, baseTelemetry);
        const telemetry = { ...baseTelemetry, styleBadge };
        const score = calculateMinidekScore(minimonsToArchive, tokenBalanceObj.amount, sessionTelemetry.quickFlipCount);

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, minimonsToArchive, telemetry, SCORE_VERSION);
      }
      await indexedDbService.clearCurrentGameData();
      setCanContinueGame(false);
      setHasUnarchivedProgress(false);
      resetTelemetry();
      setCurrentScreen('mainGame');
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculateMinidekScore, resetTelemetry, sessionTelemetry]);

  const handleContinueGame = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      await indexedDbService.saveAppState({ id: 'currentAppState', hasActiveGame: true, lastPlayedDate: new Date().toISOString() });
      setCurrentScreen('mainGame');
    } catch (error) {
      console.error('Failed to continue game:', error);
    } finally {
      setIsLoadingApp(false);
    }
  }, []);

  const handleEndGameAndArchive = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      const minimonsToArchive = await indexedDbService.getMinimons();
      if (minimonsToArchive.length > 0) {
        const tokenBalanceObj = await indexedDbService.getTokenBalance();
        const baseTelemetry: ArchiveTelemetry = {
          rolls: sessionTelemetry.rolls,
          tokensSpent: sessionTelemetry.tokensSpent,
          resellCount: sessionTelemetry.resellCount,
          quickFlipCount: sessionTelemetry.quickFlipCount,
          soldHighRarity: sessionTelemetry.soldHighRarity,
          sessionDurationSeconds: Math.round((Date.now() - sessionTelemetry.startTimestamp) / 1000),
          styleBadge: 'Curator',
        };
        const styleBadge = determineStyleBadge(minimonsToArchive, baseTelemetry);
        const telemetry = { ...baseTelemetry, styleBadge };
        const score = calculateMinidekScore(minimonsToArchive, tokenBalanceObj.amount, sessionTelemetry.quickFlipCount);

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, minimonsToArchive, telemetry, SCORE_VERSION);
      }
      await indexedDbService.resetGameAfterArchive();
      setCanContinueGame(false);
      setHasUnarchivedProgress(false);
      resetTelemetry();
      setCurrentScreen('welcome');
    } catch (error) {
      console.error('Failed to end game and archive:', error);
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculateMinidekScore, resetTelemetry, sessionTelemetry]);

  const handleViewHallOfFame = useCallback(() => {
    setCurrentScreen('hallOfFame');
  }, []);

  const handleBackToWelcomeFromHallOfFame = useCallback(async () => {
    const appState = await indexedDbService.getAppState();
    const minimons = await indexedDbService.getMinimons();
    const newCanContinueGame = appState.hasActiveGame && minimons.length > 0;
    setCanContinueGame(newCanContinueGame);
    setHasUnarchivedProgress(minimons.length > 0);
    setCurrentScreen('welcome');
  }, []);

  const handleSessionGenerate = () => {
    setSessionTelemetry((prev) => ({
      ...prev,
      rolls: prev.rolls + 1,
      tokensSpent: prev.tokensSpent + balanceConfig.generationCost,
    }));
  };

  const handleSessionResell = (rarity: MinimonRarity, quickFlip: boolean) => {
    setSessionTelemetry((prev) => ({
      ...prev,
      resellCount: prev.resellCount + 1,
      quickFlipCount: prev.quickFlipCount + (quickFlip ? 1 : 0),
      soldHighRarity: prev.soldHighRarity || [MinimonRarity.S, MinimonRarity.S_PLUS].includes(rarity),
    }));
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950 text-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-400 mb-4" aria-label="Loading Minimon Lab" />
        <p className="ml-4 text-xl text-gray-300 drop-shadow-lg">{t('app.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <ParticleCanvas />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex-grow">
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              canContinueGame={canContinueGame}
              hasUnarchivedProgress={hasUnarchivedProgress}
              onStartNewGame={handleStartNewGame}
              onContinueGame={handleContinueGame}
              onViewHallOfFame={handleViewHallOfFame}
            />
          )}
          {currentScreen === 'mainGame' && (
            <MainGameScreen
              onViewHallOfFame={handleViewHallOfFame}
              onEndGameAndArchive={handleEndGameAndArchive}
              quickFlipPoints={sessionTelemetry.quickFlipCount}
              onMinimonGenerated={handleSessionGenerate}
              onMinimonResold={handleSessionResell}
            />
          )}
          {currentScreen === 'hallOfFame' && (
            <HallOfFame onBack={handleBackToWelcomeFromHallOfFame} />
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default App;
