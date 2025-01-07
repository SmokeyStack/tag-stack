import { defineEventHandler, getQuery } from 'h3';
import sqlite3 from 'sqlite3';
import path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory: string = query.data as string;
    const dbPath = path.join(directory, 'db', 'tags.db');
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        const callback = (err: any, result: unknown) => {
            if (err) reject(err);
            else resolve(result);
        };
        const output: any[] = [];
        db.each(
            'SELECT * FROM tags',
            (err: any, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    output.push(row);
                }
            },
            (err: any) => {
                if (err) reject(err);
                else callback(null, output); // Resolve with the collected rows
            }
        );
        db.close((error) => {
            if (error) {
                console.error(
                    `An error occurred while trying to fetch tags: ${error}`
                );
            }
        });
    });
});
