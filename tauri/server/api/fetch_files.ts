import { defineEventHandler, getQuery } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory: string = query.data as string;

    try {
        const files = await fs.promises.readdir(directory);
        const images = files
            .filter((file: string) => /\.(png|jpe?g|gif)$/i.test(file))
            .map((file: string) => path.join(directory, file));

        return images;
    } catch (error) {
        console.error(
            `Error reading directory: ${directory} | Error: ${error}`
        );
        return [];
    }
});
