export interface Tag {
    id: number;
    name: string;
    shorthand: string;
    color: string;
}

export interface Entry {
    id: number;
    filename: string;
    path: string;
    fields?: Field[];
}

export interface Field {
    [key: string]: number[];
}

export interface FileData {
    file_path: string;
    file_size: string;
}

export interface TagStackImageData {
    id: number;
    url: string;
    width: number;
    height: number;
    is_square: boolean;
    directory: string;
    filename: string;
    extension: string;
    size: string;
}

interface IpcRenderer {
    on(channel: string, listener: (...args: any[]) => void): this;
    off(channel: string, listener: (...args: any[]) => void): this;
    send(channel: string, ...args: any[]): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
}

declare global {
    interface Window {
        ipcRenderer: IpcRenderer;
    }
}
