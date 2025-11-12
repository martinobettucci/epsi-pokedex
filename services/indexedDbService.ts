// services/indexedDbService.ts

import { Pokemon, TokenBalance, DB_NAME, DB_VERSION, StoreNames, PokemonStatus } from '../types';

/**
 * A service for interacting with IndexedDB.
 */
export class IndexedDbService {
  private db: IDBDatabase | null = null;

  /**
   * Opens the IndexedDB database and initializes object stores if necessary.
   * @returns A promise that resolves with the IDBDatabase instance.
   */
  public async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Clear existing stores if upgrading from a previous version
        if (event.oldVersion < 1) { // If upgrading from a fresh or old version before DB_VERSION 1
          if (db.objectStoreNames.contains('notes')) {
            db.deleteObjectStore('notes');
          }
        }

        // Create the 'pokemons' object store with 'id' as the keyPath.
        // No autoIncrement as 'id' comes from the API.
        if (!db.objectStoreNames.contains(StoreNames.Pokemons)) {
          db.createObjectStore(StoreNames.Pokemons, { keyPath: 'id' });
        }

        // Create the 'settings' object store for token balance, etc.
        // It will have a fixed key like 'tokenBalance'.
        if (!db.objectStoreNames.contains(StoreNames.Settings)) {
          db.createObjectStore(StoreNames.Settings, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB error:', error);
        reject(error);
      };
    });
  }

  /**
   * Helper to perform a transaction on the database.
   * @param storeName The name of the object store to transact on.
   * @param mode The transaction mode ('readonly' or 'readwrite').
   * @param callback A function that performs operations within the transaction.
   * @returns A promise that resolves with the result of the callback.
   */
  private async withTransaction<T>(
    storeName: StoreNames,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => {
        // Transaction committed successfully.
      };

      transaction.onerror = (event: Event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`Transaction error for store ${storeName}:`, error);
        reject(error);
      };

      transaction.onabort = (event: Event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`Transaction aborted for store ${storeName}:`, error);
        reject(error);
      };

      // Execute the callback within the transaction and handle its resolution/rejection
      callback(store)
        .then(resolve)
        .catch(reject);
    });
  }

  // --- Pokémon Operations ---

  /**
   * Adds a new Pokémon to the 'pokemons' object store.
   * @param pokemon The Pokémon object to add.
   * @returns A promise that resolves with the added Pokémon.
   */
  public async addPokemon(pokemon: Pokemon): Promise<Pokemon> {
    return this.withTransaction<Pokemon>(StoreNames.Pokemons, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.add(pokemon);
        request.onsuccess = () => {
          resolve(pokemon);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Retrieves all Pokémon from the 'pokemons' object store.
   * @returns A promise that resolves with an array of Pokemon objects.
   */
  public async getPokemons(): Promise<Pokemon[]> {
    return this.withTransaction<Pokemon[]>(StoreNames.Pokemons, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Pokemon[]);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Updates an existing Pokémon in the 'pokemons' object store.
   * @param pokemon The complete Pokémon object with the ID of the Pokémon to update.
   * @returns A promise that resolves with the updated Pokémon object.
   */
  public async updatePokemon(pokemon: Pokemon): Promise<Pokemon> {
    return this.withTransaction<Pokemon>(StoreNames.Pokemons, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put(pokemon);
        request.onsuccess = () => {
          resolve(pokemon);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  // --- Token Balance Operations ---

  /**
   * Retrieves the current token balance from the 'settings' object store.
   * If no balance exists, it initializes it with a default of 100 tokens.
   * @returns A promise that resolves with the current token balance.
   */
  public async getTokenBalance(): Promise<TokenBalance> {
    return this.withTransaction<TokenBalance>(StoreNames.Settings, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get('tokenBalance');
        request.onsuccess = async (event: Event) => {
          let balance = (event.target as IDBRequest).result as TokenBalance | undefined;
          if (!balance) {
            // Initialize with default balance if not found
            const initialBalance: TokenBalance = { id: 'tokenBalance', amount: 100 };
            const putRequest = store.add(initialBalance);
            putRequest.onsuccess = () => resolve(initialBalance);
            putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
          } else {
            resolve(balance);
          }
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Updates the token balance in the 'settings' object store.
   * @param newAmount The new token amount.
   * @returns A promise that resolves with the updated token balance.
   */
  public async updateTokenBalance(newAmount: number): Promise<TokenBalance> {
    const newBalance: TokenBalance = { id: 'tokenBalance', amount: newAmount };
    return this.withTransaction<TokenBalance>(StoreNames.Settings, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put(newBalance);
        request.onsuccess = () => {
          resolve(newBalance);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }
}

// Export a singleton instance of the service
export const indexedDbService = new IndexedDbService();