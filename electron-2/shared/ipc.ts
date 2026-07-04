export const MEDIA_SCHEME = 'app-media';

export const IpcChannels = {
    openDirectoryDialog: 'dialog:open-directory',
    listDirectory: 'files:list-directory'
} as const;
export interface FileData {
    path: string;
    size: number;
}
export interface ElectronApi {
    openDirectoryDialog(): Promise<string | null>;
    listDirectory(directory: string): Promise<FileData[]>;
}
export function toMediaUrl(filePath: string): string {
    const segments = filePath
        .replace(/\\/g, '/')
        .split('/')
        .map(encodeURIComponent)
        .join('/');
    return `${MEDIA_SCHEME}://local/${segments}`;
}
