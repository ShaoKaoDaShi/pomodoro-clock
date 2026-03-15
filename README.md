# Pomodoro Clock (番茄时钟)

A desktop Pomodoro timer built with **Electron**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It focuses on fast session control, a clean always-available timer window, and lightweight desktop integrations such as notifications and Follow Mouse Mode. For implementation guidance and architecture rationale, see `AGENTS.md` and `DESIGN.md`.

## 📸 Screenshots

| Main Interface (Focus Mode) | Break Mode | Follow Mouse Mode |
|:---------------------------:|:----------:|:-----------------:|
| ![Main Interface](./screenshots/focus-mode.png) | ![Break Mode](./screenshots/break-mode.png) | ![Follow Mouse](./screenshots/follow-mode.png) |

## ✨ What It Does

- Run customizable Focus and Break sessions.
- Switch between the main desktop window and Follow Mouse Mode.
- Keep the timer above other apps with always-on-top support.
- Show native notifications when sessions change.
- Play generated completion sounds without bundling external audio assets.

## ⌨️ Shortcuts

- `CommandOrControl+Shift+X`: Exit Follow Mouse Mode and restore the main window.

## 🛠 Tech Stack

- **Electron** for the desktop shell and native window behavior.
- **React 19** for the renderer UI.
- **TypeScript** for typed application logic.
- **Tailwind CSS v4** for styling.
- **Vite** for development and production builds.

## 🚀 Getting Started

### Prerequisites

Install **Node.js** and **pnpm** before working with the project.

### Install

```bash
git clone git@github.com:ShaoKaoDaShi/pomodoro-clock.git
cd pomodoro-clock
pnpm install
```

### Develop

```bash
pnpm dev
```

This starts the Vite dev server and launches the Electron app.

### Build

```bash
pnpm build
```

This runs the repository build pipeline and produces packaged desktop artifacts in `release/`.

### Release

```bash
pnpm release
```

`pnpm release` runs the repository's release script, which bumps the patch version with `npm version patch`, then pushes the branch and tags. Use it only when you are ready to publish a new version from a clean, reviewed branch.

For CI or publish-oriented packaging, use:

```bash
pnpm release:ci
```

## 📂 Project Structure

Source layout:

- `electron/`: Main Process code, window lifecycle, shortcuts, and IPC handlers.
- `src/components/`: renderer components such as timer display, controls, and settings.
- `src/hooks/`: reusable hooks for timer state and window control behavior.
- `src/constants/`: shared constants such as theme-related values.
- `src/types/`: shared TypeScript interfaces and type definitions.
- `src/utils/`: small utilities such as time-formatting helpers.

Generated output:

- `dist/`: Built renderer assets.
- `dist-electron/`: Built Electron main and preload files.
- `release/`: Packaged application artifacts.

## 🗺 Documentation Map

- `AGENTS.md`: Maintainer and coding-agent guidance, including architecture-relevant files, workflow constraints, and verification expectations.
- `DESIGN.md`: Architecture rationale, interaction principles, and responsibility boundaries without repeating setup instructions.

## 📄 License

[MIT](LICENSE)
