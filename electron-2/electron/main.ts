import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc/app';

process.env.APP_ROOT = path.join(__dirname, '..');
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, '.output/public');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        center: true,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(MAIN_DIST, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            devTools: !app.isPackaged,
            spellcheck: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (process.env.VITE_DEV_SERVER_URL)
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    else mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
