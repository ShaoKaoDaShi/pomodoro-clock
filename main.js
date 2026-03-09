const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // For simplicity in this demo, usually better to set true and use preload
    },
    title: "番茄时钟",
    // icon: path.join(__dirname, 'icon.png') // 如果有图标的话
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools(); // 开发调试用
}

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
