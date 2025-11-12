// App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { AppState as AppStateType, PokemonStatus, PokemonRarity } from './types'; // Import necessary types
import WelcomeScreen from './WelcomeScreen';
import MainGameScreen from './MainGameScreen';
import HallOfFame from './HallOfFame';
import { Loader2 } from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas'; // Import ParticleCanvas
import { getRarityPokedexScoreValue } from './utils/gameHelpers'; // Import rarity score helper

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
        return score + getRarityPokedexScoreValue(pokemon.rarity); // Use rarity-based score
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
      // The hasActiveGame is set to true by clearCurrentGameData, no need to explicitly save again
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

  const handleEndGameAndArchive = useCallback(async () => {
    setIsLoadingApp(true);
    try {
      const pokemonsToArchive = await indexedDbService.getPokemons();
      if (pokemonsToArchive.length > 0) {
        const tokenBalanceObj = await indexedDbService.getTokenBalance();
        const score = calculatePokedexScore(pokemonsToArchive);

        await indexedDbService.archiveCurrentGame(score, tokenBalanceObj.amount, pokemonsToArchive);
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
  }, [calculatePokedexScore]);

  const handleViewHallOfFame = useCallback(() => {
    setCurrentScreen('hallOfFame');
  }, []);

  // For Hall of Fame, we want to go back to Welcome screen, but not necessarily 'exit' an active game context
  const handleBackToWelcomeFromHallOfFame = useCallback(async () => {
    // Re-evaluate if there's an active game context from DB
    const appState = await indexedDbService.getAppState();
    const pokemons = await indexedDbService.getPokemons();
    const newCanContinueGame = appState.hasActiveGame && pokemons.length > 0;
    setCanContinueGame(newCanContinueGame);
    setHasUnarchivedProgress(pokemons.length > 0);
    setCurrentScreen('welcome');
  }, []);


  if (isLoadingApp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950 text-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-400 mb-4" aria-label="Loading Pokémon Lab" />
        <p className="ml-4 text-xl text-gray-300 drop-shadow-lg">Loading Pokémon Lab...</p>
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