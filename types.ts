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
 * Interface for an archived game, storing historical Pokédex data.
 */
export interface ArchivedGame {
  id: string; // Unique ID for the archived game (e.g., timestamp)
  score: number;
  tokenBalance: number;
  pokemons: Pokemon[]; // Snapshot of pokemons at the time of archiving
  archiveDate: string; // ISO 8601 string when the game was archived
}

/**
 * Interface for the global application state.
 */
export interface AppState {
  id: 'currentAppState'; // Fixed ID for the single app state entry
  hasActiveGame: boolean; // True if there's an ongoing game, false otherwise
  lastPlayedDate?: string; // Optional: ISO 8601 string of the last time an active game was played
}

/**
 * Enum for IndexedDB object store names.
 */
export enum StoreNames {
  Pokemons = 'pokemons',
  Settings = 'settings', // For storing global settings like token balance
  Archives = 'archives', // For storing historical game archives (Hall of Fame)
  AppState = 'appState', // For storing global app state like if a game is active
}

/**
 * Database name for IndexedDB.
 */
export const DB_NAME = 'PokemonGeneratorDB';

/**
 * Database version for IndexedDB. Increment this number when making schema changes.
 */
export const DB_VERSION = 3; // Incrementing version from 2 to 3 for new stores

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