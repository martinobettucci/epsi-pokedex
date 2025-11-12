// WelcomeScreen.tsx

import React, { useState } from 'react';
import Button from './components/Button';
import Modal from './components/Modal';
import { Sparkles, Coins, Gem, Trophy, PlayCircle, ArrowRightCircle } from 'lucide-react';
import { PokemonRarity } from './types'; // Import PokemonRarity for display
import { getRarityResellValue, getRarityPokedexScoreValue } from './utils/gameHelpers'; // Import rarity helpers

interface WelcomeScreenProps {
  canContinueGame: boolean;
  hasUnarchivedProgress: boolean; // Indicates if there are pokemons that would be lost on a new game
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
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);

  const handleStartNewGameClick = async () => {
    if (hasUnarchivedProgress) {
      setIsNewGameModalOpen(true);
    } else {
      onStartNewGame(false); // No existing progress, just start fresh
    }
  };

  // Helper to get all rarity values for display
  const allRarities = Object.values(PokemonRarity);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full p-8 sm:p-10 text-center border border-indigo-700/50">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-cyan-400 mb-6 drop-shadow-lg tracking-wide">
          Pokémon Lab
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-prose mx-auto">
          Welcome, Trainer! Unleash your creativity and generate unique Pokémon using cutting-edge AI. Collect them, manage your tokens, and strive for the ultimate Pokédex!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 text-left">
          {/* Generation Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Sparkles className="h-6 w-6 text-blue-400" />
              Generation
            </h2>
            <p className="text-gray-300 mb-2 flex items-center gap-1">Each new Pokémon costs <span className="font-bold text-red-400 flex items-center"><Coins className="h-4 w-4 mr-1 text-red-400"/>10 tokens</span>.</p>
            <p className="text-sm text-gray-400">Discover unique creatures with varying rarities!</p>
          </div>

          {/* Reselling Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-lime-700 hover:shadow-xl hover:shadow-lime-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-lime-300 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Coins className="h-6 w-6 text-lime-300" />
              Reselling
            </h2>
            <p className="text-gray-300 mb-2">Earn tokens back by reselling your Pokémon:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {allRarities.map(rarity => (
                <div key={`resell-${rarity}`} className="flex items-center gap-1 text-gray-200">
                  <span className="font-semibold">{rarity}</span>: {getRarityResellValue(rarity)} tokens
                </div>
              ))}
            </div>
          </div>

          {/* Pokédex Score Card */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col items-center border border-fuchsia-700 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-200">
            <h2 className="text-xl font-bold text-fuchsia-400 mb-3 flex items-center gap-2 drop-shadow-sm tracking-tight">
              <Trophy className="h-6 w-6 text-fuchsia-400" />
              Pokédex Score
            </h2>
            <p className="text-gray-300 mb-2">Earn points for OWNED Pokémon based on rarity:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
              {allRarities.map(rarity => (
                <div key={`score-${rarity}`} className="flex items-center gap-1 text-gray-200">
                  <span className="font-semibold">{rarity}</span>: {getRarityPokedexScoreValue(rarity)} pts
                </div>
              ))}
            </div>
            <p className="text-gray-300"><span className="font-bold text-blue-300">1 point</span> for each resold Pokémon.</p>
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
              Continue Game
            </Button>
          )}
          <Button
            variant={canContinueGame ? "secondary" : "primary"}
            size="lg"
            onClick={handleStartNewGameClick}
            className="flex items-center justify-center gap-2"
          >
            <Gem className="h-5 w-5" />
            Start New Game
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onViewHallOfFame}
            className="flex items-center justify-center gap-2"
          >
            <Trophy className="h-5 w-5" />
            Hall of Fame
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        title="Start New Game"
        onConfirm={() => {
          onStartNewGame(true); // Archive current progress
          setIsNewGameModalOpen(false);
        }}
        confirmButtonText="Archive & Start New"
        cancelButtonText="Cancel"
        confirmButtonVariant="primary"
      >
        <p className="text-gray-200">
          You currently have unarchived progress with collected Pokémon and tokens.
          Would you like to save your current Pokédex and token balance to the Hall of Fame
          before starting a new game?
        </p>
        <p className="text-sm text-gray-400 mt-2">
          If you start a new game without archiving, your current progress will be lost.
        </p>
      </Modal>
    </div>
  );
};

export default WelcomeScreen;