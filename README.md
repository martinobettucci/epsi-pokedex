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
   - Set `GEMINI_API_KEY` in [.env.local](.env.local) if you rely on Gemini services for your build.
3. Run the app:
   `npm run dev`
