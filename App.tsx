// App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { AppState as AppStateType, MinimonStatus, MinimonRarity, Minimon } from './types'; // Import necessary types
import WelcomeScreen from './WelcomeScreen';
import MainGameScreen from './MainGameScreen';
import HallOfFame from './HallOfFame';
import { Loader2 } from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas'; // Import ParticleCanvas
import { getRarityMinidekScoreValue } from './utils/gameHelpers'; // Import rarity score helper

type AppScreen = 'loading' | 'welcome' | 'mainGame' | 'hallOfFame';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [canContinueGame, setCanContinueGame] = useState<boolean>(false);
  const [hasUnarchivedProgress, setHasUnarchivedProgress] = useState<boolean>(false);

  // Function to calculate score for archiving
  const calculateMinidekScore = useCallback((minimons: Minimon[]) => {
    return minimons.reduce((score, minimon) => {
      if (minimon.status === MinimonStatus.OWNED) {
        return score + getRarityMinidekScoreValue(minimon.rarity); // Use rarity-based score
      }
      if (minimon.status === MinimonStatus.RESOLD) {
        return score + 1; // 1 point for each resold Minimon
      }
      return score;
    }, 0);
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
      setCurrentScreen('welcome'); // Fallback to welcome screen on error
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculateMinidekScore]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleStartNewGame = useCallback(async (archiveCurrent: boolean) => {
    setIsLoadingApp(true);
    try {
      if (archiveCurrent) {
        const minimonsToArchive = await indexedDbService.getMinimons();
        const tokenBalanceObj = await indexedDbService.getTokenBalance();
        const score = calculateMinidekScore(minimonsToArchive); // Calculate score using the helper

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, minimonsToArchive);
      }
      await indexedDbService.clearCurrentGameData(); // Clears minimons, resets tokens, sets hasActiveGame to true
      // The hasActiveGame is set to true by clearCurrentGameData, no need to explicitly save again
      setCanContinueGame(false); // No minimon yet, so can't continue
      setHasUnarchivedProgress(false); // Progress cleared
      setCurrentScreen('mainGame');
    } catch (error) {
      console.error('Failed to start new game:', error);
      // Potentially show an error message
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculateMinidekScore]);

  const handleContinueGame = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      // Ensure app state is marked as active before continuing
      await indexedDbService.saveAppState({ id: 'currentAppState', hasActiveGame: true, lastPlayedDate: new Date().toISOString() });
      setCurrentScreen('mainGame');
    } catch (error) {
      console.error('Failed to continue game:', error);
      // Potentially show an error message
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
        const score = calculateMinidekScore(minimonsToArchive);

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, minimonsToArchive);
      }
      
      // Clear current game data and deactivate active game state
      await indexedDbService.resetGameAfterArchive();

      setCanContinueGame(false); // Game is ended, no active game to continue
      setHasUnarchivedProgress(false); // Progress cleared
      setCurrentScreen('welcome');
    } catch (error) {
      console.error('Failed to end game and archive:', error);
      // Potentially show an error message
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculateMinidekScore]);

  const handleViewHallOfFame = useCallback(() => {
    setCurrentScreen('hallOfFame');
  }, []);

  // For Hall of Fame, we want to go back to Welcome screen, but not necessarily 'exit' an active game context
  const handleBackToWelcomeFromHallOfFame = useCallback(async () => {
    // Re-evaluate if there's an active game context from DB
    const appState = await indexedDbService.getAppState();
    const minimons = await indexedDbService.getMinimons();
    const newCanContinueGame = appState.hasActiveGame && minimons.length > 0;
    setCanContinueGame(newCanContinueGame);
    setHasUnarchivedProgress(minimons.length > 0);
    setCurrentScreen('welcome');
  }, []);


  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950 text-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-400 mb-4" aria-label="Loading Minimon Lab" />
        <p className="ml-4 text-xl text-gray-300 drop-shadow-lg">Loading Minimon Lab...</p>
      </div>
    );
  }

  return (
    <>
      <ParticleCanvas /> {/* Render ParticleCanvas as a background */}
      <div className="relative z-10"> {/* Ensure content is above particles */}
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
            onEndGameAndArchive={handleEndGameAndArchive} // New prop for ending and archiving
          />
        )}
        {currentScreen === 'hallOfFame' && (
          <HallOfFame
            onBack={handleBackToWelcomeFromHallOfFame} // Go back to welcome screen when leaving hall of fame
          />
        )}
      </div>
    </>
  );
};

export default App;