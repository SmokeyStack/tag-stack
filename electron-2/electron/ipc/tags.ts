import { ipcMain } from 'electron';
import { requireLibrary } from '../library/manager';
import { TAG_COLORS } from '../../shared/palette';
import { IpcChannels, type TagInput } from '../../shared/ipc';

function validateTagInput(input: unknown, partial: boolean): TagInput {
    if (typeof input !== 'object' || input === null)
        throw new Error('Tag input must be an object');

    const candidate = input as Record<string, unknown>;
    if (!partial || candidate.name !== undefined)
        if (typeof candidate.name !== 'string' || candidate.name.length === 0)
            throw new Error('Tag name must be a non-empty string');
    if (candidate.shorthand !== undefined && candidate.shorthand !== null)
        if (typeof candidate.shorthand !== 'string')
            throw new Error('Tag shorthand must be a string or null');
    if (candidate.color !== undefined && candidate.color !== null)
        if (
            typeof candidate.color !== 'string' ||
            !(candidate.color in TAG_COLORS)
        )
            throw new Error(`Unknown tag color: ${candidate.color}`);
    if (candidate.aliases !== undefined)
        if (
            !Array.isArray(candidate.aliases) ||
            !candidate.aliases.every(
                (alias) => typeof alias === 'string' && alias.length > 0
            )
        )
            throw new Error(
                'Tag aliases must be an array of non-empty strings'
            );
    return candidate as unknown as TagInput;
}
export function registerTagHandlers(): void {
    ipcMain.handle(IpcChannels.listTags, () => {
        return requireLibrary().tags.list();
    });
    ipcMain.handle(IpcChannels.createTag, (_event, input: unknown) => {
        const validated = validateTagInput(input, false);
        return requireLibrary().tags.create(validated);
    });
    ipcMain.handle(
        IpcChannels.updateTag,
        (_event, id: unknown, patch: unknown) => {
            if (!Number.isInteger(id))
                throw new Error(`Tag id must be an integer: ${id}`);

            const validated = validateTagInput(patch, true);
            return requireLibrary().tags.update(id as number, validated);
        }
    );
    ipcMain.handle(IpcChannels.deleteTag, (_event, id: unknown) => {
        if (!Number.isInteger(id))
            throw new Error(`Tag id must be an integer: ${id}`);

        requireLibrary().tags.remove(id as number);
    });
}
