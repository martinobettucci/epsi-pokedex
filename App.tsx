// App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { AppState as AppStateType, PokemonStatus, PokemonRarity } from './types'; // Import necessary types
import WelcomeScreen from './WelcomeScreen';
import MainGameScreen from './MainGameScreen';
import HallOfFame from './HallOfFame';
import { Loader2 } from 'lucide-react';

type AppScreen = 'loading' | 'welcome' | 'mainGame' | 'hallOfFame';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [canContinueGame, setCanContinueGame] = useState<boolean>(false);
  const [hasUnarchivedProgress, setHasUnarchivedProgress] = useState<boolean>(false);

  // Function to calculate score for archiving
  const calculatePokedexScore = useCallback((pokemons: Parameters<typeof indexedDbService.archiveCurrentGame>[2]) => {
    return pokemons.reduce((score, pokemon) => {
      if (pokemon.status === PokemonStatus.OWNED) {
        return score + 5; // 5 points for each owned Pokémon
      }
      if (pokemon.status === PokemonStatus.RESOLD) {
        return score + 1; // 1 point for each resold Pokémon
      }
      return score;
    }, 0);
  }, []);


  const initializeApp = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      const appState = await indexedDbService.getAppState();
      const pokemons = await indexedDbService.getPokemons();

      const newCanContinueGame = appState.hasActiveGame && pokemons.length > 0;
      const newHasUnarchivedProgress = pokemons.length > 0;

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
  }, [calculatePokedexScore]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleStartNewGame = useCallback(async (archiveCurrent: boolean) => {
    setIsLoadingApp(true);
    try {
      if (archiveCurrent) {
        const pokemonsToArchive = await indexedDbService.getPokemons();
        const tokenBalanceObj = await indexedDbService.getTokenBalance();
        const score = calculatePokedexScore(pokemonsToArchive); // Calculate score using the helper

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, pokemonsToArchive);
      }
      await indexedDbService.clearCurrentGameData(); // Clears pokemons, resets tokens, sets hasActiveGame to true
      await indexedDbService.saveAppState({ id: 'currentAppState', hasActiveGame: true, lastPlayedDate: new Date().toISOString() }); // Ensure active game state is true for a new game
      setCanContinueGame(false); // No pokemon yet, so can't continue
      setHasUnarchivedProgress(false); // Progress cleared
      setCurrentScreen('mainGame');
    } catch (error) {
      console.error('Failed to start new game:', error);
      // Potentially show an error message
    } finally {
      setIsLoadingApp(false);
    }
  }, [calculatePokedexScore]);

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

  const handleViewHallOfFame = useCallback(() => {
    setCurrentScreen('hallOfFame');
  }, []);

  const handleExitGame = useCallback(async () => {
    // When exiting the main game, update app state to no longer have an active game
    await indexedDbService.saveAppState({ id: 'currentAppState', hasActiveGame: false, lastPlayedDate: new Date().toISOString() });
    setCanContinueGame(true); // User has data, so they can 'continue' next time, even if not 'active'
    setCurrentScreen('welcome');
  }, []);

  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" aria-label="Loading Pokémon Lab" />
        <p className="ml-4 text-xl text-gray-700">Loading Pokémon Lab...</p>
      </div>
    );
  }

  return (
    <>
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
          onExitGame={handleExitGame} // Allow exiting to welcome screen
        />
      )}
      {currentScreen === 'hallOfFame' && (
        <HallOfFame
          onBack={handleExitGame} // Go back to welcome screen when leaving hall of fame
        />
      )}
    </>
  );
};

export default App;