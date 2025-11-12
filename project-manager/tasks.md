# Project Tasks

This document tracks all development tasks for the Pokémon Generator application.

## Done

- [x] Initial setup of project-manager documentation (`general-objectives.md`, `styling-guide.md`, `tasks.md`).
- [x] Updated `AGENT.md` to enforce `tasks.md` updates.
- [x] Refactor `types.ts` to include `Pokemon`, `TokenBalance`, `PokemonRarity`, `PokemonStatus` interfaces/enums and update `StoreNames`.
- [x] Created `services/pokemonApiService.ts` for handling external Pokémon generation API calls, authentication, and error handling.
- [x] Refactor `App.tsx` to integrate Pokémon generation, token management, and collection display. (Pre-refactor state)
- [x] Implement UI for generating Pokémon, including token deduction and display of generated Pokémon.
- [x] Implement "Resell Pokémon" functionality, including token refund and status update.
- [x] Implement robust error handling and user feedback for API calls and IndexedDB operations.
- [x] Ensure responsive and aesthetic design across all components using Tailwind CSS and Lucide React.
- [x] Fixed 'Failed to fetch' errors in `services/pokemonApiService.ts` by removing unnecessary 'Content-Type' header and providing a more informative error message for network issues.
- [x] Improved API error diagnostics in `services/pokemonApiService.ts` by explicitly setting `fetch` mode to `cors` and refining the "Failed to fetch" error message to guide users to check network, server status, and browser console for CORS errors.
- [x] Further refined the 'Failed to fetch' error message in `services/pokemonApiService.ts` to explicitly suggest checking server-side CORS configuration, acknowledging the external nature of this error.
- [x] Updated `services/pokemonApiService.ts` to use `https` for the API_BASE_URL and enhanced the 'Failed to fetch' error message to include guidance on accepting self-signed certificates in the browser.
- [x] Investigated user report that "resell does not work or is not implemented"; confirmed implementation is present and logically sound. Provided debugging guidance.
- [x] Implemented a request timeout for the Pokémon generation API call to handle potential server-side delays and provide a clearer error message.
- [x] The sell functionality is not working, the button in the UI does nothing. Investigated and fixed the stale state closure bug in the confirmation modal handler.
- [x] Collection is stored and retrieved in the indexeddb of the visiting browser.
- [x] Implement dynamic resell value based on Pokémon rarity.
- [x] Add a sorting system based on rarity.
- [x] Add a Pokédex scoring system based on the number of owned and resold Pokémon, with a higher value for owned ones.
- [x] Add a welcome page that teach the user about the game and its mechanics.
- [x] Add a NEW GAME that resets the pokedex of the user (with archiving option).
- [x] Add an hall of fame to show the best older pokedex the user have created (history is kept on new game).
- [x] Implement a "Continue Game" option on the welcome screen if an active game is detected.
- [x] Welcome page do not explains how the scoring system is calculated
- [x] Rehault the full app to be a modern sleek dark neon stylish app with dynamic animations and particle effects.
- [x] A game is not stored in the history, there should be a button to end the game and store it in the history (to be listed in the hall of fame)
- [x] The score should reward keeping higher rarity pokemon in the deck
- [x] Hall of fame lists all pokemons in the deck while pokemon being resold should be listed as "sold" and kept as "owned"
- [x] Welcome page is ugly, make it stunning and beautiful and easy to read and responsive

## In Progress

## Planned