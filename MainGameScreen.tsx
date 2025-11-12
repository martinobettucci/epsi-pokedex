// MainGameScreen.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { minimonApiService } from './services/minimonApiService'; // Updated import
import { Minimon, TokenBalance, AppMessage, MinimonStatus, MinimonRarity } from './types'; // Updated types
import Button from './components/Button';
import Modal from './components/Modal';
import { PlusCircle, Coins, Sparkles, RefreshCw, XCircle, Gem, Loader2, Trophy, LogOut, Crown } from 'lucide-react';
import { getRarityResellValue, getRarityMinidekScoreValue, rarityOrderMap, isValidMinimonRarity } from './utils/gameHelpers'; // Updated import and function name
import { useTranslation } from './i18n';

const GENERATION_COST = 10;

interface MainGameScreenProps {
  onViewHallOfFame: () => void;
  onEndGameAndArchive: () => void; // New callback for ending and archiving the game
}

const MainGameScreen: React.FC<MainGameScreenProps> = ({ onViewHallOfFame, onEndGameAndArchive }) => {
  const { t } = useTranslation();
  const [newMinimonId, setNewMinimonId] = useState<string | null>(null);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const badgeHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [minimons, setMinimons] = useState<Minimon[]>([]); // Renamed state
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingMinimon, setIsGeneratingMinimon] = useState<boolean>(false); // Renamed state
  const [message, setMessage] = useState<AppMessage | null>(null);
  const [sortOrder, setSortOrder] = useState('date-desc');

  // Modals for general confirmations and resell
  const [isGenericModalOpen, setIsGenericModalOpen] = useState<boolean>(false);
  const [genericModalTitle, setGenericModalTitle] = useState<string>('');
  const [genericModalContent, setGenericModalContent] = useState<React.ReactNode>(null);
  const [genericModalOnConfirm, setGenericModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [isGenericModalConfirmLoading, setIsGenericModalConfirmLoading] = useState<boolean>(false);
  const [genericModalConfirmButtonText, setGenericModalConfirmButtonText] = useState<string>('Confirm');
  const [genericModalConfirmButtonVariant, setGenericModalConfirmButtonVariant] = useState<'primary' | 'danger'>('primary');

  // Resell specific state (could be merged into generic modal, but kept separate for clarity during refactor)
  const [minimonToResellId, setMinimonToResellId] = useState<string | null>(null); // Renamed state


  const showMessage = useCallback((type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    const timer = setTimeout(() => {
      setMessage(null);
    }, 5000); // Message disappears after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  const fetchAppData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedMinimons = await indexedDbService.getMinimons(); // Updated call
      setMinimons(fetchedMinimons); // Updated state
      
      const balance = await indexedDbService.getTokenBalance();
      setTokenBalance(balance.amount);
      setMessage(null);
    } catch (error) {
      console.error("Failed to fetch app data:", error);
      showMessage('error', t('main.messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [showMessage, t]);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  useEffect(() => {
    return () => {
      if (badgeHideTimeout.current) clearTimeout(badgeHideTimeout.current);
      if (badgeClearTimeout.current) clearTimeout(badgeClearTimeout.current);
    };
  }, []);

  const handleGenerateMinimon = async () => { // Renamed function
    if (tokenBalance < GENERATION_COST) {
      showMessage('warning', t('main.messages.needTokens', { cost: GENERATION_COST, balance: tokenBalance }));
      return;
    }

    setIsGeneratingMinimon(true); // Updated state
    let originalTokenBalance = tokenBalance; // Store original balance for rollback
    
    try {
      // Deduct tokens immediately
      const newBalanceAfterDeduction = originalTokenBalance - GENERATION_COST;
      setTokenBalance(newBalanceAfterDeduction);
      await indexedDbService.updateTokenBalance(newBalanceAfterDeduction);
      
      const newMinimon = await minimonApiService.generateMinimon(); // Updated API call
      await indexedDbService.addMinimon(newMinimon); // Updated call
      setMinimons((prevMinimons) => [newMinimon, ...prevMinimons]); // Updated state
      showMessage('success', t('main.messages.generateSuccess', { name: newMinimon.name, rarity: newMinimon.rarity }));
      setNewMinimonId(newMinimon.id);
      setBadgeVisible(true);
      if (badgeHideTimeout.current) {
        clearTimeout(badgeHideTimeout.current);
      }
      if (badgeClearTimeout.current) {
        clearTimeout(badgeClearTimeout.current);
      }
      badgeHideTimeout.current = setTimeout(() => {
        setBadgeVisible(false);
        badgeClearTimeout.current = setTimeout(() => {
          setNewMinimonId(null);
        }, 600);
      }, 5000);
      
    } catch (error) {
      console.error("Error generating Minimon:", error); // Updated text
      // Rollback token deduction on failure
      const revertedBalance = originalTokenBalance;
      setTokenBalance(revertedBalance);
      await indexedDbService.updateTokenBalance(revertedBalance);
      // Use the error message directly from the API service, and append token refund info
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showMessage('error', `${errorMessage} ${t('main.messages.tokensRefunded')}`);
    } finally {
      setIsGeneratingMinimon(false); // Updated state
    }
  };

  const closeGenericModal = () => {
    setIsGenericModalOpen(false);
    setMinimonToResellId(null); // Clear resell specific state as well // Updated state
    setGenericModalTitle('');
    setGenericModalContent(null);
    setGenericModalOnConfirm(undefined);
    setIsGenericModalConfirmLoading(false);
    setGenericModalConfirmButtonText('Confirm');
    setGenericModalConfirmButtonVariant('primary');
  };

  const handleResellConfirmation = (minimonId: string, minimonName: string) => { // Updated parameters
    const minimonToConfirm = minimons.find(p => p.id === minimonId); // Updated variable
    if (!minimonToConfirm) {
      showMessage('error', 'Could not find the Minimon to resell.'); // Updated text
      return;
    }
    
    // Validate rarity for display and function call
    const currentRarity = isValidMinimonRarity(minimonToConfirm.rarity) ? minimonToConfirm.rarity : MinimonRarity.F;
    const resellValue = getRarityResellValue(currentRarity);

    setMinimonToResellId(minimonId); // Updated state
    setGenericModalTitle(t('main.modal.resellTitle'));
    setGenericModalContent(
      <p className="text-gray-200">
        {t('main.modal.resellBody', { name: minimonName, tokens: resellValue })}
      </p>
    );
    const onConfirmAction = () => {
      (async () => {
        setIsGenericModalConfirmLoading(true);
        try {
          const minimonToResell = minimons.find(p => p.id === minimonId); // Updated variable
          if (minimonToResell) {
            const updatedMinimon = { ...minimonToResell, status: MinimonStatus.RESOLD }; // Updated type
            await indexedDbService.updateMinimon(updatedMinimon); // Updated call
            
            // Validate rarity before getting resell value
            const currentResellRarity = isValidMinimonRarity(minimonToResell.rarity) ? minimonToResell.rarity : MinimonRarity.F;
            const currentResellValue = getRarityResellValue(currentResellRarity);
            const newBalance = tokenBalance + currentResellValue;
            await indexedDbService.updateTokenBalance(newBalance);

            setMinimons((prevMinimons) => // Updated state
              prevMinimons.map((p) => (p.id === updatedMinimon.id ? updatedMinimon : p)),
            );
            setTokenBalance(newBalance);
            
            showMessage('success', t('main.messages.resellSuccess', { name: minimonToResell.name, tokens: currentResellValue }));
          }
        } catch (error) {
          console.error("Error reselling Minimon:", error); // Updated text
          showMessage('error', t('main.messages.resellFailed', { error: error instanceof Error ? error.message : String(error) }));
        } finally {
          setIsGenericModalConfirmLoading(false);
          closeGenericModal();
        }
      })();
    };
    setGenericModalOnConfirm(() => onConfirmAction);
    setGenericModalConfirmButtonText(t('main.modal.resellConfirm'));
    setGenericModalConfirmButtonVariant('primary');
    setIsGenericModalOpen(true);
  };

  const handleEndGameConfirmation = () => {
    setGenericModalTitle(t('main.modal.endGameTitle'));
    setGenericModalContent(
      <p className="text-gray-200">
        {t('main.modal.endGameBody')}
      </p>
    );
    setGenericModalOnConfirm(() => async () => {
      setIsGenericModalConfirmLoading(true);
      try {
        await onEndGameAndArchive();
      } catch (error) {
        console.error("Error ending game:", error);
        showMessage('error', `Failed to end game: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsGenericModalConfirmLoading(false);
        closeGenericModal();
      }
    });
    setGenericModalConfirmButtonText(t('main.modal.endGameConfirm'));
    setGenericModalConfirmButtonVariant('primary');
    setIsGenericModalOpen(true);
  };

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
  
  const minidekScore = useMemo(() => { // Renamed variable
    const baseScore = minimons.reduce((score, minimon) => { // Updated variable
      // Validate rarity before using it for score calculation
      const minimonRarity = isValidMinimonRarity(minimon.rarity) ? minimon.rarity : MinimonRarity.F;
      if (minimon.status === MinimonStatus.OWNED) { // Updated type
        return score + getRarityMinidekScoreValue(minimonRarity); // Updated call
      }
      if (minimon.status === MinimonStatus.RESOLD) { // Updated type
        return score + 1; // 1 point for each resold Minimon
      }
      return score;
    }, 0);
    return baseScore + tokenBalance;
  }, [minimons, tokenBalance]); // Updated dependency

  const sortedMinimons = useMemo(() => { // Renamed variable
    const minimonsToSort = [...minimons]; // Updated variable
    switch (sortOrder) {
      case 'rarity-desc':
        return minimonsToSort.sort((a, b) => {
          const rarityA = isValidMinimonRarity(a.rarity) ? a.rarity : MinimonRarity.F;
          const rarityB = isValidMinimonRarity(b.rarity) ? b.rarity : MinimonRarity.F;
          return rarityOrderMap[rarityB] - rarityOrderMap[rarityA];
        });
      case 'rarity-asc':
        return minimonsToSort.sort((a, b) => {
          const rarityA = isValidMinimonRarity(a.rarity) ? a.rarity : MinimonRarity.F;
          const rarityB = isValidMinimonRarity(b.rarity) ? b.rarity : MinimonRarity.F;
          return rarityOrderMap[rarityA] - rarityOrderMap[rarityB];
        });
      case 'name-asc':
        return minimonsToSort.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return minimonsToSort.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-asc':
        return minimonsToSort.sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
      case 'date-desc':
      default:
        return minimonsToSort.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
  }, [minimons, sortOrder]); // Updated dependency

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
    <div className="flex justify-between items-center mb-10">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400 drop-shadow-lg tracking-wide">
        {t('main.title')}
      </h1>
      <Button variant="secondary" onClick={handleEndGameConfirmation} aria-label="End Game">
        <LogOut className="h-6 w-6 text-indigo-400" />
        <span className="ml-2 hidden sm:inline">{t('main.endGame')}</span>
      </Button>
    </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg shadow-md flex items-center justify-between transition-opacity duration-300 border ${
            message.type === 'success' ? 'bg-green-900 text-green-300 border-green-700' :
            message.type === 'error' ? 'bg-red-900 text-red-300 border-red-700' :
            'bg-yellow-900 text-yellow-300 border-yellow-700'
          }`}
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
          <Button variant="ghost" size="sm" onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Stats Section: Token Balance & Minidek Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Token Balance */}
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-200 flex items-center gap-3">
              <Gem className="h-7 w-7 text-lime-300 drop-shadow-md" />
              {t('main.stats.tokens')}
            </h2>
          <span className="text-3xl sm:text-4xl font-extrabold text-lime-300 leading-none drop-shadow-md">
            {tokenBalance}
          </span>
        </div>
        
        {/* Minidek Score */}
          <div className="bg-indigo-900 p-4 sm:p-6 rounded-xl shadow-lg border border-indigo-700 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-200 flex items-center gap-3">
              <Trophy className="h-7 w-7 text-fuchsia-400 drop-shadow-md" />
              {t('main.stats.score')}
            </h2>
          <span className="text-3xl sm:text-4xl font-extrabold text-fuchsia-400 leading-none drop-shadow-md">
            {minidekScore}
          </span>
        </div>
      </div>

      {/* Generate Minimon Section */}
      <div className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-indigo-700/50 mb-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-400 drop-shadow-sm">
          Generate New Minimon
        </h2>
        <p className="text-gray-300 mb-6">
          Unleash the power of AI to create a unique Minimon!
          (Cost: <span className="font-semibold text-red-400">{GENERATION_COST} Tokens</span>)
        </p>
        <Button
          onClick={handleGenerateMinimon} // Updated call
          variant="primary"
          size="lg"
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          disabled={isGeneratingMinimon || isLoading || tokenBalance < GENERATION_COST} // Updated state
        >
          {isGeneratingMinimon ? ( // Updated state
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Generating...
            </span>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Minimon
            </>
          )}
        </Button>
      </div>

      {/* Minimon Collection */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 text-center sm:text-left mb-4 sm:mb-0 drop-shadow-md">Your Collection</h2>
        {minimons.length > 1 && ( // Updated state
        <div className="flex items-center gap-2 self-center sm:self-auto">
          <label htmlFor="sort-order" className="text-gray-300 font-medium">{t('main.collection.sortBy')}</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md shadow-sm pl-3 pr-8 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-200"
          >
            <option value="date-desc">{t('main.collection.options.newest')}</option>
            <option value="date-asc">{t('main.collection.options.oldest')}</option>
            <option value="rarity-desc">{t('main.collection.options.rarityDesc')}</option>
            <option value="rarity-asc">{t('main.collection.options.rarityAsc')}</option>
            <option value="name-asc">{t('main.collection.options.nameAsc')}</option>
            <option value="name-desc">{t('main.collection.options.nameDesc')}</option>
          </select>
        </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-400" />
          <p className="ml-4 text-lg text-gray-300">{t('main.loading')}</p>
        </div>
      ) : sortedMinimons.length === 0 ? ( // Updated variable
        <p className="text-center text-gray-400 text-xl py-12 bg-gray-900 rounded-xl shadow-md border border-gray-800">
          {t('main.collection.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMinimons.map((minimon) => { // Updated variable
            // Validate rarity for display and function call
            const displayRarity = isValidMinimonRarity(minimon.rarity) ? minimon.rarity : 'N/A';
            const validRarityForResell = isValidMinimonRarity(minimon.rarity) ? minimon.rarity : MinimonRarity.F;
            const resellValue = getRarityResellValue(validRarityForResell);
            
            return (
              <div
                key={minimon.id}
                className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 flex flex-col relative"
              >
                {newMinimonId === minimon.id && (
                  <span
                    aria-live="polite"
                    className={`absolute top-3 right-3 z-50 flex items-center gap-1 rounded-full bg-amber-200 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-900 shadow-xl transition-all duration-700 pointer-events-none ${
                      badgeVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
                    }`}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>New!</span>
                  </span>
                )}
                <div className="flex-grow">
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center p-2">
                    <img
                      src={`data:image/png;base64,${minimon.imageBase64}`}
                      alt={minimon.name} // Updated alt
                      className="object-contain w-full h-full"
                      loading="lazy"
                    />
                    {minimon.status === MinimonStatus.RESOLD && ( // Updated type
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-red-400 text-lg font-bold drop-shadow-lg">
                        RESOLD
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-100 flex items-center justify-between">
                    <span>{minimon.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(validRarityForResell)}`}>
                      {displayRarity} {/* Display N/A for invalid rarities */}
                    </span>
                  </h3>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400">
                  <span>{t('main.generatedOn')} {new Date(minimon.generatedAt).toLocaleDateString()}</span>
                  {minimon.status === MinimonStatus.OWNED ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResellConfirmation(minimon.id, minimon.name)} // Updated parameters
                      aria-label={t('main.collection.ariaResell', { name: minimon.name, tokens: resellValue })}
                    >
                      <Coins className="h-4 w-4 mr-1 text-lime-300" /> {t('main.collection.resell', { tokens: resellValue })}
                    </Button>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 drop-shadow-sm">
                      <RefreshCw className="h-4 w-4" /> {t('main.collection.resold')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isGenericModalOpen}
        onClose={closeGenericModal}
        title={genericModalTitle}
        onConfirm={genericModalOnConfirm}
        confirmButtonText={genericModalConfirmButtonText}
        cancelButtonText={t('common.cancel')}
        confirmButtonVariant={genericModalConfirmButtonVariant}
        isLoading={isGenericModalConfirmLoading}
      >
        {genericModalContent}
      </Modal>
    </div>
  );
};

export default MainGameScreen;
