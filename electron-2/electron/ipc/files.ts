import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PathManager } from '../security/paths';
import { IMAGE_FILE_REGEX, IpcChannels, type FileData } from '../../shared/ipc';

export function registerFileHandlers(): void {
    ipcMain.handle(IpcChannels.openDirectoryDialog, async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        const result = await dialog.showOpenDialog(window!, {
            properties: ['openDirectory']
        });
        if (result.canceled) return null;

        const directory = path.resolve(result.filePaths[0]);
        PathManager.grantPath(directory);
        return directory;
    });

    ipcMain.handle(
        IpcChannels.listDirectory,
        async (_event, directory: unknown) => {
            if (
                typeof directory !== 'string' ||
                !PathManager.isGrantedPath(directory)
            )
                throw new Error(
                    `Directory has not been granted access: ${directory}`
                );

            const entries = await fs.readdir(directory, {
                withFileTypes: true
            });
            const imageEntries = entries.filter(
                (entry) => entry.isFile() && IMAGE_FILE_REGEX.test(entry.name)
            );
            const results = await Promise.allSettled(
                imageEntries.map(async (entry): Promise<FileData> => {
                    const filePath = path.join(directory, entry.name);
                    const stats = await fs.stat(filePath);
                    return {
                        path: filePath,
                        size: stats.size
                    };
                })
            );
            const files: FileData[] = [];
            for (const result of results)
                if (result.status === 'fulfilled') files.push(result.value);

            return files;
        }
    );
}
