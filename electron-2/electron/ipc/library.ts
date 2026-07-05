import { BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import {
    closeLibrary,
    getLibraryInfo,
    openLibraryAt
} from '../library/manager';
import { IpcChannels } from '../../shared/ipc';

export function registerLibraryHandlers(): void {
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
        return openLibraryAt(path.resolve(result.filePaths[0]));
    });
    ipcMain.handle(IpcChannels.closeLibrary, () => {
        closeLibrary();
    });
    ipcMain.handle(IpcChannels.currentLibrary, () => {
        return getLibraryInfo();
    });
}
