// WelcomeScreen.tsx

import React, { useState } from 'react';
import Button from './components/Button';
import Modal from './components/Modal';
import { Sparkles, Coins, Gem, Trophy, Star, PlayCircle, ArrowRightCircle } from 'lucide-react';
import { PokemonRarity } from './types'; // Import PokemonRarity for display
import { indexedDbService } from './services/indexedDbService'; // Import indexedDbService (though less direct usage after App.tsx changes)

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

  const RarityDisplay: React.FC<{ rarity: PokemonRarity; value: number }> = ({ rarity, value }) => (
    <div className="flex items-center gap-1 text-sm text-gray-700">
      <Star className="h-4 w-4 text-yellow-400" />
      <span className="font-semibold">{rarity}</span>: {value} tokens
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 sm:p-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-800 mb-6 drop-shadow-md">
          Pokémon Lab
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-prose mx-auto">
          Welcome, Trainer! Unleash your creativity and generate unique Pokémon using cutting-edge AI. Collect them, manage your tokens, and strive for the ultimate Pokédex!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Generation
            </h2>
            <p className="text-gray-700 mb-2">Each new Pokémon costs <span className="font-bold text-red-600">10 tokens</span>.</p>
            <p className="text-sm text-gray-600">Discover unique creatures with varying rarities!</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
              <Coins className="h-6 w-6 text-green-600" />
              Reselling
            </h2>
            <p className="text-gray-700 mb-2">Earn tokens back by reselling your Pokémon:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <RarityDisplay rarity={PokemonRarity.F} value={1} />
              <RarityDisplay rarity={PokemonRarity.E} value={2} />
              <RarityDisplay rarity={PokemonRarity.D} value={3} />
              <RarityDisplay rarity={PokemonRarity.C} value={4} />
              <RarityDisplay rarity={PokemonRarity.B} value={5} />
              <RarityDisplay rarity={PokemonRarity.A} value={10} />
              <RarityDisplay rarity={PokemonRarity.S} value={15} />
              <RarityDisplay rarity={PokemonRarity.S_PLUS} value={25} />
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-indigo-600" />
              Pokédex Score
            </h2>
            <p className="text-gray-700 mb-2">Build your legacy with these points:</p>
            <ul className="list-disc list-inside text-gray-700 text-sm">
              <li><span className="font-bold text-green-600">5 points</span> for each owned Pokémon.</li>
              <li><span className="font-bold text-blue-600">1 point</span> for each resold Pokémon.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            variant={canContinueGame ? "secondary" : "primary"} // Make start new game secondary if continue is primary
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
        <p className="text-gray-700">
          You currently have unarchived progress with collected Pokémon and tokens.
          Would you like to save your current Pokédex and token balance to the Hall of Fame
          before starting a new game?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          If you start a new game without archiving, your current progress will be lost.
        </p>
      </Modal>
    </div>
  );
};

export default WelcomeScreen;