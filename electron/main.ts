import path from 'path';
import { app, BrowserWindow, shell, dialog, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import fs from 'fs/promises';

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#f3f7f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void window.loadURL('http://localhost:3000');
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
};

// CSV export handler (works in dev + packaged)
ipcMain.handle('export-ets6-csv', async (_event, csvContent: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export ETS6 Tree CSV',
    defaultPath: 'ETS6-GroupAddress-Tree.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });

  if (canceled || !filePath) {
    return { ok: false, canceled: true };
  }

  await fs.writeFile(filePath, csvContent, 'utf8');
  return { ok: true, canceled: false, filePath };
});

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