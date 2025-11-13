# Project Tasks

This document tracks all development tasks for the Minimon Generator application.

## Done

- [x] Initial setup of project-manager documentation (`general-objectives.md`, `styling-guide.md`, `tasks.md`).
- [x] Updated `AGENT.md` to enforce `tasks.md` updates.
- [x] Refactor `types.ts` to include `Minimon`, `TokenBalance`, `MinimonRarity`, `MinimonStatus` interfaces/enums and update `StoreNames`.
- [x] Created `services/minimonApiService.ts` for handling external Minimon generation API calls, authentication, and error handling.
- [x] Refactor `App.tsx` to integrate Minimon generation, token management, and collection display. (Pre-refactor state)
- [x] Implement UI for generating Minimon, including token deduction and display of generated Minimon.
- [x] Implement "Resell Minimon" functionality, including token refund and status update.
- [x] Implement robust error handling and user feedback for API calls and IndexedDB operations.
- [x] Ensure responsive and aesthetic design across all components using Tailwind CSS and Lucide React.
- [x] Fixed 'Failed to fetch' errors in `services/minimonApiService.ts` by removing unnecessary 'Content-Type' header and providing a more informative error message for network issues.
- [x] Improved API error diagnostics in `services/minimonApiService.ts` by explicitly setting `fetch` mode to `cors` and refining the "Failed to fetch" error message to guide users to check network, server status, and browser console for CORS errors.
- [x] Further refined the 'Failed to fetch' error message in `services/minimonApiService.ts` to explicitly suggest checking server-side CORS configuration, acknowledging the external nature of this error.
- [x] Updated `services/minimonApiService.ts` to use `https` for the API_BASE_URL and enhanced the 'Failed to fetch' error message to include guidance on accepting self-signed certificates in the browser.
- [x] Investigated user report that "resell does not work or is not implemented"; confirmed implementation is present and logically sound. Provided debugging guidance.
- [x] Implemented a request timeout for the Minimon generation API call to handle potential server-side delays and provide a clearer error message.
- [x] The sell functionality is not working, the button in the UI does nothing. Investigated and fixed the stale state closure bug in the confirmation modal handler.
- [x] Collection is stored and retrieved in the indexeddb of the visiting browser.
- [x] Implement dynamic resell value based on Minimon rarity.
- [x] Add a sorting system based on rarity.
- [x] Add a Minidek scoring system based on the number of owned and resold Minimon, with a higher value for owned ones.
- [x] Add a welcome page that teach the user about the game and its mechanics.
- [x] Add a NEW GAME that resets the minidek of the user (with archiving option).
- [x] Add an hall of fame to show the best older minidek the user have created (history is kept on new game).
- [x] Implement a "Continue Game" option on the welcome screen if an active game is detected.
- [x] Welcome page do not explains how the scoring system is calculated
- [x] Rehault the full app to be a modern sleek dark neon stylish app with dynamic animations and particle effects.
- [x] A game is not stored in the history, there should be a button to end the game and store it in the history (to be listed in the hall of fame)
- [x] The score should reward keeping higher rarity minimon in the deck
- [x] Hall of fame lists all minimons in the deck while minimon being resold should be listed as "sold" and kept as "owned"
- [x] Welcome page is ugly, make it stunning and beautiful and easy to read and responsive
- [x] Fix redundant and awkward API error messages by refining `MainGameScreen.tsx` to directly use `error.message` from `minimonApiService.ts` and consistently append "Tokens refunded.".
- [x] Change all references to "Pokemon" and "Pokedex" to "Minimon" and "Minidek" respectively.
- [x] Prevent invalid `minimon.rarity` strings (e.g., `// Updated callF`) from being displayed in the UI by validating against `MinimonRarity` enum and showing "N/A" as a fallback.
- [x] Added a configurable balance module (refunds, owned/resold weights, overflow policy, token-to-score formula, quick-flip bonus) and wired it into live scoring, archives, and sharing.
- [x] Implemented quick-flip telemetry, market fatigue refunds, and detailed run telemetry storage (rolls, tokens, quick flips, style badges), then surface those badges/telemetry in the Hall of Fame.
- [x] Documented the new economy in docs/locales and README plus added conditional Umami + shared footer/analytics enhancements for tracking deployments.
- [x] Added the Speedy gonzales badge for sub-60-second runs and described it across the welcome guide, Hall of Fame legend, and docs.
- [x] Added a Hall of Fame "Reset session" action with confirmation that wipes every deck and session, ensuring the warning explains the irreversibility.

## In Progress
- [x] Define a tunable scoring/resell configuration block (genCost, refund table, owned/resell weights, tokens-to-score formula, top-N limits) so future adjustments aren’t hard-coded.
- [x] Apply the new scoring/token conversion logic the UI already uses (archive + live score) and adjust resell bonus stories, ensuring the Hall of Fame shows “scored by vX.Y” metadata.
- [x] Update docs/strategy copy and telemetry suggestions to describe the token-rock/pity/cooldown balancing plan and the new “share championship deck” CTA below each score.
- [x] Add instrumentation hooks (events or counters) for bankroll stats, rolls, and scores to observe the new economy.
- [x] Display the localized `hallOfFame.legend.help` text above the badge legend, keeping the share badge label logic updated and stable.

## Planned
