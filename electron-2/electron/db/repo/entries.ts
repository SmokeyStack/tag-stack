import type Database from 'better-sqlite3';

export type EntriesRepo = ReturnType<typeof makeEntriesRepo>;
export interface EntryRow {
    id: number;
    path: string;
    filename: string;
    size: number | null;
    tagIds: number[];
}
interface EntryTableRow {
    id: number;
    path: string;
    filename: string;
    size: number | null;
}
interface EntryTagRow {
    entry_id: number;
    tag_id: number;
}

export function makeEntriesRepo(db: Database.Database) {
    const upsertDb = db.prepare(`
        INSERT INTO entries (path, filename, size, mtime_ms)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
            filename = excluded.filename,
            size = excluded.size,
            mtime_ms = excluded.mtime_ms
    `);
    const selectAllDb = db.prepare(
        'SELECT id, path, filename, size FROM entries ORDER BY path'
    );
    const selectAllEntryTagsDb = db.prepare(
        'SELECT entry_id, tag_id FROM entry_tags'
    );
    const countDb = db.prepare('SELECT COUNT(*) AS count FROM entries');
    const assignTagDb = db.prepare(
        'INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)'
    );
    const unassignTagStmtDb = db.prepare(
        'DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?'
    );
    const selectAllPathsDb = db.prepare(
        'SELECT id, path, size, mtime_ms FROM entries ORDER BY path'
    );
    const removeByIdDb = db.prepare('DELETE FROM entries WHERE id = ?');

    function upsertByPath(input: {
        path: string;
        filename: string;
        size: number;
        mtimeMs: number;
    }): void {
        upsertDb.run(input.path, input.filename, input.size, input.mtimeMs);
    }
    function list(): EntryRow[] {
        const rows = selectAllDb.all() as EntryTableRow[];
        const tagRows = selectAllEntryTagsDb.all() as EntryTagRow[];
        const byEntry = new Map<number, number[]>();
        for (const row of tagRows) {
            const existing = byEntry.get(row.entry_id);
            if (existing) existing.push(row.tag_id);
            else byEntry.set(row.entry_id, [row.tag_id]);
        }
        return rows.map((row) => ({
            id: row.id,
            path: row.path,
            filename: row.filename,
            size: row.size,
            tagIds: byEntry.get(row.id) ?? []
        }));
    }
    function count(): number {
        const row = countDb.get() as { count: number };
        return row.count;
    }
    function assignTag(entryId: number, tagId: number): void {
        assignTagDb.run(entryId, tagId);
    }
    function unassignTag(entryId: number, tagId: number): void {
        unassignTagStmtDb.run(entryId, tagId);
    }
    function listPaths(): {
        id: number;
        path: string;
        size: number | null;
        mtime_ms: number | null;
    }[] {
        return selectAllPathsDb.all() as {
            id: number;
            path: string;
            size: number | null;
            mtime_ms: number | null;
        }[];
    }
    function removeByIds(ids: number[]): void {
        for (const id of ids) removeByIdDb.run(id);
    }

    return {
        upsertByPath,
        list,
        count,
        assignTag,
        unassignTag,
        listPaths,
        removeByIds
    };
}
