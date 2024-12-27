import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';

process.env.APP_ROOT = path.join(__dirname, '..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, '.output/public');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST;

function createWindow() {
    const window = new BrowserWindow({
        width: 1920,
        height: 1080,
        center: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(MAIN_DIST, 'preload.js'),
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        window.loadURL(process.env.VITE_DEV_SERVER_URL);
        // window.webContents.openDevTools();
    } else {
        window.loadFile(path.join(process.env.VITE_PUBLIC!, 'index.html'));
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
    ipcMain.handle('app-start-time', () => new Date().toLocaleString());
    ipcMain.handle('open-file-dialog', async () => {
        const files = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return files.filePaths;
    });
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
