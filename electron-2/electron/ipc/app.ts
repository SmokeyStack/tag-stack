import { dialog, ipcMain } from 'electron';

const appStartTime = new Date().toLocaleString();

export function registerIpcHandlers() {
    ipcMain.handle('app:get-start-time', () => {
        return appStartTime;
    });

    ipcMain.handle('dialog:open-files', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (result.canceled) return [];
        return result.filePaths;
    });
}
