import {
  app,
  BrowserWindow,
  Notification,
  ipcMain,
  screen,
  globalShortcut,
} from "electron";
import path from "path";

// Disable security warnings
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

let win: BrowserWindow | null = null;
let followWin: BrowserWindow | null = null;
let followTimer: NodeJS.Timeout | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    frame: false, // 移除边框
    transparent: true, // 开启透明
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this demo, usually better to set true and use preload
      preload: path.join(__dirname, "preload.js"),
    },
    title: "番茄时钟",
    icon: path.join(
      __dirname,
      process.env.VITE_DEV_SERVER_URL
        ? "../public/icon.png"
        : "../dist/icon.png",
    ),
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html');
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 注册退出跟随模式的快捷键
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    closeFollowWindow();

    // 确保主窗口可见（可选，如果本来就可见则无所谓）
    if (win) {
      win.focus();
    }
  });
}

function closeFollowWindow() {
  if (followWin) {
    followWin.close();
    followWin = null;
  }

  if (followTimer) {
    clearInterval(followTimer);
    followTimer = null;
  }

  // 通知主窗口状态变化
  if (win && !win.isDestroyed()) {
    win.webContents.send("follow-mode-changed", false);
  }
}

// 监听跟随鼠标模式开启
ipcMain.on("start-follow-mouse", (event) => {
  if (followWin) {
    followWin.focus();
    return;
  }

  followWin = new BrowserWindow({
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

  followWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  followWin.setAlwaysOnTop(true, "screen-saver");
  followWin.setIgnoreMouseEvents(true);

  if (process.env.VITE_DEV_SERVER_URL) {
    followWin.loadURL(process.env.VITE_DEV_SERVER_URL + "#follow");
  } else {
    followWin.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "follow",
    });
  }

  // 启动定时器跟随鼠标
  if (followTimer) clearInterval(followTimer);

  followTimer = setInterval(() => {
    if (!followWin || followWin.isDestroyed()) {
      if (followTimer) clearInterval(followTimer);
      return;
    }
    const point = screen.getCursorScreenPoint();
    // 偏移一点，避免遮挡鼠标焦点
    followWin.setPosition(point.x + 15, point.y + 15);
  }, 16); // ~60fps

  followWin.on("closed", () => {
    followWin = null;
    if (followTimer) {
      clearInterval(followTimer);
      followTimer = null;
    }
    // 通知主窗口状态变化
    if (win && !win.isDestroyed()) {
      win.webContents.send("follow-mode-changed", false);
    }
  });

  // 通知主窗口状态变化
  if (win && !win.isDestroyed()) {
    win.webContents.send("follow-mode-changed", true);
  }
});

// 监听跟随鼠标模式关闭
ipcMain.on("stop-follow-mouse", () => {
  closeFollowWindow();
});

ipcMain.on("timer-update", (event, state) => {
  // 如果是主窗口发来的更新，转发给跟随窗口
  if (followWin && !followWin.isDestroyed()) {
    followWin.webContents.send("timer-update", state);
  }
});

ipcMain.on("request-timer-state", (event) => {
  // 跟随窗口请求状态，转发给主窗口
  if (win && !win.isDestroyed()) {
    win.webContents.send("request-timer-state");
  }
});

// 监听渲染进程发送的通知请求
ipcMain.on("show-notification", (event, { title, body }) => {
  const notification = new Notification({ title, body });
  notification.on("click", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  notification.show();
});

// 监听“总在最前”切换请求
ipcMain.on("toggle-always-on-top", (event, flag) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.setAlwaysOnTop(flag);
  }
});

// 确保 Windows 系统下设置正确的 App User Model ID
if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
