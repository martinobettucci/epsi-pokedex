// types.ts

/**
 * Enum for Pokémon rarity levels.
 */
export enum PokemonRarity {
  F = 'F',
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  S_PLUS = 'S+', // Using S_PLUS for 'S+' to be a valid enum key
}

/**
 * Enum for Pokémon status (owned or resold).
 */
export enum PokemonStatus {
  OWNED = 'OWNED',
  RESOLD = 'RESOLD',
}

/**
 * Interface for a generated Pokémon item.
 */
export interface Pokemon {
  id: string; // Unique ID from the API
  name: string;
  rarity: PokemonRarity;
  imageBase64: string; // Base64 encoded image data (without prefix)
  generatedAt: string; // ISO 8601 string from API
  status: PokemonStatus; // OWNED or RESOLD
}

/**
 * Interface for the user's token balance.
 */
export interface TokenBalance {
  id: 'tokenBalance'; // Fixed ID for single token balance entry
  amount: number;
}

/**
 * Enum for IndexedDB object store names.
 */
export enum StoreNames {
  Pokemons = 'pokemons',
  Settings = 'settings', // For storing global settings like token balance
}

/**
 * Database name for IndexedDB.
 */
export const DB_NAME = 'PokemonGeneratorDB';

/**
 * Database version for IndexedDB. Increment this number when making schema changes.
 */
export const DB_VERSION = 2; // Incrementing version from 1 to 2

/**
 * Interface for a general application message (e.g., success, error).
 */
export interface AppMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

/**
 * Interface for API error responses.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}
