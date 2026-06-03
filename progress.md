# Progress

## 2026-06-03

- Previous baseline: added `electron-updater`, implemented packaged-app startup update checks, and verified with `npm run build`.
- Started follow-up task: improve update feature with UI-visible status and user actions.
- Restored planning files and inspected `package.json`, `electron/main.ts`, `src/App.tsx`, and `src/components/SettingsPanel.tsx`.
- Added shared update state types in `src/types/update.ts`.
- Extended `electron/main.ts` to maintain update state, publish state changes to the renderer, support manual checks, and install a downloaded update later.
- Extended `src/App.tsx` and `src/components/SettingsPanel.tsx` to show current/latest version, update status, manual check button, and restart-to-update action.
- Verified with `npm run build`; Vite and Electron Builder completed successfully.
- Updated `.github/workflows/release.yml` to remove pnpm setup/cache and use `npm ci` plus `npm run release:ci`.
- Diagnosed macOS update check failure: published `latest-mac.yml` for `v1.0.34` lacks the required ZIP artifact and only lists the DMG.
- Updated `package.json` mac build target to generate both `dmg` and `zip`, preserving Windows `nsis` and Linux `AppImage` update targets.
