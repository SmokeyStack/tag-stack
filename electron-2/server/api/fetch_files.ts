import { defineEventHandler, getQuery } from 'h3';
import fs from 'node:fs/promises';
import path from 'node:path';

function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < sizes.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${sizes[unitIndex]}`;
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory = String(query.data || '');

    if (!directory) {
        return [];
    }

    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });

        const images = await Promise.all(
            entries
                .filter(
                    (entry) =>
                        entry.isFile() && /\.(png|jpe?g|gif)$/i.test(entry.name)
                )
                .map(async (entry) => {
                    const filePath = path.join(directory, entry.name);
                    const stats = await fs.stat(filePath);

                    return {
                        file_path: filePath,
                        file_size: formatFileSize(stats.size)
                    };
                })
        );

        return images;
    } catch (error) {
        console.error(`Failed to read directory "${directory}":`, error);
        return [];
    }
});
