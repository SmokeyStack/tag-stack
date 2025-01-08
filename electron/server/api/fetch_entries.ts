import { defineEventHandler, getQuery } from 'h3';
import sqlite3 from 'sqlite3';
import path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const directory: string = query.data as string;
    const dbPath = path.join(directory, 'db', 'tags.db');
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        const promises: Promise<void>[] = [];
        const output: any[] = [];
        db.each(
            'SELECT * FROM entries',
            (err: any, row: any) => {
                if (err) reject(err);
                else {
                    const entry = { ...row, fields: {} };
                    const promise_field = new Promise<void>(
                        (field_resolve, field_reject) => {
                            db.all(
                                'SELECT tag_id FROM fields WHERE entry_id = ?',
                                [entry.id],
                                (err: any, fields: any[]) => {
                                    if (err) field_reject(err);
                                    else {
                                        fields.forEach((field) => {
                                            Object.keys(field).forEach(
                                                (key) => {
                                                    if (!entry.fields[key])
                                                        entry.fields[key] = [];

                                                    entry.fields[key].push(
                                                        field[key]
                                                    );
                                                }
                                            );
                                        });
                                        output.push(entry);
                                        field_resolve();
                                    }
                                }
                            );
                        }
                    );
                    promises.push(promise_field);
                }
            },
            (err: any) => {
                if (err) reject(err);
                else
                    Promise.all(promises)
                        .then(() => {
                            resolve(output); // Resolve with the collected entries
                        })
                        .catch(reject);
            }
        );
        db.close((error) => {
            if (error) {
                console.error(
                    `An error occurred while trying to fetch entries: ${error}`
                );
            }
        });
    });
});
