# AGENTS.md

## 1. Project Overview

This repository contains a desktop Pomodoro timer built with Electron, React, TypeScript, and Tailwind CSS. Treat this file as implementation guidance for contributors: describe architecture and workflow constraints, but avoid copying user-facing product language from `README.md`.

## 2. Current Architecture

The app uses Electron's Main Process / Renderer Process split.

- **Main Process** (`electron/main.ts`): a helper-oriented entry point that keeps window access, Follow Mouse Mode behavior, tray state, IPC wiring, and lifecycle registration in separate functions.
- **Renderer Process** (`src/main.tsx` -> `src/App.tsx`): React renders the UI and owns timer behavior, settings changes, and IPC calls. `src/App.tsx` is primarily a composition layer: it wires hooks, derives view props, and hands state/actions down to presentational components instead of containing the whole timer implementation.
- **Follow window model**: the main window hosts the full UI, while a lightweight follow window mirrors timer state and follows the cursor when Follow Mouse Mode is active.
- **Styling**: Tailwind CSS v4 is configured through Vite, with shared global styles in `src/style.css` and session-specific theme values in `src/constants/theme.ts`.

## 3. Directory Responsibilities

- `electron/`: Main Process code. `electron/main.ts` manages BrowserWindow creation, tray interactions, Follow Mouse Mode, notifications, IPC channels, shortcuts, and lifecycle hooks.
- `src/`: Renderer Process entry and application UI.
- `src/App.tsx`: top-level composition layer that connects hooks, formatting helpers, theme selection, and presentational components.
- `src/components/`: presentational Renderer Process components such as the mode switch, timer display, timer controls, and settings panel.
- `src/hooks/`: stateful Renderer Process logic. Current hooks split timer state management, timer synchronization across windows, and window-specific controls into focused modules.
- `src/constants/`: shared Renderer Process constants and lookup helpers, such as per-session theme definitions.
- `src/types/`: shared TypeScript contracts for renderer state and IPC-shaped timer data.
- `src/utils/`: small reusable helpers, such as time formatting.
- `public/`: static assets used during development.
- `dist/`, `dist-electron/`, `release/`: generated build artifacts; do not hand-edit them.

## 4. Build And Verification Commands

The project uses `pnpm`.

- `pnpm dev`: start Vite and Electron together for local development.
- `pnpm build`: run the production build pipeline defined in `package.json`, which bundles the renderer with Vite and packages the app with Electron Builder.
- `pnpm preview`: preview the renderer production build locally.

Build outputs:

- `dist/`: bundled renderer assets.
- `dist-electron/`: built Electron main and preload artifacts generated during packaging.
- `release/`: packaged desktop application artifacts.

## 5. Code Style And Change Constraints

- Use TypeScript strict-mode friendly code and prefer explicit parameter/return types where they improve clarity.
- Prefer interfaces for object-shaped contracts in this codebase.
- Use functional React components and hooks; avoid class components.
- Keep composition at the top and logic close to the module that owns it. New Renderer Process behavior should usually land in `src/hooks/`, `src/components/`, `src/constants/`, `src/types/`, or `src/utils/` rather than expanding `src/App.tsx` back into a monolith.
- Use Tailwind utility classes in `className` props; avoid inline styles unless a value must be dynamic.
- Preserve the existing architecture when editing docs: describe current responsibilities accurately and avoid reintroducing outdated structure.

## 6. Testing Status And Verification Expectations

There are currently no automated unit or end-to-end tests configured.

Verification expectations:

- Run `pnpm build` when a change may affect application behavior, packaging, configuration, or architecture-level documentation.
- When editing architecture docs, verify statements against the current source layout before updating prose.
- If you add automated tests in the future, document the command here and keep AGENTS guidance aligned with the actual toolchain.

Future testing direction, if the project adopts it later:

- Unit/integration: Vitest plus React Testing Library.
- End-to-end: Playwright or Cypress with Electron support.

## 7. Security Notes

**Important Note**: The current configuration prioritizes development speed and simplicity over strict security isolation.

- **Node Integration**: Enabled (`nodeIntegration: true`).
- **Context Isolation**: Disabled (`contextIsolation: false`).
- **Implication**: The Renderer Process has direct access to Node.js APIs. While convenient for this app, this is generally discouraged for production applications loading remote content.
- **Mitigation**: Since this app loads local content (`loadFile` or the local dev server), the risk is reduced. The current preload file is not a strong isolation boundary while `contextIsolation` is disabled. Future refactoring should enable `contextIsolation` and expose only the required APIs through a deliberate preload/context-bridge surface.

## 8. Configuration References

- `vite.config.ts`: Vite configuration, including React, Main Process bundling, and Renderer Process support.
- `tsconfig.json`: TypeScript configuration for both Renderer Process and Electron code.
- `package.json`: package scripts plus Electron Builder configuration in the `build` field.
- `electron/main.ts`: Main Process runtime wiring, follow mode orchestration, and IPC channel registration.
- `src/App.tsx`: top-level composition layer for renderer view assembly.
- `src/hooks/usePomodoroTimer.ts`: timer state and session-transition logic.
- `src/hooks/useTimerSync.ts`: cross-window synchronization and command routing.
- `src/hooks/useWindowControls.ts`: Follow Mouse Mode and always-on-top window controls.
- `src/types/timer.ts`: timer-state contracts shared across renderer modules and IPC payload handling.
