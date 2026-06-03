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
- Fixed restart-to-update action by tracking downloaded/installing state in the main process and surfacing an installing status in the settings UI.
- Diagnosed the `v1.0.35` restart update failure as macOS code-signature validation failure, not an IPC/button issue.
- Updated the release workflow to pass signing/notarization secrets and require forced code signing plus notarization only on macOS release builds.
- Added a clearer macOS code-signature failure message in the update UI.
- Verified with `npm run build`; local build succeeds with ad-hoc signing while release builds remain protected by forced signing.
- Fixed GitHub Actions `types is not iterable` by changing the macOS release command to use electron-builder `-c.mac.*` config overrides.
- Verified the new command locally with `npm run release:ci -- --publish never -c.mac.forceCodeSigning=true -c.mac.notarize=true`; it no longer fails on argument parsing and reaches the expected Developer ID signing check.
