import { ipcMain } from 'electron';
import path from 'node:path';
import { requireLibrary } from '../library/manager';
import { IpcChannels, type Entry } from '../../shared/ipc';

export function registerEntryHandlers(): void {
    ipcMain.handle(IpcChannels.listEntries, () => {
        const lib = requireLibrary();
        const entries: Entry[] = lib.entries.list().map((row) => ({
            id: row.id,
            path: row.path,
            filename: row.filename,
            size: row.size,
            absolutePath: path.join(lib.root, row.path),
            tagIds: row.tagIds
        }));
        return entries;
    });
    ipcMain.handle(
        IpcChannels.assignTag,
        (_event, entryId: unknown, tagId: unknown) => {
            if (!Number.isInteger(entryId))
                throw new Error(`Entry id must be an integer: ${entryId}`);
            if (!Number.isInteger(tagId))
                throw new Error(`Tag id must be an integer: ${tagId}`);

            requireLibrary().entries.assignTag(
                entryId as number,
                tagId as number
            );
        }
    );
    ipcMain.handle(
        IpcChannels.unassignTag,
        (_event, entryId: unknown, tagId: unknown) => {
            if (!Number.isInteger(entryId))
                throw new Error(`Entry id must be an integer: ${entryId}`);
            if (!Number.isInteger(tagId))
                throw new Error(`Tag id must be an integer: ${tagId}`);

            requireLibrary().entries.unassignTag(
                entryId as number,
                tagId as number
            );
        }
    );
}
