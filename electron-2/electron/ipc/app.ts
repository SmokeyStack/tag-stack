import { registerEntryHandlers } from './entries';
import { registerFileHandlers } from './files';
import { registerLibraryHandlers } from './library';
import { registerTagHandlers } from './tags';

export function registerIpcHandlers() {
    registerFileHandlers();
    registerLibraryHandlers();
    registerTagHandlers();
    registerEntryHandlers();
}
