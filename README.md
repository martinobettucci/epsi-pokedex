<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RH8EA8_DSoicXdw1oQInI2AsE5L8YNTA

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure environment variables:
   - `.env` already provides `VITE_API_BASE_URL=https://epsi.journeesdecouverte.fr:22222/v1`; update it if you need to target a different API host.
   - Add your bearer token to `VITE_BEARER_TOKEN` (defaults to `EPSI`). Treat this as a secret even though it resides in `.env`; do not commit real tokens.
   - `.env` now also exposes `VITE_CERTIFY_SCORE_ENDPOINT=https://epsi.journeesdecouverte.fr:22222/v1/certify-score`, which the Hall of Fame uses to sign exported decks. Override it only if your signing service lives somewhere else.
   - `.env` exposes `VITE_APP_PUBLIC_URL=https://minimon-deck-game.netlify.app/` so the share buttons always point to the official site; change it if you deploy the client under a different URL.
   - Set `GEMINI_API_KEY` in [.env.local](.env.local) if you rely on Gemini services for your build.
3. Run the app:
   `npm run dev`
4. When browsing the Hall of Fame, click the exported deck and “Share this deck” to request a certified signature; you can then push the prepared message to LinkedIn, X, Instagram, or Facebook with the official app link.
4. Switch between English, Français, and Italiano from the language dropdown on the welcome screen to translate the entire interface instantly.
5. When the app is served under `*.lelabs.tech`, Umami analytics bootstraps automatically via the `analytics.p2enjoy.studio` script; no additional setup is needed.
6. Score/retention note: quick-flipping a duplicate within 5 seconds grants bonus points, while repeating the same rarity lowers refunds slightly to keep the market flowing; remaining tokens convert via the diminishing formula documented in `docs/01-introduction.md`.
7. The welcome “Strategic Guide” now explains the badge system (Curator, Flipper, Risk-taker, Brave run, No brainer, No player, Speedy gonzales) and the Hall of Fame pages label runs accordingly so you know exactly how your next strategy scores.
