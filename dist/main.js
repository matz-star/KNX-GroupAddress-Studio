"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const promises_1 = __importDefault(require("fs/promises"));
const createWindow = () => {
    const window = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1100,
        minHeight: 720,
        autoHideMenuBar: true,
        backgroundColor: '#f3f7f4',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
        void electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    if (electron_is_dev_1.default) {
        void window.loadURL('http://localhost:3000');
        window.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        void window.loadFile(path_1.default.join(__dirname, '..', 'build', 'index.html'));
    }
};
// CSV export handler (works in dev + packaged)
electron_1.ipcMain.handle('export-ets6-csv', async (_event, csvContent) => {
    const { canceled, filePath } = await electron_1.dialog.showSaveDialog({
        title: 'Export ETS6 Tree CSV',
        defaultPath: 'ETS6-GroupAddress-Tree.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) {
        return { ok: false, canceled: true };
    }
    await promises_1.default.writeFile(filePath, csvContent, 'utf8');
    return { ok: true, canceled: false, filePath };
});
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
