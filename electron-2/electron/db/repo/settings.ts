import type Database from 'better-sqlite3';

export type SettingsRepo = ReturnType<typeof makeSettingsRepo>;

export function makeSettingsRepo(db: Database.Database) {
    const select = db.prepare('SELECT value FROM settings WHERE key = ?');
    const upsert = db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    function get(key: string): string | null {
        const row = select.get(key) as { value: string } | undefined;
        return row ? row.value : null;
    }
    function set(key: string, value: string): void {
        upsert.run(key, value);
    }

    return { get, set };
}
