# Design

This document explains why the Pomodoro Clock is built the way it is and how the current architecture supports that product intent. It focuses on interaction goals, timer behavior, process boundaries, and synchronization responsibilities rather than setup or build workflow. For repository workflow and file-level maintenance guidance, see `AGENTS.md`.

## Design Goals

The app aims to be a lightweight focus companion rather than a general task manager. The product scope stays intentionally narrow: help the user enter a Focus or Break session quickly, keep the timer visible when needed, and reduce friction around switching contexts.

Three goals shape the design:

- Minimal distraction: the main window removes standard window chrome and keeps the screen centered on the active timer state.
- Emotional clarity: Focus and Break sessions feel different through color, copy, and motion so the user can read the current mode at a glance.
- Ambient availability: the timer should remain easy to check without requiring the full control window to stay front and center, mainly through always-on-top support and the lightweight follow window.

That combination is why the app prefers a polished single-purpose interface over feature breadth. It is designed to feel present, calm, and immediate.

## Interaction and Visual Principles

The renderer keeps the interaction model simple and mode-aware.

- The primary view is a frameless card with a large timer, direct session switcher, start/pause/reset controls, and a compact settings area.
- Focus and Break sessions use different visual themes so the user can read intent from color alone: warmer energy for focus, cooler calm for rest.
- The timer uses tabular numerals and high contrast sizing so the countdown remains legible and visually stable.
- Transitions are subtle and supportive. The interface uses smooth color and layout changes to make mode changes feel deliberate without turning the app into an animation-heavy experience.
- Follow Mouse Mode strips the UI down further. The design becomes a tiny translucent capsule that surfaces only time and a short status label.

The result is a UI that prioritizes immediate comprehension. Full controls are available in the main window, while secondary or ambient states intentionally remove unnecessary elements.

## Pomodoro Business Rules

The timer model is intentionally small and predictable.

- A session is always either `work` or `break` internally, corresponding to the user-facing Focus and Break modes.
- The user can configure Focus and Break durations independently.
- Duration changes apply to the visible timer only while the timer is not running.
- Starting a session begins a countdown from the current `timeLeft` value.
- Pausing preserves the remaining time.
- Resetting stops the current session and restores the default duration for the current mode.
- Switching modes stops any active countdown and loads the configured duration for the selected mode.
- When a Focus session finishes, the app plays a completion sound, sends a native notification, switches to Break mode, and seeds the next session with the configured break duration.
- When a Break session finishes, the app plays a different completion sound, sends a native notification, switches back to Focus mode, and seeds the next session with the configured work duration.

These rules deliberately avoid more advanced Pomodoro conventions such as long breaks, task tracking, streak systems, or historical analytics. The current product favors immediacy over policy complexity.

## Renderer Architecture

The Renderer Process is organized so that `src/App.tsx` is mostly a composition layer, with a small amount of remaining view-adjacent helper logic.

`App.tsx` determines whether the current window is the full interface or the follow window, wires together the hooks, derives presentation-friendly values such as formatted time, status text, and class names, and passes state and callbacks into presentational components. It also still owns a few renderer-side helpers for audio playback, notification requests, and simple view-specific derivations.

Most stateful behavior is split into focused hooks:

- `usePomodoroTimer` owns timer state and business logic. It manages `timeLeft`, running state, session mode, configured durations, the active interval, and the absolute end timestamp used for drift-resistant countdown updates.
- `useTimerSync` owns synchronization and command routing between windows and the main process. It broadcasts authoritative timer state from the main window, answers state requests from the follow window, handles tray or main-process commands, and keeps the follow window visually current while a session is running.
- `useWindowControls` owns window-related renderer behavior such as follow-mode toggling, always-on-top toggling for the main window, follow-mode status tracking, and resize reporting for the frameless main window.

Presentational components stay narrower in scope: mode switching, time display, transport controls, and settings UI. This separation keeps timer behavior out of the view tree and prevents `App.tsx` from becoming a monolith again.

## Main-Process Architecture

The Main Process is intentionally helper-oriented inside `electron/main.ts`.

Instead of concentrating all behavior in one large boot function, the file separates native-window, tray, notification, shortcut, IPC, and lifecycle concerns into small helpers.

This structure reflects the Main Process role in the app: it does not own the countdown rules or session-transition logic, but it does own native capabilities and window lifecycle. The Renderer Process decides how Pomodoro state changes, while the Main Process decides how windows, notifications, shortcuts, and tray interactions behave on the desktop.

There are still a few pragmatic exceptions worth noting. The tray keeps its own lightweight `isWorkSession` copy so the radio menu can reflect the latest reported mode, and startup currently creates the follow window eagerly once the main window is ready. Those details make the implementation slightly less pure than the ideal layering, but they match the current runtime behavior.

The current design also uses two BrowserWindow instances when the follow window is present: the main window for the complete UI and a separate lightweight follow window for the ambient capsule view.

## IPC and Synchronization Model

Timer synchronization is built around clear state ownership.

The main renderer window is the source of truth for timer state. It owns the mutable countdown state, configured durations, session transitions, and timer completion behavior through `usePomodoroTimer`. The main process does not calculate remaining time or decide session changes.

IPC responsibilities are divided as follows:

- Main renderer -> main process: send timer snapshots, request native notifications, start or stop follow mode, toggle always-on-top, report size changes, and schedule or cancel the timer-finished safety timeout.
- Main process -> follow renderer: forward timer snapshots so the follow window can mirror the current state.
- Follow renderer -> main process: request the latest timer snapshot when the follow window mounts.
- Main process -> main renderer: forward tray and shortcut commands such as start, pause, reset, switch mode, and the timer-finished safety event.

The synchronization model uses both `timeLeft` and `endTime`, but they serve different purposes. `timeLeft` is the latest displayed value. `endTime` lets both windows derive remaining time from an absolute timestamp, which avoids visible drift when intervals do not fire exactly on schedule.

A separate Main Process timeout acts as a safety check for timer completion. The main window still owns completion logic, but the Main Process can send `timer-finished-check` after the expected duration so the Renderer Process can finalize the transition even if its own interval timing falls behind.

## Follow Mode Design

Follow Mouse Mode is designed as an ambient companion view, not just a resized version of the main interface, even though the current startup flow creates the follow window eagerly and then relies on renderer and Main Process state to make that extra window feel lightweight.

Renderer responsibilities:

- The follow window is detected through the `#follow` hash.
- `App.tsx` renders the same application tree, but the follow window uses a mini-mode presentation that hides controls and settings.
- `usePomodoroTimer` prevents the follow window from starting its own authoritative timer flow.
- `useTimerSync` requests state from the main window and then mirrors updates locally for display.

Main-process responsibilities:

- `createFollowWindow` creates a separate transparent, frameless, always-on-top window dedicated to follow mode.
- The follow window is excluded from the taskbar, visible across workspaces, and set to ignore mouse events so it does not block interaction with underlying apps.
- `startFollowTimer` continuously samples the cursor position and moves the follow window with a small offset so the timer remains nearby without covering the pointer.
- `closeFollowWindow`, lifecycle handlers, and the global shortcut keep follow-mode entry and exit recoverable.
- Follow-mode status is reported back to the main renderer so the main UI can reflect whether the feature is active.

This split matters because follow mode combines two very different concerns: renderer-side display simplification and main-process window orchestration. Neither side alone is sufficient.

## Notifications and Audio Feedback

Session completion feedback is intentionally multimodal.

The renderer plays a short synthesized tone using the Web Audio API rather than loading bundled audio assets. That keeps the implementation lightweight while still distinguishing work completion from break completion through different frequencies.

The renderer also asks the main process to show a native desktop notification. Native notifications are owned by the main process so they continue to use Electron's OS-level integration and can refocus the main window when clicked.

This design gives the app two different channels of feedback:

- immediate local sound for the moment the session flips
- system-level notification for cases where the user is looking elsewhere

Together they support the app's goal of staying helpful without requiring the window to remain front and center.

## Trade-offs and Non-Goals

The current architecture makes a few deliberate trade-offs.

- The Renderer Process owns timer logic, which keeps product behavior close to the React UI, but it also means synchronization must be handled explicitly across windows.
- The app uses a second BrowserWindow for Follow Mouse Mode instead of morphing the main window. That adds IPC complexity, but it produces a cleaner separation between full control UI and ambient display behavior.
- The Main Process keeps helper-based logic in a single file. This keeps the app easy to scan at its current size, even though a larger desktop app would likely split those helpers into multiple modules.
- The project currently favors implementation speed and local-content trust over hardened Electron isolation. That trade-off reduces boilerplate, but it keeps Renderer Process and preload boundaries weaker than a stricter Electron setup would.

The following items are intentionally out of scope for this design:

- onboarding, setup, or build instructions
- task lists, project planning, or historical reporting
- long-break cycles, habit systems, or productivity analytics
- cloud sync or cross-device state
- a generic multi-window workspace beyond the main window and follow capsule

The document should evolve when the architecture changes, but its purpose should stay constant: explain why the product works this way and where each responsibility currently lives.
