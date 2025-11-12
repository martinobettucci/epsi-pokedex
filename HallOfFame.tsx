// HallOfFame.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { ArchivedGame, PokemonRarity } from './types';
import Button from './components/Button';
import { ArrowLeft, Trophy, Gem, Coins, Star, Loader2 } from 'lucide-react';
import Modal from './components/Modal';

interface HallOfFameProps {
  onBack: () => void;
}

const rarityOrderMap: Record<PokemonRarity, number> = {
  [PokemonRarity.S_PLUS]: 7,
  [PokemonRarity.S]: 6,
  [PokemonRarity.A]: 5,
  [PokemonRarity.B]: 4,
  [PokemonRarity.C]: 3,
  [PokemonRarity.D]: 2,
  [PokemonRarity.E]: 1,
  [PokemonRarity.F]: 0,
};

const HallOfFame: React.FC<HallOfFameProps> = ({ onBack }) => {
  const [archives, setArchives] = useState<ArchivedGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchArchives = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedArchives = await indexedDbService.getArchivedGames();
      // Sort archives by date, newest first
      setArchives(fetchedArchives.sort((a, b) => new Date(b.archiveDate).getTime() - new Date(a.archiveDate).getTime()));
    } catch (error) {
      console.error('Failed to fetch archived games:', error);
      // Optionally show an error message
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const getRarityColor = useCallback((rarity: PokemonRarity) => {
    switch (rarity) {
      case PokemonRarity.F: return 'bg-gray-200 text-gray-800';
      case PokemonRarity.E: return 'bg-gray-300 text-gray-900';
      case PokemonRarity.D: return 'bg-blue-100 text-blue-800';
      case PokemonRarity.C: return 'bg-green-100 text-green-800';
      case PokemonRarity.B: return 'bg-purple-100 text-purple-800';
      case PokemonRarity.A: return 'bg-yellow-100 text-yellow-800';
      case PokemonRarity.S: return 'bg-orange-100 text-orange-800';
      case PokemonRarity.S_PLUS: return 'bg-red-100 text-red-800 font-bold';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const openArchiveDetails = (archive: ArchivedGame) => {
    setSelectedArchive(archive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArchive(null);
  };

  const sortedPokemonsInArchive = useMemo(() => {
    if (!selectedArchive) return [];
    const pokemonsToSort = [...selectedArchive.pokemons];
    // Sort by rarity (descending) then by name (ascending)
    return pokemonsToSort.sort((a, b) => {
      const rarityDiff = rarityOrderMap[b.rarity] - rarityOrderMap[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedArchive]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} aria-label="Back to Welcome">
          <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-800" />
        </Button>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-indigo-800 drop-shadow-md flex-grow">
          Hall of Fame
        </h1>
        <div className="w-10"></div> {/* Spacer to balance header */}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
          <p className="ml-4 text-lg text-gray-600">Loading archives...</p>
        </div>
      ) : archives.length === 0 ? (
        <p className="text-center text-gray-500 text-xl py-12 bg-white rounded-xl shadow-md">
          No archived games yet. Start a new game and achieve greatness!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.map((archive) => (
            <div
              key={archive.id}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => openArchiveDetails(archive)}
              role="button"
              tabIndex={0}
              aria-label={`View details for game archived on ${new Date(archive.archiveDate).toLocaleDateString()}`}
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Game Score: {archive.score}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Archived on: {new Date(archive.archiveDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <Gem className="h-4 w-4 text-yellow-600" /> Tokens: {archive.tokenBalance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-green-600" /> Pokémon: {archive.pokemons.length}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openArchiveDetails(archive); }}>
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArchive && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`Archived Game: ${new Date(selectedArchive.archiveDate).toLocaleDateString()}`}
          cancelButtonText="Close"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <span className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Trophy className="h-6 w-6 text-yellow-500" /> Score: {selectedArchive.score}
              </span>
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Gem className="h-5 w-5 text-yellow-600" /> Tokens: {selectedArchive.tokenBalance}
              </span>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Pokémon Collection ({selectedArchive.pokemons.length}):</h4>
            {selectedArchive.pokemons.length === 0 ? (
              <p className="text-gray-500">No Pokémon in this archive.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {sortedPokemonsInArchive.map((pokemon) => (
                  <div key={pokemon.id} className="flex items-center p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                    <img
                      src={`data:image/png;base64,${pokemon.imageBase64}`}
                      alt={pokemon.name}
                      className="w-16 h-16 object-contain rounded-md mr-4 bg-gray-50"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-900">{pokemon.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityColor(pokemon.rarity)}`}>
                        {pokemon.rarity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HallOfFame;