# Mobile Development Guide

This project has been extended to support mobile platforms (Android & iOS) using [Capacitor](https://capacitorjs.com/).

## Prerequisites

- **Node.js** & **pnpm**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## Project Structure

- `android/`: Native Android project.
- `ios/`: Native iOS project.
- `src/services/platform.ts`: Abstraction layer for handling Electron vs Mobile logic.

## Building for Mobile

1.  **Build the Web Assets**:

    ```bash
    pnpm build:web
    ```

    This command compiles the React application into the `dist/` directory, excluding Electron-specific code.

2.  **Sync with Native Projects**:

    ```bash
    npx cap sync
    ```

    This copies the `dist/` folder and any Capacitor plugins to the `android/` and `ios/` directories.

3.  **Run on Device/Emulator**:
    - **Android**:

      ```bash
      npx cap open android
      ```

      This opens Android Studio. From there, run the app on an emulator or connected device.

    - **iOS**:
      ```bash
      npx cap open ios
      ```
      This opens Xcode. From there, run the app on a Simulator or connected iPhone.

## Platform Specifics

- **Notifications**: Uses `@capacitor/local-notifications` on mobile and Electron IPC on desktop.
- **Layout**: The app automatically detects if it's running natively and switches to a full-screen layout, hiding desktop-specific controls (like "Always on Top" and "Follow Mouse").
