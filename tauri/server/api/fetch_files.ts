import { defineEventHandler, getQuery } from 'h3';
import fs from 'fs';
import path from 'path';

async function getFileSize(image: fs.PathLike): Promise<string> {
    try {
        const stats = await fs.promises.stat(image);
        const fileSizeInBytes = stats.size;

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        let index = 0;
        let fileSize = fileSizeInBytes;

        while (fileSize >= 1024 && index < sizes.length - 1) {
            fileSize /= 1024;
            index++;
        }

        return `${fileSize.toFixed(2)} ${sizes[index]}`;
    } catch (error) {
        console.error(`Error getting file size: ${error}`);
        return 'Unknown size';
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory: string = query.data as string;

    try {
        const files = await fs.promises.readdir(directory);
        const images = await Promise.all(
            files
                .filter((file) => /\.(png|jpe?g|gif)$/i.test(file))
                .map(async (file) => {
                    const filePath = path.join(directory, file);
                    const fileSize = await getFileSize(filePath);
                    return {
                        path: filePath,
                        size: fileSize
                    };
                })
        );

        return images;
    } catch (error) {
        console.error(
            `Error reading directory: ${directory} | Error: ${error}`
        );
        return [];
    }
});
