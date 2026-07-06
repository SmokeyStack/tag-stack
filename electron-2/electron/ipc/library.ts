import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
    closeLibrary,
    getLibraryInfo,
    openLibraryAt,
    scanAndReconcile
} from '../library/manager';
import { makeRecentStore } from '../library/recent';
import { IpcChannels } from '../../shared/ipc';

export function registerLibraryHandlers(): void {
    const recent = makeRecentStore(
        path.join(app.getPath('userData'), 'recent-libraries.json')
    );
    ipcMain.handle(IpcChannels.createLibrary, async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = window
            ? await dialog.showOpenDialog(window, {
                  properties: ['openDirectory', 'createDirectory']
              })
            : await dialog.showOpenDialog({
                  properties: ['openDirectory', 'createDirectory']
              });
        if (result.canceled) return null;

        const info = await openLibraryAt(path.resolve(result.filePaths[0]));
        await recent.touch(info.root);
        return info;
    });
    ipcMain.handle(IpcChannels.closeLibrary, () => {
        closeLibrary();
    });
    ipcMain.handle(IpcChannels.currentLibrary, () => {
        return getLibraryInfo();
    });
    ipcMain.handle(IpcChannels.openLibrary, async (_event, root: unknown) => {
        if (typeof root !== 'string' || !(await recent.has(root)))
            throw new Error(`Not a known library: ${root}`);

        try {
            await fs.access(path.join(root, '.tagstack', 'library.db'));
        } catch {
            await recent.remove(root);
            throw new Error(`Library no longer exists at: ${root}`);
        }

        const info = await openLibraryAt(root);
        await recent.touch(root);
        return info;
    });
    ipcMain.handle(IpcChannels.recentLibraries, () => {
        return recent.list();
    });
    ipcMain.handle(
        IpcChannels.removeRecentLibrary,
        async (_event, root: unknown) => {
            if (typeof root !== 'string')
                throw new Error(`Library root must be a string: ${root}`);

            await recent.remove(root);
        }
    );
    ipcMain.handle(IpcChannels.rescanLibrary, () => {
        return scanAndReconcile();
    });
}
