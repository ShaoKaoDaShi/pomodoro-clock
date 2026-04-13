import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  Tray,
} from "electron";
import path from "path";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

interface TimerUpdatePayload {
  timeLeft: number;
  isWorkSession: boolean;
  isRunning: boolean;
  endTime: number | null;
}

interface NotificationPayload {
  title: string;
  body: string;
}

interface ResizePayload {
  width: number;
  height: number;
}

let mainWindow: BrowserWindow | null = null;
let followWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let followTimer: NodeJS.Timeout | null = null;
let mainTimer: NodeJS.Timeout | null = null;
let isWorkSession = true;

function supportsOpenAtLogin(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

function getOpenAtLoginEnabled(): boolean {
  if (!supportsOpenAtLogin()) {
    return false;
  }

  return app.getLoginItemSettings().openAtLogin;
}

function setOpenAtLoginEnabled(flag: boolean): boolean {
  if (!supportsOpenAtLogin()) {
    return false;
  }

  app.setLoginItemSettings({ openAtLogin: flag });
  return getOpenAtLoginEnabled();
}

function getAppIconPath(): string {
  return path.join(
    __dirname,
    process.env.VITE_DEV_SERVER_URL ? "../public/icon.png" : "../dist/icon.png",
  );
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function getFollowWindow(): BrowserWindow | null {
  return followWindow && !followWindow.isDestroyed() ? followWindow : null;
}

function showMainWindow(): void {
  const window = getMainWindow();
  if (!window) {
    createMainWindow();
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
}

function notifyFollowModeChanged(isActive: boolean): void {
  const window = getMainWindow();
  if (window) {
    window.webContents.send("follow-mode-changed", isActive);
  }
}

function stopFollowTimer(): void {
  if (followTimer) {
    clearInterval(followTimer);
    followTimer = null;
  }
}

function startFollowTimer(): void {
  stopFollowTimer();

  followTimer = setInterval(() => {
    const window = getFollowWindow();
    if (!window) {
      stopFollowTimer();
      return;
    }

    const point = screen.getCursorScreenPoint();
    window.setPosition(point.x + 15, point.y + 15);
  }, 16);
}

function stopMainTimerCheck(): void {
  if (mainTimer) {
    clearTimeout(mainTimer);
    mainTimer = null;
  }
}

function startMainTimerCheck(durationMs: number): void {
  stopMainTimerCheck();
  mainTimer = setTimeout(() => {
    const window = getMainWindow();
    if (window) {
      window.webContents.send("timer-finished-check");
    }
  }, durationMs);
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
    title: "番茄时钟",
    icon: getAppIconPath(),
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  window.once("ready-to-show", () => {
    window.show();
    createFollowWindow();
  });

  mainWindow = window;
  return window;
}

function createFollowWindow(): void {
  const existingWindow = getFollowWindow();
  if (existingWindow) {
    existingWindow.focus();
    return;
  }

  const window = new BrowserWindow({
    width: 100,
    height: 40,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setAlwaysOnTop(true, "screen-saver");
  window.setIgnoreMouseEvents(true);

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(`${process.env.VITE_DEV_SERVER_URL}#follow`);
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "follow",
    });
  }

  window.on("closed", () => {
    followWindow = null;
    stopFollowTimer();
    notifyFollowModeChanged(false);
  });

  followWindow = window;
  startFollowTimer();
  notifyFollowModeChanged(true);
}

function closeFollowWindow(): void {
  const window = getFollowWindow();
  if (window) {
    window.close();
  }

  followWindow = null;
  stopFollowTimer();
  notifyFollowModeChanged(false);
}

function sendToMainWindow(channel: string, payload?: unknown): void {
  const window = getMainWindow();
  if (!window) {
    return;
  }

  if (typeof payload === "undefined") {
    window.webContents.send(channel);
    return;
  }

  window.webContents.send(channel, payload);
}

function updateTrayMenu(): void {
  if (!tray) {
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => showMainWindow(),
    },
    { type: "separator" },
    {
      label: "专注模式",
      type: "radio",
      checked: isWorkSession,
      click: () => sendToMainWindow("switch-mode", "work"),
    },
    {
      label: "休息模式",
      type: "radio",
      checked: !isWorkSession,
      click: () => sendToMainWindow("switch-mode", "break"),
    },
    { type: "separator" },
    {
      label: "开始计时",
      click: () => sendToMainWindow("start-timer"),
    },
    {
      label: "暂停计时",
      click: () => sendToMainWindow("pause-timer"),
    },
    {
      label: "重置计时",
      click: () => sendToMainWindow("reset-timer"),
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray(): void {
  const icon = nativeImage.createFromPath(getAppIconPath());
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("番茄时钟");
  updateTrayMenu();
  tray.on("double-click", () => showMainWindow());
}

function showNotification({ title, body }: NotificationPayload): void {
  const notification = new Notification({ title, body });
  notification.on("click", () => showMainWindow());
  notification.show();
}

function registerIpcHandlers(): void {
  ipcMain.on("start-follow-mouse", () => {
    createFollowWindow();
  });

  ipcMain.on("check-follow-status", (event) => {
    event.sender.send("follow-mode-changed", Boolean(getFollowWindow()));
  });

  ipcMain.on("stop-follow-mouse", () => {
    closeFollowWindow();
  });

  ipcMain.on("timer-update", (_event, state: TimerUpdatePayload) => {
    const window = getFollowWindow();
    if (window) {
      window.webContents.send("timer-update", state);
    }

    if (state.isWorkSession !== isWorkSession) {
      isWorkSession = state.isWorkSession;
      updateTrayMenu();
    }
  });

  ipcMain.on("request-timer-state", () => {
    sendToMainWindow("request-timer-state");
  });

  ipcMain.on("start-timer-check", (_event, durationMs: number) => {
    startMainTimerCheck(durationMs);
  });

  ipcMain.on("stop-timer-check", () => {
    stopMainTimerCheck();
  });

  ipcMain.on("show-notification", (_event, payload: NotificationPayload) => {
    showNotification(payload);
  });

  ipcMain.on("toggle-always-on-top", (_event, flag: boolean) => {
    const window = getMainWindow();
    if (window) {
      window.setAlwaysOnTop(flag);
    }
  });

  ipcMain.on("request-open-at-login", (event) => {
    event.sender.send("open-at-login-changed", getOpenAtLoginEnabled());
  });

  ipcMain.on("toggle-open-at-login", (event, flag: boolean) => {
    event.sender.send("open-at-login-changed", setOpenAtLoginEnabled(flag));
  });

  ipcMain.on("resize-window", (_event, { width, height }: ResizePayload) => {
    const window = getMainWindow();
    if (window) {
      window.setSize(width, height, true);
    }
  });
}

function registerGlobalShortcuts(): void {
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    closeFollowWindow();
    showMainWindow();
  });
}

function registerAppLifecycle(): void {
  if (process.platform === "win32") {
    app.setAppUserModelId(app.name);
  }

  app.whenReady().then(() => {
    createMainWindow();
    createTray();
    registerGlobalShortcuts();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    stopFollowTimer();
    stopMainTimerCheck();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

registerIpcHandlers();
registerAppLifecycle();
