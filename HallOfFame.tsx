// HallOfFame.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { ArchivedGame, MinimonRarity, MinimonStatus } from './types'; // Import MinimonStatus
import Button from './components/Button';
import { ArrowLeft, Trophy, Gem, Coins, Star, Loader2 } from 'lucide-react';
import Modal from './components/Modal';
import { rarityOrderMap, isValidMinimonRarity } from './utils/gameHelpers'; // Import rarityOrderMap and isValidMinimonRarity

interface HallOfFameProps {
  onBack: () => void;
}

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

  const getRarityColor = useCallback((rarity: MinimonRarity) => { // Updated type
    // Fallback for styling if rarity is invalid
    const validRarity = isValidMinimonRarity(rarity) ? rarity : MinimonRarity.F;
    switch (validRarity) {
      case MinimonRarity.F: return 'bg-gray-800 text-gray-400';
      case MinimonRarity.E: return 'bg-gray-700 text-gray-300';
      case MinimonRarity.D: return 'bg-blue-900 text-blue-300';
      case MinimonRarity.C: return 'bg-green-900 text-green-300';
      case MinimonRarity.B: return 'bg-purple-900 text-purple-300';
      case MinimonRarity.A: return 'bg-yellow-900 text-yellow-300';
      case MinimonRarity.S: return 'bg-orange-900 text-orange-300';
      case MinimonRarity.S_PLUS: return 'bg-red-900 text-red-300 font-bold';
      default: return 'bg-gray-900 text-gray-400';
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

  const sortedMinimonsInArchive = useMemo(() => { // Updated variable
    if (!selectedArchive) return [];
    const minimonsToSort = [...selectedArchive.minimons]; // Updated variable
    // Sort by rarity (descending) then by name (ascending)
    return minimonsToSort.sort((a, b) => {
      // Validate rarity before using it for sorting
      const rarityA = isValidMinimonRarity(a.rarity) ? a.rarity : MinimonRarity.F;
      const rarityB = isValidMinimonRarity(b.rarity) ? b.rarity : MinimonRarity.F;
      const rarityDiff = rarityOrderMap[rarityB] - rarityOrderMap[rarityA];
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedArchive]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onBack} aria-label="Back to Welcome">
          <ArrowLeft className="h-6 w-6 text-gray-400 hover:text-indigo-400" />
        </Button>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-fuchsia-400 drop-shadow-lg flex-grow tracking-wide">
          Hall of Fame
        </h1>
        <div className="w-10"></div> {/* Spacer to balance header */}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-400" />
          <p className="ml-4 text-lg text-gray-300">Loading archives...</p>
        </div>
      ) : archives.length === 0 ? (
        <p className="text-center text-gray-400 text-xl py-12 bg-gray-900 rounded-xl shadow-md border border-gray-800">
          No archived games yet. Start a new game and achieve greatness!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.map((archive) => (
            <div
              key={archive.id}
              className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hover:border-fuchsia-400 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              onClick={() => openArchiveDetails(archive)}
              role="button"
              tabIndex={0}
              aria-label={`View details for game archived on ${new Date(archive.archiveDate).toLocaleDateString()}`}
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-100 mb-2 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-md" />
                  Game Score: <span className="text-lime-300 drop-shadow-sm">{archive.score}</span>
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Archived on: {new Date(archive.archiveDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-200">
                  <span className="flex items-center gap-1">
                    <Gem className="h-4 w-4 text-lime-300" /> Tokens: {archive.tokenBalance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-cyan-300" /> Minimon: {archive.minimons.length}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-right">
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
            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
              <span className="flex items-center gap-2 text-xl font-bold text-gray-100">
                <Trophy className="h-6 w-6 text-yellow-500" /> Score: <span className="text-lime-300">{selectedArchive.score}</span>
              </span>
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-200">
                <Gem className="h-5 w-5 text-lime-300" /> Tokens: <span className="text-lime-300">{selectedArchive.tokenBalance}</span>
              </span>
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mt-6 mb-3">Minimon Collection ({selectedArchive.minimons.length}):</h4>
            {selectedArchive.minimons.length === 0 ? (
              <p className="text-gray-400">No Minimon in this archive.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {sortedMinimonsInArchive.map((minimon) => ( // Updated variable
                  <div key={minimon.id} className="flex items-center p-3 border border-gray-700 rounded-lg bg-gray-900 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 transition-shadow duration-200">
                    <div className="relative w-16 h-16 rounded-md mr-4 bg-gray-800 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={`data:image/png;base64,${minimon.imageBase64}`}
                        alt={minimon.name} // Updated alt
                        className="object-contain w-full h-full"
                      />
                      {minimon.status === MinimonStatus.RESOLD && ( // Corrected condition
                        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-red-400 text-xs font-bold drop-shadow-lg">
                          RESOLD
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-100">
                        {minimon.name}
                        {minimon.status === MinimonStatus.RESOLD && <span className="italic text-gray-500 ml-2">(Sold)</span>}
                      </p>
                      {/* Validate rarity for display and styling */}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityColor(minimon.rarity)}`}>
                        {isValidMinimonRarity(minimon.rarity) ? minimon.rarity : 'N/A'}
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