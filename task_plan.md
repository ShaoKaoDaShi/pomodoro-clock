# Task Plan

Goal: Improve the new-version update feature and release automation so users can receive updates from the npm-based release flow.

## Phases

1. Inspect current Electron update/version architecture - complete
2. Implement baseline packaged-app update reminders - complete
3. Verify baseline with available npm commands - complete
4. Add UI-visible update state and manual actions - complete
5. Verify build and update planning notes - complete
6. Update GitHub release workflow from pnpm to npm - complete
7. Fix cross-platform update artifacts for Electron updater - complete
8. Fix restart-to-update action reliability - complete
9. Fix macOS signed-update release requirements - complete

## Decisions

- Use npm as the package manager per repository instructions.
- Use `electron-updater` because the existing Electron Builder config already publishes to GitHub Releases.
- Use `package.json`/`app.getVersion()` as the current version source of truth.
- Put the user-facing update entry in `SettingsPanel` and keep global startup checks in `electron/main.ts`.
- Keep update checks disabled in dev mode and surface that state in the UI.
- GitHub release workflow should use `npm ci` and `npm run release:ci`, matching `package.json` scripts and lockfile.
- macOS GitHub release builds must use Developer ID signing and notarization; local builds may still use ad-hoc signing for development.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `SettingsPanelProps` missing update props | 1 | Added typed update props and action callbacks to `SettingsPanel` |
| `npm run build` failed after enabling `mac.forceCodeSigning` globally | 1 | Moved forced signing/notarization to the macOS GitHub release command so local builds still work |
