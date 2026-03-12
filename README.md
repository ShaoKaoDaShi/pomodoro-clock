# Pomodoro Clock (番茄时钟)

A modern, feature-rich Pomodoro timer desktop application built with Electron, React, TypeScript, and Tailwind CSS.

## Features

- **Standard Pomodoro Timer**: Customizable work and break sessions to boost productivity.
- **Follow Mouse Mode**: A unique mini-mode that follows your cursor, keeping the timer visible without being intrusive.
- **Always on Top**: Toggle the window to stay on top of other applications.
- **System Notifications**: Get notified when a session starts or ends.
- **Global Shortcuts**: 
  - `CommandOrControl+Shift+X`: Exit follow mouse mode.

## Tech Stack

- **Electron**: Cross-platform desktop application framework.
- **React**: UI library for building the interface.
- **TypeScript**: Static typing for better code quality and developer experience.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Vite**: Fast build tool and development server.

## Getting Started

### Prerequisites

Ensure you have Node.js and pnpm installed on your machine.

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd pomodoro-clock
pnpm install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
pnpm dev
```

This will launch both the Vite server and the Electron application.

### Build

Build the application for production:

```bash
pnpm build
```

This command runs type checks, bundles the code, and packages the application using `electron-builder`. The output files will be in the `release/` directory.

## Project Structure

- `electron/`: Main process code (window management, system events).
- `src/`: Renderer process code (React UI, timer logic).
- `dist/`: Bundled Renderer files.
- `dist-electron/`: Compiled Main process files.
- `release/`: Packaged application installers.

## License

[MIT](LICENSE)
