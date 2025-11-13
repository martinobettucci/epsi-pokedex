// services/indexedDbService.ts

import { Minimon, TokenBalance, DB_NAME, DB_VERSION, StoreNames, MinimonStatus, ArchivedGame, AppState } from '../types';

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

        // Clear existing stores if upgrading from a previous version (if schema changed significantly)
        // For version 3, we expect to add new stores. If upgrading from older versions, ensure compatibility.
        if (event.oldVersion < 3) { // If upgrading from a version older than 3
          // If you had 'notes' in version < 1, you might delete it here
          // if (db.objectStoreNames.contains('notes')) {
          //   db.deleteObjectStore('notes');
          // }

          // Ensure existing stores are present
          if (!db.objectStoreNames.contains(StoreNames.Minimons)) {
            db.createObjectStore(StoreNames.Minimons, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(StoreNames.Settings)) {
            db.createObjectStore(StoreNames.Settings, { keyPath: 'id' });
          }

          // Create new stores for DB_VERSION 3
          if (!db.objectStoreNames.contains(StoreNames.Archives)) {
            db.createObjectStore(StoreNames.Archives, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(StoreNames.AppState)) {
            db.createObjectStore(StoreNames.AppState, { keyPath: 'id' });
          }
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
   * @param storeNames The name(s) of the object store(s) to transact on.
   * @param mode The transaction mode ('readonly' or 'readwrite').
   * @param callback A function that performs operations within the transaction.
   * @returns A promise that resolves with the result of the callback.
   */
  private async withTransaction<T>(
    storeNames: StoreNames | StoreNames[],
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, mode);
      
      transaction.oncomplete = () => {
        // Transaction committed successfully.
      };

      transaction.onerror = (event: Event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`Transaction error for store(s) ${storeNames}:`, error);
        reject(error);
      };

      transaction.onabort = (event: Event) => {
        const error = (event.target as IDBTransaction).error;
        console.error(`Transaction aborted for store(s) ${storeNames}:`, error);
        reject(error);
      };

      // Execute the callback within the transaction and handle its resolution/rejection
      // If storeNames is an array, pass the first store to the callback.
      // The callback can access other stores via transaction.objectStore(name) if needed.
      const store = typeof storeNames === 'string' ? transaction.objectStore(storeNames) : transaction.objectStore(storeNames[0]);
      callback(store, transaction)
        .then(resolve)
        .catch(reject);
    });
  }

  // --- Minimon Operations ---

  /**
   * Adds a new Minimon to the 'minimons' object store.
   * @param minimon The Minimon object to add.
   * @returns A promise that resolves with the added Minimon.
   */
  public async addMinimon(minimon: Minimon): Promise<Minimon> {
    return this.withTransaction<Minimon>(StoreNames.Minimons, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.add(minimon);
        request.onsuccess = () => {
          resolve(minimon);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Retrieves all Minimon from the 'minimons' object store.
   * @returns A promise that resolves with an array of Minimon objects.
   */
  public async getMinimons(): Promise<Minimon[]> {
    return this.withTransaction<Minimon[]>(StoreNames.Minimons, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Minimon[]);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Updates an existing Minimon in the 'minimons' object store.
   * @param minimon The complete Minimon object with the ID of the Minimon to update.
   * @returns A promise that resolves with the updated Minimon object.
   */
  public async updateMinimon(minimon: Minimon): Promise<Minimon> {
    return this.withTransaction<Minimon>(StoreNames.Minimons, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put(minimon);
        request.onsuccess = () => {
          resolve(minimon);
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

  // --- Archive Operations (Hall of Fame) ---

  /**
   * Archives the current game state into the 'archives' object store.
   * @param score The final score of the game being archived.
   * @param tokenBalance The final token balance of the game being archived.
   * @param minimons The collection of Minimon at the time of archiving.
   * @returns A promise that resolves with the archived game object.
   */
  public async archiveCurrentGame(
    score: number,
    tokenBalance: number,
    minimons: Minimon[],
    telemetry: ArchiveTelemetry,
    scoredByVersion: string,
  ): Promise<ArchivedGame> {
    return this.withTransaction<ArchivedGame>(StoreNames.Archives, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const archivedGame: ArchivedGame = {
          id: `archive-${Date.now()}`, // Unique ID for the archive
          score,
          tokenBalance,
          minimons,
          archiveDate: new Date().toISOString(),
          telemetry,
          scoredByVersion,
        };
        const request = store.add(archivedGame);
        request.onsuccess = () => {
          resolve(archivedGame);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Retrieves all archived games from the 'archives' object store.
   * @returns A promise that resolves with an array of ArchivedGame objects.
   */
  public async getArchivedGames(): Promise<ArchivedGame[]> {
    return this.withTransaction<ArchivedGame[]>(StoreNames.Archives, 'readonly', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as ArchivedGame[]);
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Clears all current game data (minimons and resets token balance),
   * and sets the app state to indicate a new active game.
   * This is used when explicitly starting a new game.
   * @returns A promise that resolves when the data is cleared.
   */
  public async clearCurrentGameData(): Promise<void> {
    return this.withTransaction<void>([StoreNames.Minimons, StoreNames.Settings, StoreNames.AppState], 'readwrite', async (store, transaction) => {
      const minimonStore = transaction.objectStore(StoreNames.Minimons);
      const settingsStore = transaction.objectStore(StoreNames.Settings);
      const appStateStore = transaction.objectStore(StoreNames.AppState);

      // Clear all minimons
      await new Promise<void>((resolve, reject) => {
        const clearRequest = minimonStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });

      // Reset token balance
      const initialBalance: TokenBalance = { id: 'tokenBalance', amount: 100 };
      await new Promise<void>((resolve, reject) => {
        const putRequest = settingsStore.put(initialBalance);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });

      // Update app state to reflect a new game started
      const newAppState: AppState = { id: 'currentAppState', hasActiveGame: true, lastPlayedDate: new Date().toISOString() };
      await new Promise<void>((resolve, reject) => {
        const putRequest = appStateStore.put(newAppState);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });
    });
  }

  /**
   * Resets current game data (minimons and token balance) and deactivates the game state.
   * This is used after archiving a game or when explicitly exiting a game without continuing.
   * @returns A promise that resolves when the data is cleared and state is deactivated.
   */
  public async resetGameAfterArchive(): Promise<void> {
    return this.withTransaction<void>([StoreNames.Minimons, StoreNames.Settings, StoreNames.AppState], 'readwrite', async (store, transaction) => {
      const minimonStore = transaction.objectStore(StoreNames.Minimons);
      const settingsStore = transaction.objectStore(StoreNames.Settings);
      const appStateStore = transaction.objectStore(StoreNames.AppState);

      // Clear all minimons
      await new Promise<void>((resolve, reject) => {
        const clearRequest = minimonStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });

      // Reset token balance
      const initialBalance: TokenBalance = { id: 'tokenBalance', amount: 100 };
      await new Promise<void>((resolve, reject) => {
        const putRequest = settingsStore.put(initialBalance);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });

      // Update app state to reflect no active game
      const newAppState: AppState = { id: 'currentAppState', hasActiveGame: false, lastPlayedDate: new Date().toISOString() };
      await new Promise<void>((resolve, reject) => {
        const putRequest = appStateStore.put(newAppState);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
      });
    });
  }

  // --- App State Operations ---

  /**
   * Retrieves the current application state.
   * If no state exists, it initializes it with a default (no active game).
   * @returns A promise that resolves with the current AppState.
   */
  public async getAppState(): Promise<AppState> {
    return this.withTransaction<AppState>(StoreNames.AppState, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get('currentAppState');
        request.onsuccess = async (event: Event) => {
          let state = (event.target as IDBRequest).result as AppState | undefined;
          if (!state) {
            // Initialize with default state if not found
            const defaultState: AppState = { id: 'currentAppState', hasActiveGame: false };
            const putRequest = store.add(defaultState);
            putRequest.onsuccess = () => resolve(defaultState);
            putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
          } else {
            resolve(state);
          }
        };
        request.onerror = (event: Event) => {
          reject((event.target as IDBRequest).error);
        };
      });
    });
  }

  /**
   * Updates the application state.
   * @param newAppState The new AppState object.
   * @returns A promise that resolves with the updated AppState.
   */
  public async saveAppState(newAppState: AppState): Promise<AppState> {
    return this.withTransaction<AppState>(StoreNames.AppState, 'readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put(newAppState);
        request.onsuccess = () => {
          resolve(newAppState);
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
