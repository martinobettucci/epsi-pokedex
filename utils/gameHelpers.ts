// utils/gameHelpers.ts

import { PokemonRarity } from '../types';

/**
 * Returns the resell value for a given Pokémon rarity.
 * @param rarity The rarity of the Pokémon.
 * @returns The number of tokens received when reselling.
 */
export const getRarityResellValue = (rarity: PokemonRarity): number => {
  switch (rarity) {
    case PokemonRarity.S_PLUS: return 25;
    case PokemonRarity.S: return 15;
    case PokemonRarity.A: return 10;
    case PokemonRarity.B: return 5;
    case PokemonRarity.C: return 4;
    case PokemonRarity.D: return 3;
    case PokemonRarity.E: return 2;
    case PokemonRarity.F: return 1;
    default: return 1;
  }
};

/**
 * Returns the Pokédex score value for an OWNED Pokémon based on its rarity.
 * Resold Pokémon always give 1 point.
 * @param rarity The rarity of the Pokémon.
 * @returns The number of points added to the Pokédex score.
 */
export const getRarityPokedexScoreValue = (rarity: PokemonRarity): number => {
  switch (rarity) {
    case PokemonRarity.S_PLUS: return 80;
    case PokemonRarity.S: return 50;
    case PokemonRarity.A: return 30;
    case PokemonRarity.B: return 20;
    case PokemonRarity.C: return 15;
    case PokemonRarity.D: return 10;
    case PokemonRarity.E: return 7;
    case PokemonRarity.F: return 5;
    default: return 5;
  }
};

/**
 * A map defining the order of Pokémon rarities for sorting purposes.
 * Higher numbers indicate higher rarity.
 */
export const rarityOrderMap: Record<PokemonRarity, number> = {
  [PokemonRarity.F]: 0,
  [PokemonRarity.E]: 1,
  [PokemonRarity.D]: 2,
  [PokemonRarity.C]: 3,
  [PokemonRarity.B]: 4,
  [PokemonRarity.A]: 5,
  [PokemonRarity.S]: 6,
  [PokemonRarity.S_PLUS]: 7,
};
