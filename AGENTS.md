# AGENTS.md

## 1. Project Overview

This project is a **Pomodoro Clock** desktop application built with **Electron**, **React**, **TypeScript**, and **Tailwind CSS**.

### Architecture
The application follows the standard Electron multi-process architecture:

*   **Main Process** (`electron/`):
    *   Entry point: `electron/main.ts`.
    *   Responsibilities:
        *   Creating and managing the application window (`BrowserWindow`).
        *   Handling application lifecycle events.
        *   Managing global shortcuts (e.g., `CommandOrControl+Shift+X` to exit follow mode).
        *   Handling IPC events for system-level features:
            *   `start-follow-mouse`: Activates a mini-mode that follows the cursor.
            *   `stop-follow-mouse`: Restores the main window.
            *   `show-notification`: Displays native system notifications.
            *   `toggle-always-on-top`: Toggles window z-index behavior.

*   **Renderer Process** (`src/`):
    *   Entry point: `src/main.tsx`.
    *   Framework: **React** (v19) with TypeScript.
    *   Responsibilities:
        *   UI rendering and user interaction.
        *   Timer logic (Countdown, Work/Break sessions).
        *   Audio playback for timer completion.
        *   Communicating with the Main Process via `ipcRenderer`.

*   **Styling**:
    *   Uses **Tailwind CSS** (v4) configured via `@tailwindcss/vite`.
    *   Global styles defined in `src/style.css`.

## 2. Build & Commands

The project uses **pnpm** as the package manager.

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with Hot Module Replacement (HMR). Launches both Vite server and Electron app. |
| `pnpm build` | Performs a full production build. Runs `tsc` (type check), `vite build` (bundle), and `electron-builder` (package). |
| `pnpm preview` | Previews the production build locally. |

### Build Output
*   `dist/`: Contains the bundled Renderer process files.
*   `dist-electron/`: Contains the compiled Main process files.
*   `release/`: Contains the final packaged application installers (DMG, AppImage, Exe, etc.).

## 3. Code Style

*   **TypeScript**:
    *   Strict mode is enabled (`"strict": true` in `tsconfig.json`).
    *   Use explicit types for function parameters and return values where possible.
    *   Interfaces are preferred over Types for object definitions.

*   **React**:
    *   Use **Functional Components** with Hooks.
    *   State management is handled locally with `useState` and `useReducer` (if needed).
    *   Side effects are managed with `useEffect`.
    *   Avoid class components.

*   **Styling**:
    *   Use Tailwind utility classes directly in `className` props.
    *   Avoid inline styles unless dynamic values are required.

## 4. Testing

*   *Currently, there are no automated tests configured for this project.*
*   **Future Recommendations**:
    *   Unit Testing: Vitest + React Testing Library.
    *   E2E Testing: Playwright or Cypress (with Electron support).

## 5. Security

**Important Note**: The current configuration prioritizes development speed and simplicity over strict security isolation.

*   **Node Integration**: Enabled (`nodeIntegration: true`).
*   **Context Isolation**: Disabled (`contextIsolation: false`).
*   **Implication**: The Renderer process has direct access to Node.js APIs. While convenient for this specific app, this is generally discouraged for production applications loading remote content.
*   **Mitigation**: Since this app loads local content (`loadFile` or local dev server), the risk is reduced. However, future refactoring should aim to enable `contextIsolation` and use a `preload.js` script with `contextBridge` to expose only necessary APIs.

## 6. Configuration

*   **Vite**: Configured in `vite.config.ts`.
    *   Plugins: `vite-plugin-electron` (builds Main process), `vite-plugin-electron-renderer` (enables Node integration in Renderer), `@vitejs/plugin-react` (React HMR).
*   **TypeScript**: `tsconfig.json` handles both Main and Renderer process compilation settings.
*   **Electron Builder**: Configuration is located in the `build` section of `package.json`.
