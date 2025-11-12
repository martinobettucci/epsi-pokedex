// MainGameScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { pokemonApiService } from './services/pokemonApiService';
import { Pokemon, TokenBalance, AppMessage, PokemonStatus, PokemonRarity } from './types';
import Button from './components/Button';
import Modal from './components/Modal';
import { PlusCircle, Coins, Sparkles, RefreshCw, XCircle, Gem, Loader2, Trophy, LogOut } from 'lucide-react';
import { getRarityResellValue, getRarityPokedexScoreValue, rarityOrderMap } from './utils/gameHelpers'; // Import from utils

const GENERATION_COST = 10;

interface MainGameScreenProps {
  onViewHallOfFame: () => void;
  onEndGameAndArchive: () => void; // New callback for ending and archiving the game
}

const MainGameScreen: React.FC<MainGameScreenProps> = ({ onViewHallOfFame, onEndGameAndArchive }) => {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPokemon, setIsGeneratingPokemon] = useState<boolean>(false);
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
  const [pokemonToResellId, setPokemonToResellId] = useState<string | null>(null);


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
      const fetchedPokemons = await indexedDbService.getPokemons();
      setPokemons(fetchedPokemons);
      
      const balance = await indexedDbService.getTokenBalance();
      setTokenBalance(balance.amount);
      setMessage(null);
    } catch (error) {
      console.error("Failed to fetch app data:", error);
      showMessage('error', 'Failed to load app data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  const handleGeneratePokemon = async () => {
    if (tokenBalance < GENERATION_COST) {
      showMessage('warning', `You need ${GENERATION_COST} tokens to generate a Pokémon. Current balance: ${tokenBalance}.`);
      return;
    }

    setIsGeneratingPokemon(true);
    let originalTokenBalance = tokenBalance; // Store original balance for rollback
    
    try {
      // Deduct tokens immediately
      const newBalanceAfterDeduction = originalTokenBalance - GENERATION_COST;
      setTokenBalance(newBalanceAfterDeduction);
      await indexedDbService.updateTokenBalance(newBalanceAfterDeduction);
      
      const newPokemon = await pokemonApiService.generatePokemon();
      await indexedDbService.addPokemon(newPokemon);
      setPokemons((prevPokemons) => [newPokemon, ...prevPokemons]);
      showMessage('success', `Awesome! You generated a new Pokémon: ${newPokemon.name} (${newPokemon.rarity})!`);
      
    } catch (error) {
      console.error("Error generating Pokémon:", error);
      // Rollback token deduction on failure
      const revertedBalance = originalTokenBalance;
      setTokenBalance(revertedBalance);
      await indexedDbService.updateTokenBalance(revertedBalance);
      showMessage('error', `Failed to generate Pokémon: ${error instanceof Error ? error.message : String(error)}. Tokens refunded.`);
    } finally {
      setIsGeneratingPokemon(false);
    }
  };

  const closeGenericModal = () => {
    setIsGenericModalOpen(false);
    setPokemonToResellId(null); // Clear resell specific state as well
    setGenericModalTitle('');
    setGenericModalContent(null);
    setGenericModalOnConfirm(undefined);
    setIsGenericModalConfirmLoading(false);
    setGenericModalConfirmButtonText('Confirm');
    setGenericModalConfirmButtonVariant('primary');
  };

  const handleResellConfirmation = (pokemonId: string, pokemonName: string) => {
    const pokemonToConfirm = pokemons.find(p => p.id === pokemonId);
    if (!pokemonToConfirm) {
      showMessage('error', 'Could not find the Pokémon to resell.');
      return;
    }
    
    const resellValue = getRarityResellValue(pokemonToConfirm.rarity);

    setPokemonToResellId(pokemonId);
    setGenericModalTitle('Resell Pokémon');
    setGenericModalContent(
      <p className="text-gray-200">
        Are you sure you want to resell <span className="font-semibold text-cyan-400">{pokemonName}</span>?
        You will receive <span className="font-bold text-lime-300">{resellValue} tokens</span> back. This action cannot be undone.
      </p>
    );
    const onConfirmAction = () => {
      (async () => {
        setIsGenericModalConfirmLoading(true);
        try {
          const pokemonToResell = pokemons.find(p => p.id === pokemonId);
          if (pokemonToResell) {
            const updatedPokemon = { ...pokemonToResell, status: PokemonStatus.RESOLD };
            await indexedDbService.updatePokemon(updatedPokemon);
            
            const currentResellValue = getRarityResellValue(pokemonToResell.rarity);
            const newBalance = tokenBalance + currentResellValue;
            await indexedDbService.updateTokenBalance(newBalance);

            setPokemons((prevPokemons) =>
              prevPokemons.map((p) => (p.id === updatedPokemon.id ? updatedPokemon : p)),
            );
            setTokenBalance(newBalance);
            
            showMessage('success', `${pokemonToResell.name} resold successfully! You gained ${currentResellValue} tokens.`);
          }
        } catch (error) {
          console.error("Error reselling Pokémon:", error);
          showMessage('error', `Failed to resell Pokémon: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setIsGenericModalConfirmLoading(false);
          closeGenericModal();
        }
      })();
    };
    setGenericModalOnConfirm(() => onConfirmAction);
    setGenericModalConfirmButtonText('Resell');
    setGenericModalConfirmButtonVariant('primary');
    setIsGenericModalOpen(true);
  };

  const handleEndGameConfirmation = () => {
    setGenericModalTitle('End Game & Archive Pokédex');
    setGenericModalContent(
      <p className="text-gray-200">
        Are you sure you want to end your current game session?
        <br/><br/>
        Your collected Pokémon, current Pokédex Score, and token balance will be <span className="font-bold text-lime-300">saved to the Hall of Fame</span>.
        Your current game progress will then be <span className="font-bold text-red-400">reset</span>.
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
    setGenericModalConfirmButtonText('Archive & Exit');
    setGenericModalConfirmButtonVariant('primary');
    setIsGenericModalOpen(true);
  };

  const getRarityColor = useCallback((rarity: PokemonRarity) => {
    switch (rarity) {
      case PokemonRarity.F: return 'bg-gray-800 text-gray-400';
      case PokemonRarity.E: return 'bg-gray-700 text-gray-300';
      case PokemonRarity.D: return 'bg-blue-900 text-blue-300';
      case PokemonRarity.C: return 'bg-green-900 text-green-300';
      case PokemonRarity.B: return 'bg-purple-900 text-purple-300';
      case PokemonRarity.A: return 'bg-yellow-900 text-yellow-300';
      case PokemonRarity.S: return 'bg-orange-900 text-orange-300';
      case PokemonRarity.S_PLUS: return 'bg-red-900 text-red-300 font-bold';
      default: return 'bg-gray-900 text-gray-400';
    }
  }, []);
  
  const pokedexScore = useMemo(() => {
    return pokemons.reduce((score, pokemon) => {
      if (pokemon.status === PokemonStatus.OWNED) {
        return score + getRarityPokedexScoreValue(pokemon.rarity); // Use rarity-based score
      }
      if (pokemon.status === PokemonStatus.RESOLD) {
        return score + 1; // 1 point for each resold Pokémon
      }
      return score;
    }, 0);
  }, [pokemons]);

  const sortedPokemons = useMemo(() => {
    const pokemonsToSort = [...pokemons];
    switch (sortOrder) {
      case 'rarity-desc':
        return pokemonsToSort.sort((a, b) => rarityOrderMap[b.rarity] - rarityOrderMap[a.rarity]);
      case 'rarity-asc':
        return pokemonsToSort.sort((a, b) => rarityOrderMap[a.rarity] - rarityOrderMap[b.rarity]);
      case 'name-asc':
        return pokemonsToSort.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return pokemonsToSort.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-asc':
        return pokemonsToSort.sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
      case 'date-desc':
      default:
        return pokemonsToSort.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
  }, [pokemons, sortOrder]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400 drop-shadow-lg tracking-wide">
          Pokémon Lab
        </h1>
        <Button variant="secondary" onClick={handleEndGameConfirmation} aria-label="End Game">
          <LogOut className="h-6 w-6 text-indigo-400" />
          <span className="ml-2 hidden sm:inline">End Game</span>
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

      {/* Stats Section: Token Balance & Pokédex Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Token Balance */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-200 flex items-center gap-3">
            <Gem className="h-7 w-7 text-lime-300 drop-shadow-md" />
            Your Tokens:
          </h2>
          <span className="text-3xl sm:text-4xl font-extrabold text-lime-300 leading-none drop-shadow-md">
            {tokenBalance}
          </span>
        </div>
        
        {/* Pokédex Score */}
        <div className="bg-indigo-900 p-4 sm:p-6 rounded-xl shadow-lg border border-indigo-700 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-200 flex items-center gap-3">
            <Trophy className="h-7 w-7 text-fuchsia-400 drop-shadow-md" />
            Pokédex Score:
          </h2>
          <span className="text-3xl sm:text-4xl font-extrabold text-fuchsia-400 leading-none drop-shadow-md">
            {pokedexScore}
          </span>
        </div>
      </div>

      {/* Generate Pokémon Section */}
      <div className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-indigo-700/50 mb-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-400 drop-shadow-sm">
          Generate New Pokémon
        </h2>
        <p className="text-gray-300 mb-6">
          Unleash the power of AI to create a unique Pokémon!
          (Cost: <span className="font-semibold text-red-400">{GENERATION_COST} Tokens</span>)
        </p>
        <Button
          onClick={handleGeneratePokemon}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          disabled={isGeneratingPokemon || isLoading || tokenBalance < GENERATION_COST}
        >
          {isGeneratingPokemon ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Generating...
            </span>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Pokémon
            </>
          )}
        </Button>
      </div>

      {/* Pokémon Collection */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 text-center sm:text-left mb-4 sm:mb-0 drop-shadow-md">Your Collection</h2>
        {pokemons.length > 1 && (
          <div className="flex items-center gap-2 self-center sm:self-auto">
            <label htmlFor="sort-order" className="text-gray-300 font-medium">Sort by:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md shadow-sm pl-3 pr-8 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-200"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="rarity-desc">Rarity (High to Low)</option>
              <option value="rarity-asc">Rarity (Low to High)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-400" />
          <p className="ml-4 text-lg text-gray-300">Loading your Pokémon...</p>
        </div>
      ) : sortedPokemons.length === 0 ? (
        <p className="text-center text-gray-400 text-xl py-12 bg-gray-900 rounded-xl shadow-md border border-gray-800">
          You haven't generated any Pokémon yet. Start creating above!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPokemons.map((pokemon) => {
            const resellValue = getRarityResellValue(pokemon.rarity);
            return (
              <div key={pokemon.id} className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 flex flex-col">
                <div className="flex-grow">
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center p-2">
                    <img
                      src={`data:image/png;base64,${pokemon.imageBase64}`}
                      alt={pokemon.name}
                      className="object-contain w-full h-full"
                      loading="lazy"
                    />
                    {pokemon.status === PokemonStatus.RESOLD && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-red-400 text-lg font-bold drop-shadow-lg">
                        RESOLD
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-100 flex items-center justify-between">
                    <span>{pokemon.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(pokemon.rarity)}`}>
                      {pokemon.rarity}
                    </span>
                  </h3>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400">
                  <span>Generated: {new Date(pokemon.generatedAt).toLocaleDateString()}</span>
                  {pokemon.status === PokemonStatus.OWNED ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResellConfirmation(pokemon.id, pokemon.name)}
                      aria-label={`Resell ${pokemon.name} for ${resellValue} tokens`}
                    >
                      <Coins className="h-4 w-4 mr-1 text-lime-300" /> Resell (+{resellValue})
                    </Button>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 drop-shadow-sm">
                      <RefreshCw className="h-4 w-4" /> Resold
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
        cancelButtonText="Cancel"
        confirmButtonVariant={genericModalConfirmButtonVariant}
        isLoading={isGenericModalConfirmLoading}
      >
        {genericModalContent}
      </Modal>
    </div>
  );
};

export default MainGameScreen;