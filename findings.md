# Findings

- `package.json` version is `1.0.31` and build uses Electron Builder with GitHub publishing configured.
- App UI is React in `src/App.tsx`; Electron main/preload files are under `electron/`.
- `electron/main.ts` already imported `electron-updater` and checked for updates only in packaged apps.
- Previous update behavior notified on `update-available`, auto-downloaded, and showed a restart dialog on `update-downloaded`.
- Existing UI had no version/update state; `SettingsPanel` is the natural user-initiated entry point.
- Renderer imports `ipcRenderer` directly because node integration is enabled and context isolation is disabled.
- Improved implementation keeps startup checks in the main process and exposes `request-update-state`, `check-for-updates`, and `install-downloaded-update` IPC events.
- Development mode cannot perform real update checks; the UI now displays that unsupported state instead of pretending to check.
- `.github/workflows/release.yml` previously installed pnpm, cached pnpm, ran `pnpm install --frozen-lockfile`, and ran `pnpm run release:ci`.
- The repository has `package-lock.json` and npm scripts, so CI release should use `npm ci` and `npm run release:ci`.
