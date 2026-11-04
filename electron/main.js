// electron/main.js
// Electron main process: creates the desktop application window.

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

  // In development, load from Vite dev server. If built, load index.html.
  const devUrl = 'http://localhost:5173';
  const prodPath = path.join(__dirname, '../frontend/dist/index.html');

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to prod build if dev server is not up
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

