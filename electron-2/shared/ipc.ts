export const MEDIA_SCHEME = 'app-media';

export const IpcChannels = {
    openDirectoryDialog: 'dialog:open-directory',
    listDirectory: 'files:list-directory',
    createLibrary: 'library:create',
    closeLibrary: 'library:close',
    currentLibrary: 'library:current',
    openLibrary: 'library:open',
    recentLibraries: 'library:recent',
    removeRecentLibrary: 'library:remove-recent',
    rescanLibrary: 'library:rescan',
    listTags: 'tags:list',
    createTag: 'tags:create',
    updateTag: 'tags:update',
    deleteTag: 'tags:delete',
    listEntries: 'entries:list',
    assignTag: 'entries:assign-tag',
    unassignTag: 'entries:unassign-tag'
} as const;
// Temporary filter for images, eventually, I want to support all file types to be in parity with TagStudio...but that requires me learning ffmpeg to display videos, and I don't want to do that right now. So for now, just filter for images.
export const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif)$/i;
export interface FileData {
    path: string;
    size: number;
}
export interface LibraryInfo {
    root: string;
    name: string;
    entryCount: number;
}
export interface RecentLibrary {
    root: string;
    name: string;
    lastOpenedAt: number;
}
export interface RescanResult {
    added: number;
    removed: number;
    updated: number;
}
export interface Tag {
    id: number;
    name: string;
    shorthand: string | null;
    color: string | null;
    aliases: string[];
}
export interface TagInput {
    name: string;
    shorthand?: string | null;
    color?: string | null;
    aliases?: string[];
}
export interface Entry {
    id: number;
    path: string;
    filename: string;
    size: number | null;
    absolutePath: string;
    tagIds: number[];
}
export interface ElectronApi {
    openDirectoryDialog(): Promise<string | null>;
    listDirectory(directory: string): Promise<FileData[]>;
    createLibrary(): Promise<LibraryInfo | null>;
    closeLibrary(): Promise<void>;
    currentLibrary(): Promise<LibraryInfo | null>;
    openLibrary(root: string): Promise<LibraryInfo>;
    recentLibraries(): Promise<RecentLibrary[]>;
    removeRecentLibrary(root: string): Promise<void>;
    rescanLibrary(): Promise<RescanResult>;
    listTags(): Promise<Tag[]>;
    createTag(input: TagInput): Promise<Tag>;
    updateTag(id: number, patch: Partial<TagInput>): Promise<Tag>;
    deleteTag(id: number): Promise<void>;
    listEntries(): Promise<Entry[]>;
    assignTag(entryId: number, tagId: number): Promise<void>;
    unassignTag(entryId: number, tagId: number): Promise<void>;
}
export function toMediaUrl(filePath: string): string {
    const segments = filePath
        .replace(/\\/g, '/')
        .split('/')
        .map(encodeURIComponent)
        .join('/');
    return `${MEDIA_SCHEME}://local/${segments}`;
}
