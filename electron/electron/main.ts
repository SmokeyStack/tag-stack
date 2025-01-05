import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
const sqlite3 = require('sqlite3');
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
function openUrl(url: string): void {
    shell.openExternal(url);
}
function sqliteOperations(action: any, sql: any, params = []) {
    const db = new sqlite3.Database('tags.db');
    return new Promise((resolve, reject) => {
        const callback = (err: any, result: unknown) => {
            if (err) reject(err);
            else resolve(result);
        };

        switch (action) {
            case 'run':
                db.run(sql, params, function (err: any) {
                    // @ts-ignore
                    callback(err, { id: this.lastID, changes: this.changes });
                });
                break;
            case 'get':
                db.get(sql, params, callback);
                break;
            case 'each':
                console.log('Verifying insertion for:', sql);
                const output: any[] = [];
                db.each(
                    sql,
                    (err: any, row: any) => {
                        if (err) reject(err);
                        else output.push(row);
                    },
                    (err: any) => {
                        if (err) reject(err);
                        else callback(null, output); // Resolve with the collected rows
                    }
                );
                break;
            case 'all':
                db.all(sql, params, callback);
                break;
            default:
                reject(new Error('Unknown action'));
        }
        db.close();
    });
}
function setupIPC(): void {
    ipcMain.handle('app-open-file-dialog', handleFileDialog);
    ipcMain.handle('app-open-url', (_, url: string) => openUrl(url));
    ipcMain.handle('sqlite-operations', (_, action, sql, params) =>
        sqliteOperations(action, sql, params)
    );
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
