import * as sql from '@tauri-apps/plugin-sql';

const entries = ref<Entry[]>([]);

export async function fetchEntries(): Promise<Entry[]> {
    const db = await sql.default.load('sqlite:db/tags.db');

    try {
        const fetchedEntries: Entry[] = [];
        const result: any[] = await db.select('SELECT * FROM entries');

        for (const row of result) {
            const entry = { ...row, fields: {} };
            const fields: any[] = await db.select(
                'SELECT tag_id FROM fields WHERE entry_id = $1',
                [entry.id]
            );
            fields.forEach((field) => {
                Object.keys(field).forEach((key) => {
                    if (!entry.fields[key]) entry.fields[key] = [];

                    entry.fields[key].push(field[key]);
                });
            });
            fetchedEntries.push(entry);
        }

        entries.value = fetchedEntries.map((entry: Entry) => ({
            id: entry.id,
            filename: entry.filename,
            path: entry.path,
            fields: entry.fields
        }));

        return entries.value;
    } catch (error) {
        console.error(
            `An error occurred while trying to fetch entries: ${error}`
        );
        throw new Error('Failed to fetch entries');
    } finally {
        await db.close();
    }
}
