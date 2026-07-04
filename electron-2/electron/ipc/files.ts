import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IpcChannels, type FileData } from '../../shared/ipc';

const grantedPaths = new Set<string>();

export function isGrantedPath(target: string): boolean {
    const resolved = path.resolve(target);
    for (const root of grantedPaths)
        if (resolved === root || resolved.startsWith(root + path.sep))
            return true;

    return false;
}
export function registerFileHandlers(): void {
    ipcMain.handle(IpcChannels.openDirectoryDialog, async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showOpenDialog(window!, {
            properties: ['openDirectory']
        });
        if (result.canceled) return null;

        const directory = path.resolve(result.filePaths[0]);
        grantedPaths.add(directory);
        return directory;
    });

    ipcMain.handle(
        IpcChannels.listDirectory,
        async (_event, directory: unknown) => {
            if (typeof directory !== 'string' || !isGrantedPath(directory))
                throw new Error(
                    `Directory has not been granted access: ${directory}`
                );

            const entries = await fs.readdir(directory, {
                withFileTypes: true
            });
            const files: FileData[] = [];
            for (const entry of entries) {
                if (!entry.isFile() || !/\.(png|jpe?g|gif)$/i.test(entry.name))
                    // Temporary filter for images, eventually, I want to support all file types to be in parity with TagStudio...but that requires me learning ffmpeg to display videos, and I don't want to do that right now. So for now, just filter for images.
                    continue;

                const filePath = path.join(directory, entry.name);
                const stats = await fs.stat(filePath);
                files.push({
                    path: filePath,
                    size: stats.size
                });
            }

            return files;
        }
    );
}
