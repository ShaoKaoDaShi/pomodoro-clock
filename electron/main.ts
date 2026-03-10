import { app, BrowserWindow, Notification, ipcMain, screen, globalShortcut } from 'electron';
import path from 'path';

// Disable security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let win: BrowserWindow | null = null;

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
      preload: path.join(__dirname, 'preload.js'),
    },
    title: "番茄时钟",
    icon: path.join(__dirname, process.env.VITE_DEV_SERVER_URL ? '../public/icon.png' : '../dist/icon.png'),
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html');
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 注册退出跟随模式的快捷键
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    if (win) {
      win.webContents.send('stop-follow-mouse');
      
      // 恢复窗口状态
      win.setVisibleOnAllWorkspaces(false);
      win.setIgnoreMouseEvents(false);
      win.setAlwaysOnTop(false);
      win.setSize(400, 500);
      win.center();
      
      // 停止位置更新定时器（如果有）
      if ((win as any).followTimer) {
        clearInterval((win as any).followTimer);
        (win as any).followTimer = null;
      }
    }
  });
}

// 监听跟随鼠标模式开启
ipcMain.on('start-follow-mouse', (event) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;

  // 缩小窗口并设置置顶
  win.setSize(100, 40);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(true, 'screen-saver'); // 更高优先级的置顶
  win.setIgnoreMouseEvents(true); // 忽略鼠标事件

  // 启动定时器跟随鼠标
  if ((win as any).followTimer) clearInterval((win as any).followTimer);
  
  (win as any).followTimer = setInterval(() => {
    const point = screen.getCursorScreenPoint();
    // 偏移一点，避免遮挡鼠标焦点
    win.setPosition(point.x + 15, point.y + 15);
  }, 16); // ~60fps
});

// 监听渲染进程发送的通知请求
ipcMain.on('show-notification', (event, { title, body }) => {
  const notification = new Notification({ title, body });
  notification.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  notification.show();
});

// 监听“总在最前”切换请求
ipcMain.on('toggle-always-on-top', (event, flag) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.setAlwaysOnTop(flag);
  }
});

// 确保 Windows 系统下设置正确的 App User Model ID
if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
