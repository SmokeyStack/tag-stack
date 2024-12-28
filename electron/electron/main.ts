import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';

const APP_ROOT: string = path.join(__dirname, '..');
const MAIN_DIST: string = path.join(APP_ROOT, 'dist-electron');
const RENDERER_DIST: string = path.join(APP_ROOT, '.output/public');
const VITE_PUBLIC: string = process.env.VITE_DEV_SERVER_URL
    ? path.join(APP_ROOT, 'public')
    : RENDERER_DIST;

function createWindow(): void {
    const window_options: Electron.BrowserWindowConstructorOptions = {
        width: 1920,
        height: 1080,
        center: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(MAIN_DIST, 'preload.js'),
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    };
    const window: BrowserWindow = new BrowserWindow(window_options);
    const url: string =
        process.env.VITE_DEV_SERVER_URL || path.join(VITE_PUBLIC, 'index.html');
    window.loadURL(url);
}

async function handleFileDialog(): Promise<string[]> {
    const files: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    return files.filePaths;
}

function setupIPC(): void {
    ipcMain.handle('app-start-time', () => new Date().toLocaleString());
    ipcMain.handle('app-open-file-dialog', handleFileDialog);
}

function initialzeApp(): void {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.whenReady().then(() => {
        setupIPC();
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

initialzeApp();
