# AGENTS.md

## Purpose
This file guides agentic coding agents working in this repository.
The project is a small Electron desktop Pomodoro timer built with React, TypeScript, Vite, and Tailwind CSS.
Keep changes focused, minimal, and consistent with the existing architecture.

## Required Agent Skills
Load `planning-with-files` for multi-step tasks, broad analysis, or changes requiring several tool calls.
Load `software-architecture` for design, refactors, architecture analysis, and non-trivial implementation work.
Optional skills are `web-design-guidelines` for UI/UX reviews and `vercel-react-best-practices` for React-specific performance work.
Do not use `first-principles` in this repository.

## Package Manager
Use `npm` for commands in this repository.
The repository currently contains `package-lock.json` and no `pnpm-lock.yaml`.
Do not introduce another package manager unless the user explicitly asks.
Do not update dependency versions unless that is part of the task.

## Build, Lint, and Test Commands
Install dependencies with `npm install`.
Run the app in development with `npm run dev`.
Build and package the app with `npm run build`.
Preview the built Vite renderer with `npm run preview`.
Run TypeScript checking with `npx tsc --noEmit`.
There is no dedicated `typecheck` script in `package.json`.
There is no lint script or lint config currently checked in.
Do not claim lint passes unless a lint tool has been added or configured.
There is no test framework or test script currently checked in.
Do not claim tests pass unless tests have been added and run.
There is currently no supported single-test command.
If Vitest is added, use `npx vitest run path/to/file.test.ts` for one test file.
If Jest is added, use `npx jest path/to/file.test.ts` for one test file.
If Playwright is added, use `npx playwright test path/to/file.spec.ts` for one spec file.
Prefer `npx tsc --noEmit` plus `npm run build` as the current verification baseline.
`npm run build` runs `vite build && electron-builder` and writes packaged artifacts to `release/`.
Use `npm run release` and `npm run release:ci` only when explicitly requested.

## External Agent Rules
Check this file before editing source code.
Check `README.md` for setup and repository overview.
Check `DESIGN.md` before changing timer behavior, window behavior, IPC, or follow mode.
Look for a closer `AGENTS.md` before editing inside a subdirectory.
There are currently no Cursor rules in `.cursor/rules/` or `.cursorrules`.
There are currently no Copilot instructions in `.github/copilot-instructions.md`.
If those files are added later, merge their instructions into this file when updating it.

## Project Layout
`electron/main.ts` contains Electron main-process setup, windows, tray, notifications, shortcuts, and IPC handlers.
`electron/preload.ts` is the preload entry configured by Vite.
`src/App.tsx` composes the renderer UI and connects hooks, IPC-facing helpers, and presentation state.
`src/components/` contains presentational React components.
`src/hooks/` contains stateful timer, synchronization, and window-control behavior.
`src/constants/` contains shared constants such as theme classes.
`src/types/` contains shared TypeScript interfaces and type aliases.
`src/utils/` contains small focused utility functions.
`src/style.css` contains global Tailwind import and mini-mode overrides.
`dist/`, `dist-electron/`, and `release/` are generated outputs.
Do not manually edit generated output directories.

## Architecture Boundaries
The main renderer window is the source of truth for Pomodoro timer state.
The main process owns native desktop concerns, not Pomodoro business rules.
The follow window mirrors state and must not become an independent timer source.
Keep native window lifecycle logic in the Electron main process.
Keep timer state transitions in renderer hooks unless there is a strong architectural reason to move them.
Keep presentational components free of IPC and native Electron behavior.
Use hooks for reusable stateful renderer behavior.
Use small utilities only when logic is genuinely independent of React and Electron.

## Timer Behavior Rules
A session is either `work` or `break`.
Duration changes apply to the displayed timer only while the timer is not running.
Starting a timer uses the current `timeLeft` and stores an absolute `endTime`.
Pausing preserves remaining time.
Resetting restores the configured duration for the current mode.
Switching modes stops any active timer and loads that mode's configured duration.
Work completion switches to break mode after sound and notification.
Break completion switches to work mode after sound and notification.
Do not add long breaks, analytics, task lists, or cloud sync unless explicitly requested.

## Electron and IPC Guidelines
Use typed payload interfaces for IPC data in `electron/main.ts` and `src/types/`.
Keep IPC channel names descriptive and stable.
Remove IPC listeners in React effect cleanups.
Avoid duplicating authoritative timer state in the main process.
Use early returns for missing or destroyed windows.
Always check `BrowserWindow` references through helper accessors when available.
Preserve transparent frameless window behavior unless the task is about window chrome.
Be careful with `alwaysOnTop`, `skipTaskbar`, `setIgnoreMouseEvents`, and workspace visibility.
Window shadow and transparency changes can affect macOS, Windows, and Linux differently.

## React Guidelines
Use function components.
Existing components mostly use default exported functions.
Keep `App.tsx` as a composition layer rather than adding unrelated responsibilities.
Move stateful behavior into focused hooks when it grows beyond view composition.
Keep presentational components controlled by props.
Do not introduce global state libraries for the current app size.
Use React effects for subscriptions, timers, observers, and IPC listener lifecycles.
Always clean up intervals, timeouts, observers, and IPC listeners.
Do not add `useMemo` or `useCallback` by default.
Use memoization only when it prevents real churn or matches existing local patterns.

## TypeScript Guidelines
The project uses TypeScript but currently has `strict: false` and `noImplicitAny: false`.
Do not use that relaxed config as permission to add vague types.
Prefer explicit interfaces for object-shaped props and IPC payloads.
Use `type` for unions such as session modes.
Use `interface` for component props and structured payloads when matching existing style.
Use `import type` for type-only React and local imports.
Prefer `number | null` over sentinel numbers for optional timestamps.
Avoid `any`; if unavoidable, keep it local and explain why.
Prefer narrow event types such as `ChangeEvent<HTMLInputElement>`.
Use `satisfies` when constructing payloads that should conform without widening unnecessarily.

## Import Style
Use ES module imports.
Group external imports before local imports.
Put type-only imports in `import type` statements.
Use relative imports inside `src/` unless the existing file already uses the `@/*` alias.
Do not mix path alias and relative style in the same small area without reason.
Keep import order simple and readable; no import-sorting tool is currently configured.

## Formatting Style
Use two-space indentation.
Use double quotes for strings.
Use semicolons.
Use trailing commas where the existing code uses them in multiline calls and objects.
Keep JSX readable with multiline props for larger components.
Prefer early returns over deep nesting.
Keep functions focused and avoid growing files unnecessarily.
Do not run broad formatters unless a formatter is configured or the user asks.
Avoid unrelated whitespace churn.

## Naming Conventions
Use PascalCase for React components and exported component prop interfaces.
Use camelCase for functions, variables, hooks, and local state.
Use `useX` names for React hooks.
Use descriptive handler names such as `handleTimerUpdate` and `handleFollowChange`.
Use `isX`, `hasX`, or `canX` for booleans.
Use domain names such as `TimerBroadcastState` instead of generic names.
Avoid catch-all names like `utils`, `helpers`, or `common` for new modules.

## Styling Guidelines
Styling is primarily Tailwind CSS v4 through class names.
Global CSS should stay small and limited to cross-cutting behavior.
Preserve the current visual language unless asked to redesign.
Focus and break modes should remain visually distinct.
Follow mode should remain compact and non-interactive.
Be careful with `[-webkit-app-region:drag]` and `[-webkit-app-region:no-drag]`.
Controls inside frameless draggable regions must be marked no-drag.
Avoid adding heavy animation or layout complexity to this lightweight app.

## Error Handling Guidelines
Use early returns for unsupported platforms, missing APIs, and absent windows.
When using browser APIs such as `AudioContext`, guard for availability.
When using platform features such as open-at-login, check platform support first.
Do not swallow errors silently if they affect user-visible behavior.
For expected unsupported behavior, return a safe value and keep UI state consistent.
For unexpected failures, prefer explicit reporting or a recoverable fallback.

## Verification Expectations
Before claiming a code change is complete, run relevant commands.
For TypeScript-only or renderer changes, run `npx tsc --noEmit` when possible.
For Electron, Vite, packaging, or config changes, run `npm run build` when feasible.
If a command cannot be run, report why and what remains unverified.
Do not claim tests or lint passed when no test or lint command exists.
For UI or window behavior, include manual verification notes if automated checks are unavailable.

## Git and Generated Files
Do not commit unless the user explicitly asks.
Do not amend commits unless explicitly requested.
Do not run destructive git commands such as reset or checkout to discard user changes.
Do not edit `dist/`, `dist-electron/`, `release/`, or package artifacts directly.
Build output may change after `npm run build`; avoid committing generated artifacts unless requested.
Respect unrelated working-tree changes from the user or other agents.

## Dependency and Documentation Guidelines
Prefer existing platform and project capabilities before adding dependencies.
Add dependencies only when they clearly reduce maintenance or are explicitly requested.
If adding a package, update the lockfile with `npm install`.
Avoid adding a test, lint, or formatting stack as part of unrelated feature work.
Update `README.md` for user-facing setup or usage changes.
Update `DESIGN.md` for architectural decisions or responsibility changes.
Update `AGENTS.md` for workflow, command, style, or agent guidance changes.
Keep documentation factual and synchronized with `package.json`.
Avoid documenting aspirational commands that do not exist.
