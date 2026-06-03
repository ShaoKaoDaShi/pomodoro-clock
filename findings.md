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
- GitHub release `v1.0.34` publishes `latest-mac.yml` with only `pomodoro-clock-1.0.34.dmg`; macOS `electron-updater` requires a ZIP artifact in the update metadata, so checks fail with `ZIP file not provided`.
- Electron Builder target fix: macOS needs both `dmg` for manual installation and `zip` for automatic updates; Windows `nsis` and Linux `AppImage` are already supported by `electron-updater` metadata generation.
- Restart-to-update could appear ineffective because install was gated only by `updateState.status === "downloaded"`; keeping an explicit downloaded flag and installing state makes the IPC action resilient to state transitions and gives immediate UI feedback.
- GitHub release `v1.0.35` now includes `pomodoro-clock-1.0.35-arm64.zip`, but macOS installation fails with `Code signature ... did not pass validation`, which occurs after download when Squirrel.Mac validates the update archive.
- Local macOS builds fall back to ad-hoc signing and skip notarization; this is acceptable for development but not sufficient for auto-update releases. The release workflow must provide Developer ID signing secrets and notarization credentials.
- `electron-builder` treats `--mac.forceCodeSigning=true` as a malformed mac platform/target argument, causing `types is not iterable`; config values must be overridden with `-c.mac.forceCodeSigning=true` and `-c.mac.notarize=true`.
- The GitHub Actions error `/Users/runner/work/pomodoro-clock/pomodoro-clock not a file` appears after `CSC_KEY_PASSWORD is not defined`, indicating macOS signing secrets are missing or invalid before electron-builder attempts to resolve the certificate.
- `ENAMETOOLONG` with a path containing the base64 certificate means `CSC_LINK` was passed as raw base64 text; this electron-builder version treats `CSC_LINK` as a link/path, so the workflow decodes it into `$RUNNER_TEMP/mac-certificate.p12` first and passes that path.
