import { defineEventHandler, getQuery } from 'h3';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory = query.data as string;

    const readdirAsync = (directory: fs.PathLike): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });
    };

    try {
        const files = await readdirAsync(directory);
        const imageFiles = files
            .filter((file: string) => /\.(png|jpe?g|gif)$/i.test(file))
            .map((file: string) => path.join(directory, file));

        console.log(imageFiles);
        return imageFiles;
    } catch (err) {
        console.error('Error reading directory:', err);
        return [];
    }
});
