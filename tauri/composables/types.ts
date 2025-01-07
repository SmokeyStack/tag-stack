export interface Tag {
    id: number;
    name: string;
    shorthand: string;
    color: string;
}

export interface FileData {
    file_path: string;
    file_size: string;
}

export interface TagStackImageData {
    url: string;
    width: number;
    height: number;
    is_square: boolean;
    directory: string;
    filename: string;
    extension: string;
    size: string;
}
