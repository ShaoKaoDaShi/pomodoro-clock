# Codebase Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the pomodoro clock codebase into smaller, clearer modules while preserving all current desktop behavior.

**Architecture:** Keep the current Electron multi-process structure and local React state model, but separate renderer concerns into hooks, components, constants, and utilities. Reorganize main-process logic into clearly scoped helpers or modules so timer behavior, IPC wiring, window control, and tray interactions are easier to maintain.

**Tech Stack:** Electron, React 19, TypeScript, Vite, Tailwind CSS v4, pnpm

---

### Task 1: Baseline verification and worktree hygiene

**Files:**
- Check: `package.json`
- Check: `src/App.tsx`
- Check: `electron/main.ts`
- Reference: `docs/plans/2026-03-15-codebase-cleanup-design.md`

**Step 1: Inspect the current git state**

Run: `git status --short`
Expected: See whether the worktree already has unrelated user changes that must be preserved.

**Step 2: Build the current project as a baseline**

Run: `pnpm build`
Expected: Successful renderer and Electron build output.

**Step 3: Record the baseline behavior checklist**

Create a local checklist for manual regression coverage:

- start timer
- pause timer
- reset timer
- switch work/break mode
- timer completion transition
- follow mode open/close
- tray commands
- always-on-top toggle

**Step 4: Commit only if you had to create a worktree-specific bootstrap file**

Run: no commit expected for this task in normal flow.

### Task 2: Extract shared time and theme utilities

**Files:**
- Create: `src/utils/time.ts`
- Create: `src/constants/theme.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing type-level usage change**

Update `src/App.tsx` imports to consume the new modules before the modules exist:

```ts
import { formatTime } from "./utils/time";
import { getTheme } from "./constants/theme";
```

Expected: TypeScript build fails because the new modules do not exist yet.

**Step 2: Run build to verify it fails**

Run: `pnpm build`
Expected: FAIL with module resolution errors for `./utils/time` and `./constants/theme`.

**Step 3: Write the minimal utility implementations**

Create `src/utils/time.ts`:

```ts
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}
```

Create `src/constants/theme.ts`:

```ts
export interface SessionTheme {
  bg: string;
  text: string;
  button: string;
  buttonSecondary: string;
  ring: string;
  border: string;
  mini: string;
}

const workTheme: SessionTheme = {
  bg: "from-indigo-50 to-blue-50",
  text: "text-indigo-600",
  button: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200",
  buttonSecondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  ring: "focus:ring-indigo-200",
  border: "border-indigo-100",
  mini: "bg-indigo-50/90 text-indigo-600 border-indigo-200/50 shadow-indigo-100/50",
};

const breakTheme: SessionTheme = {
  bg: "from-teal-50 to-emerald-50",
  text: "text-teal-600",
  button: "bg-teal-500 hover:bg-teal-600 shadow-teal-200",
  buttonSecondary: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  ring: "focus:ring-teal-200",
  border: "border-teal-100",
  mini: "bg-teal-50/90 text-teal-600 border-teal-200/50 shadow-teal-100/50",
};

export function getTheme(isWorkSession: boolean): SessionTheme {
  return isWorkSession ? workTheme : breakTheme;
}
```

Update `src/App.tsx` to use those imports and remove the inline utility/theme definitions.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS for this extraction step.

**Step 5: Commit**

```bash
git add src/utils/time.ts src/constants/theme.ts src/App.tsx
git commit -m "refactor: extract shared timer utilities"
```

### Task 3: Extract presentational components from `src/App.tsx`

**Files:**
- Create: `src/components/ModeSwitch.tsx`
- Create: `src/components/TimerDisplay.tsx`
- Create: `src/components/TimerControls.tsx`
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/App.tsx`
- Reference: `src/style.css`

**Step 1: Write the failing integration change**

Replace one inline section in `src/App.tsx` with imports that do not exist yet:

```ts
import ModeSwitch from "./components/ModeSwitch";
import TimerDisplay from "./components/TimerDisplay";
import TimerControls from "./components/TimerControls";
import SettingsPanel from "./components/SettingsPanel";
```

Expected: build fails until the components are created.

**Step 2: Run build to verify it fails**

Run: `pnpm build`
Expected: FAIL with module resolution errors for `src/components/*`.

**Step 3: Write minimal presentational components**

Create `src/components/ModeSwitch.tsx`:

```tsx
interface ModeSwitchProps {
  isHidden: boolean;
  isWorkSession: boolean;
  onSwitchMode: (mode: "work" | "break") => void;
}

export default function ModeSwitch({
  isHidden,
  isWorkSession,
  onSwitchMode,
}: ModeSwitchProps) {
  return (
    <div
      className={`flex justify-center mb-6 gap-2 ${isHidden ? "hidden" : ""} [-webkit-app-region:no-drag]`}
    >
      <button
        onClick={() => onSwitchMode("work")}
        className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
          isWorkSession
            ? "bg-white shadow-sm text-indigo-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Focus
      </button>
      <button
        onClick={() => onSwitchMode("break")}
        className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
          !isWorkSession
            ? "bg-white shadow-sm text-teal-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Break
      </button>
    </div>
  );
}
```

Create `src/components/TimerDisplay.tsx`:

```tsx
interface TimerDisplayProps {
  formattedTime: string;
  isMiniMode: boolean;
  timerTextClassName: string;
  statusText: string;
}

export default function TimerDisplay({
  formattedTime,
  isMiniMode,
  timerTextClassName,
  statusText,
}: TimerDisplayProps) {
  return (
    <div className="text-center relative">
      <div id="timer" className={timerTextClassName}>
        {formattedTime}
      </div>
      <div
        className={`text-sm font-medium text-gray-500 mb-8 h-6 ${isMiniMode ? "hidden" : ""}`}
        id="status-text"
      >
        {statusText}
      </div>
    </div>
  );
}
```

Create `src/components/TimerControls.tsx`:

```tsx
interface TimerControlsProps {
  isHidden: boolean;
  isRunning: boolean;
  primaryButtonClassName: string;
  secondaryButtonClassName: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function TimerControls({
  isHidden,
  isRunning,
  primaryButtonClassName,
  secondaryButtonClassName,
  onStart,
  onPause,
  onReset,
}: TimerControlsProps) {
  return (
    <div
      className={`flex justify-center gap-4 mb-8 controls-area [-webkit-app-region:no-drag] ${isHidden ? "hidden" : ""}`}
    >
      {!isRunning ? (
        <button className={primaryButtonClassName} onClick={onStart}>
          开始
        </button>
      ) : (
        <button
          className="flex-1 py-3 px-6 rounded-2xl bg-amber-400 text-amber-900 font-semibold shadow-lg shadow-amber-100 hover:bg-amber-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200"
          onClick={onPause}
        >
          暂停
        </button>
      )}

      <button
        className={secondaryButtonClassName}
        onClick={onReset}
        title="重置"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
```

Create `src/components/SettingsPanel.tsx` with props for work time, break time, always-on-top, follow mode, theme classes, and callbacks. Move the existing JSX without changing behavior.

Update `src/App.tsx` to render the new components and pass only props.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS and unchanged UI behavior.

**Step 5: Commit**

```bash
git add src/components/ModeSwitch.tsx src/components/TimerDisplay.tsx src/components/TimerControls.tsx src/components/SettingsPanel.tsx src/App.tsx
git commit -m "refactor: extract renderer presentational components"
```

### Task 4: Extract timer types and timer hook

**Files:**
- Create: `src/types/timer.ts`
- Create: `src/hooks/usePomodoroTimer.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing integration change**

Change `src/App.tsx` to import a new hook before it exists:

```ts
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
```

Expected: build fails because the hook module does not exist.

**Step 2: Run build to verify it fails**

Run: `pnpm build`
Expected: FAIL with module resolution error for `./hooks/usePomodoroTimer`.

**Step 3: Write the minimal timer hook implementation**

Create `src/types/timer.ts`:

```ts
export interface TimerBroadcastState {
  timeLeft: number;
  isWorkSession: boolean;
  isRunning: boolean;
  endTime: number | null;
}

export interface TimerStateRef extends TimerBroadcastState {
  workTime: number;
  breakTime: number;
}

export type SessionMode = "work" | "break";
```

Create `src/hooks/usePomodoroTimer.ts` and move the following logic out of `src/App.tsx`:

- `timeLeft`, `isRunning`, `isWorkSession`, `workTime`, `breakTime`
- `timerIntervalRef`, `endTimeRef`, `stateRef`, `handlersRef`
- `startTimer`, `pauseTimer`, `resetTimer`, `switchMode`
- `timerComplete`
- update-on-settings-change effect

The hook should accept dependencies for side effects so it stays focused:

```ts
interface UsePomodoroTimerOptions {
  isFollowWindow: boolean;
  onTimerCompleteWork: () => void;
  onTimerCompleteBreak: () => void;
  onStartTimerCheck: (durationMs: number) => void;
  onStopTimerCheck: () => void;
}
```

Export the timer state, refs, and action methods needed by `src/App.tsx` and the sync hook.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS with timer behavior preserved.

**Step 5: Commit**

```bash
git add src/types/timer.ts src/hooks/usePomodoroTimer.ts src/App.tsx
git commit -m "refactor: extract pomodoro timer hook"
```

### Task 5: Extract timer sync and window control hooks

**Files:**
- Create: `src/hooks/useTimerSync.ts`
- Create: `src/hooks/useWindowControls.ts`
- Modify: `src/App.tsx`
- Reference: `src/types/timer.ts`

**Step 1: Write the failing integration change**

Change `src/App.tsx` to import the new hooks before they exist:

```ts
import { useTimerSync } from "./hooks/useTimerSync";
import { useWindowControls } from "./hooks/useWindowControls";
```

Expected: build fails because the hook modules do not exist.

**Step 2: Run build to verify it fails**

Run: `pnpm build`
Expected: FAIL with module resolution errors for the new hooks.

**Step 3: Write the minimal hook implementations**

Create `src/hooks/useTimerSync.ts`.

Move these behaviors out of `src/App.tsx`:

- follow window initial `request-timer-state`
- `timer-update` listener for follow window
- `request-timer-state` responder in main window
- `timer-finished-check` fallback handling
- tray command listeners for start/pause/reset/mode switch
- main window state broadcast effect
- follow window local smoothing interval

Suggested interface:

```ts
import { MutableRefObject } from "react";
import { SessionMode, TimerBroadcastState, TimerStateRef } from "../types/timer";

interface TimerActionHandlers {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: SessionMode) => void;
  completeTimer: () => void;
  setTimeLeft: (value: number) => void;
  setIsRunning: (value: boolean) => void;
  setIsWorkSession: (value: boolean) => void;
}

interface UseTimerSyncOptions {
  isFollowWindow: boolean;
  timeLeft: number;
  isRunning: boolean;
  isWorkSession: boolean;
  endTimeRef: MutableRefObject<number | null>;
  stateRef: MutableRefObject<TimerStateRef>;
  handlersRef: MutableRefObject<{
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    switchMode: (mode: SessionMode) => void;
  }>;
  actions: TimerActionHandlers;
}
```

Create `src/hooks/useWindowControls.ts`.

Move these behaviors out of `src/App.tsx`:

- follow mode status listener
- initial follow mode status check
- follow mode toggle action
- always-on-top toggle action
- non-follow resize observer behavior

Suggested interface:

```ts
interface UseWindowControlsOptions {
  isFollowWindow: boolean;
}

interface UseWindowControlsResult {
  isFollowActive: boolean;
  isAlwaysOnTop: boolean;
  handleFollowMouse: () => void;
  handleAlwaysOnTopChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setIsAlwaysOnTop: (value: boolean) => void;
}
```

Update `src/App.tsx` to consume the hooks and remove inline IPC-heavy effects.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS with all sync behaviors preserved.

**Step 5: Commit**

```bash
git add src/hooks/useTimerSync.ts src/hooks/useWindowControls.ts src/App.tsx
git commit -m "refactor: separate ipc sync and window controls"
```

### Task 6: Simplify `src/App.tsx` into a composition layer

**Files:**
- Modify: `src/App.tsx`
- Reference: `src/components/ModeSwitch.tsx`
- Reference: `src/components/TimerDisplay.tsx`
- Reference: `src/components/TimerControls.tsx`
- Reference: `src/components/SettingsPanel.tsx`
- Reference: `src/hooks/usePomodoroTimer.ts`
- Reference: `src/hooks/useTimerSync.ts`
- Reference: `src/hooks/useWindowControls.ts`

**Step 1: Write the failing lint-style structural target**

No separate test file exists. Instead, set the structural target for `src/App.tsx`:

- imports only composition dependencies
- no direct `ipcRenderer.on(...)` registrations
- no inline `formatTime`
- no inline `theme` object definition
- no inline timer engine implementation

Expected: temporary build failure while imports and props are being rewired.

**Step 2: Run build during the partial rewrite**

Run: `pnpm build`
Expected: likely FAIL if the file is mid-refactor.

**Step 3: Finish the minimal composition-only implementation**

`src/App.tsx` should contain:

- `isFollowWindow` / `isMiniMode` derivation
- notification/audio callbacks or a tiny extracted helper if preferred
- hook wiring
- `statusText` derivation
- `formattedTime` derivation
- class name composition for timer and buttons
- JSX composition only

If audio and notification helpers still make the file noisy, extract them to `src/utils/feedback.ts`.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS and `src/App.tsx` is dramatically smaller and easier to scan.

**Step 5: Commit**

```bash
git add src/App.tsx src/utils/feedback.ts
git commit -m "refactor: simplify app composition layer"
```

If `src/utils/feedback.ts` was not created, omit it from the commit.

### Task 7: Reorganize `electron/main.ts`

**Files:**
- Modify: `electron/main.ts`
- Optional Create: `electron/windows.ts`
- Optional Create: `electron/tray.ts`
- Optional Create: `electron/ipc.ts`

**Step 1: Write the failing integration change**

Choose one of two paths:

- either import helper modules that do not exist yet
- or move code into new helper functions in-place until `electron/main.ts` is temporarily incomplete

Expected: build fails until the new structure is finished.

**Step 2: Run build to verify it fails**

Run: `pnpm build`
Expected: FAIL during the in-progress reorganization.

**Step 3: Write the minimal reorganized implementation**

Required outcomes:

- clear grouping for app lifecycle, window management, tray management, and IPC registration
- shared guard helpers for checking `win`/`followWin`
- no behavior changes for follow mode, tray menu, timer fallback, or notifications
- explicit helper names such as:

```ts
function createMainWindow(): BrowserWindow { ... }
function createFollowWindow(): void { ... }
function closeFollowWindow(): void { ... }
function updateTrayMenu(): void { ... }
function registerIpcHandlers(): void { ... }
function startMainTimerCheck(durationMs: number): void { ... }
function stopMainTimerCheck(): void { ... }
```

If extraction into separate files is low-risk, use them. If not, keep one file but make the boundaries obvious and consistent.

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS with unchanged runtime behavior.

**Step 5: Commit**

```bash
git add electron/main.ts electron/windows.ts electron/tray.ts electron/ipc.ts
git commit -m "refactor: reorganize electron main process"
```

If helper files were not created, omit them from the commit.

### Task 8: Final naming, typing, and dead-code cleanup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/usePomodoroTimer.ts`
- Modify: `src/hooks/useTimerSync.ts`
- Modify: `src/hooks/useWindowControls.ts`
- Modify: `electron/main.ts`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/TimerDisplay.tsx`
- Modify: `src/components/TimerControls.tsx`
- Modify: `src/components/ModeSwitch.tsx`

**Step 1: Write the failing cleanup target**

Set the cleanup target:

- no placeholder comments like `// ... (Function definitions)`
- no unused imports
- no `any` where a local interface is easy to define
- no duplicated literal type declarations when shared types exist
- no stale commented-out code unless it documents a necessary platform quirk

Expected: build may already pass, but this task defines the final polish criteria.

**Step 2: Run TypeScript build before cleanup**

Run: `pnpm build`
Expected: PASS or reveal any remaining type issues to resolve.

**Step 3: Make the minimal cleanup changes**

Examples:

- replace repeated `"work" | "break"` annotations with `SessionMode`
- replace event `any` with specific payload interfaces where practical
- remove dead comments and stale disabled code
- normalize helper naming and prop naming

**Step 4: Run build to verify it passes**

Run: `pnpm build`
Expected: PASS with cleaner, stricter code.

**Step 5: Commit**

```bash
git add src/App.tsx src/hooks/usePomodoroTimer.ts src/hooks/useTimerSync.ts src/hooks/useWindowControls.ts electron/main.ts src/components/SettingsPanel.tsx src/components/TimerDisplay.tsx src/components/TimerControls.tsx src/components/ModeSwitch.tsx
git commit -m "refactor: polish typing and remove dead code"
```

### Task 9: Final regression verification

**Files:**
- Check: `src/App.tsx`
- Check: `electron/main.ts`
- Check: `docs/plans/2026-03-15-codebase-cleanup-design.md`
- Check: `docs/plans/2026-03-15-codebase-cleanup.md`

**Step 1: Run the final build**

Run: `pnpm build`
Expected: PASS.

**Step 2: Run the app for manual verification**

Run: `pnpm dev`
Expected: App launches successfully.

**Step 3: Manually verify the regression checklist**

Check all of the following in the running app:

- start timer
- pause timer
- reset timer
- switch to break mode manually
- switch back to focus mode manually
- let a short timer finish and verify automatic session transition
- verify notification appears
- verify tray start/pause/reset commands
- verify tray mode switching
- enable and disable follow mode
- use `CommandOrControl+Shift+X` to exit follow mode
- toggle always-on-top

**Step 4: Inspect final git diff**

Run: `git status --short && git diff --stat`
Expected: Only intended refactor files are modified.

**Step 5: Commit the final verification-only adjustments if needed**

```bash
git add .
git commit -m "chore: finalize codebase cleanup verification"
```

Only do this if manual verification required a tiny follow-up fix. Otherwise no commit is needed.
