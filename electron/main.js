// electron/main.js
// Electron main process: creates the desktop application window.
// Supports:
// 1. Local Development (default): loads http://localhost:5173
// 2. Packaged / Production: loads local dist/index.html
// 3. Hosted Web Mode: set CAMPUSFIND_WEB_URL (e.g. your Vercel URL) to load hosted web directly

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: 'CampusFind — Smart Lost and Found',
    backgroundColor: '#F9FAFB',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Optional: Connect desktop window directly to hosted web app if configured
  if (process.env.CAMPUSFIND_WEB_URL) {
    console.log(`Electron loading hosted web URL: ${process.env.CAMPUSFIND_WEB_URL}`);
    mainWindow.loadURL(process.env.CAMPUSFIND_WEB_URL);
    return;
  }

  // Local development mode: connect to local Vite dev server
  const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../frontend/dist/index.html');

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to local production build if dev server is not active
      mainWindow.loadFile(prodPath);
    });
  } else {
    mainWindow.loadFile(prodPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
