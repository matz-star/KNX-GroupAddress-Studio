"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
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
