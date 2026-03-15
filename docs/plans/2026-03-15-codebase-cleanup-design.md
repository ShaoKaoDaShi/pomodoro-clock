# Codebase Cleanup Design

Date: 2026-03-15
Project: pomodoro-clock
Topic: full codebase cleanup and organization

## Goals

- Improve maintainability across renderer and main process code.
- Split large files by responsibility without changing product behavior.
- Reduce coupling between timer logic, IPC synchronization, window controls, and UI rendering.
- Standardize naming, typing, and repeated patterns to make future work safer.

## Current Problems

### Renderer

`src/App.tsx` currently mixes several responsibilities:

- pomodoro timer state and transitions
- timer completion side effects
- main/follow window synchronization
- Electron IPC listener registration
- follow mode and always-on-top window controls
- resize observation
- theme selection and full UI rendering

This makes the file hard to read, risky to modify, and difficult to test.

### Main Process

`electron/main.ts` currently combines:

- main window creation
- follow window creation and cursor tracking
- tray creation and menu updates
- IPC registration
- timer fallback scheduling
- app lifecycle wiring

The logic works, but related concerns are not clearly separated.

## Evaluated Approaches

### 1. Incremental full cleanup (recommended)

Refactor by responsibility while preserving behavior and existing architecture.

Plan:

- keep React state local and Electron IPC model unchanged
- extract renderer hooks, components, constants, and utilities
- group or extract main-process functions by responsibility
- keep feature set and interaction model intact

Pros:

- best balance of maintainability and safety
- produces a cleaner structure for future features and tests
- avoids unnecessary architectural churn

Cons:

- touches multiple files
- requires careful regression checking around IPC and follow mode

### 2. Conservative cleanup only

Do light in-file cleanup with helper functions, naming fixes, and duplicated logic removal.

Pros:

- smallest diff
- lowest immediate regression risk

Cons:

- large files remain large
- limited long-term improvement

### 3. Deeper state-flow refactor

Introduce a stronger state model such as `useReducer` or a controller abstraction across renderer/main process interactions.

Pros:

- clearest long-term model
- strongest separation of business rules

Cons:

- biggest behavioral risk
- unnecessary for current project size

## Recommended Design

Use the incremental full cleanup approach.

The project already has a working feature set. The most valuable improvement is to separate responsibilities without changing how the application behaves. This gives immediate readability and maintainability gains while keeping regression risk manageable.

## Target Architecture

### Renderer structure

Keep `src/App.tsx` as a composition layer only.

Proposed modules:

- `src/hooks/usePomodoroTimer.ts`
  - owns timer state and actions
  - handles start, pause, reset, mode switch, and completion flow
- `src/hooks/useTimerSync.ts`
  - handles main/follow window synchronization and IPC listeners
  - bridges tray/main-process commands to stable timer actions
- `src/hooks/useWindowControls.ts`
  - manages always-on-top, follow mode toggling, and resize behavior
- `src/components/ModeSwitch.tsx`
- `src/components/TimerDisplay.tsx`
- `src/components/TimerControls.tsx`
- `src/components/SettingsPanel.tsx`
- `src/constants/theme.ts`
  - exports focus/break theme tokens
- `src/utils/time.ts`
  - exports `formatTime`
- optional `src/types/timer.ts`
  - shared renderer-side interfaces for timer state and actions

`src/App.tsx` should:

- assemble hooks
- derive view props
- render components
- avoid direct low-level timer and IPC implementation details

### Main process structure

Preferred outcome:

- keep `electron/main.ts` as the entry point
- extract helper modules only when useful and low-risk

Possible modules:

- `electron/windows.ts`
  - create and manage main/follow windows
- `electron/tray.ts`
  - create tray and rebuild menu from current session state
- `electron/ipc.ts`
  - register IPC handlers using shared window helpers

If module extraction causes unnecessary churn, retain a single file but reorganize it into clearly delimited sections and helper functions.

## Data Flow

### Timer ownership

`usePomodoroTimer` is the single source of truth for renderer timer state:

- `timeLeft`
- `isRunning`
- `isWorkSession`
- `workTime`
- `breakTime`
- `endTimeRef`

It exposes action methods:

- `startTimer`
- `pauseTimer`
- `resetTimer`
- `switchMode`
- setters for work and break durations

### Synchronization

`useTimerSync` does not own business state.

Responsibilities:

- main window broadcasts timer state to follow window
- follow window requests state and smooths its display locally with `endTime`
- tray and main-process commands invoke stable renderer actions through refs or memoized callbacks
- listener registration and cleanup always happen in matched pairs

### Window controls

`useWindowControls` isolates UI-to-Electron behavior:

- follow mode start/stop
- follow status observation
- always-on-top toggle
- resize observer for main window sizing

### UI components

UI components receive props and callbacks only.

They should not import `ipcRenderer` or own app-wide side effects.

## Error Handling and Guardrails

- Validate numeric inputs before committing state updates.
- Prevent invalid values such as `NaN`, zero, or out-of-range durations.
- Always check whether `win` or `followWin` exists and is not destroyed before sending events.
- Ensure every IPC listener added in an effect has a corresponding cleanup path.
- Preserve `Date.now()` plus `endTime` timing model to avoid background throttling issues.
- Preserve main-process fallback timer behavior.

## Behavior Preservation Requirements

The refactor must preserve:

- start, pause, reset
- work/break mode switching
- automatic transition on timer completion
- native notifications and audio feedback
- tray actions for mode switching and timer control
- follow mouse mode behavior
- always-on-top behavior
- main/follow window state synchronization
- current visual appearance unless a cleanup change is required for consistency

## Non-Goals

- no product redesign
- no major UX change
- no new state management library
- no migration to `contextIsolation: true` in this cleanup pass
- no automated test framework setup in this pass

## Verification Plan

- type-check/build the existing app after refactor work
- manually verify key flows:
  - start/pause/reset
  - work to break transition
  - break to work transition
  - tray controls
  - follow mode open/close
  - always-on-top toggle
  - notification trigger paths
- confirm Electron build output still succeeds

## Implementation Notes

Suggested order:

1. extract shared utility and theme constants
2. extract presentational components
3. extract timer hook
4. extract sync and window-control hooks
5. simplify `src/App.tsx`
6. reorganize `electron/main.ts`
7. run build and regression checks

This order reduces risk because it moves from low-risk extraction to behavior-sensitive integration.
