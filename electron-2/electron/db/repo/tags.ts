import type Database from 'better-sqlite3';
import type { Tag, TagInput } from '../../../shared/ipc';

export type TagsRepo = ReturnType<typeof makeTagsRepo>;

interface TagRow {
    id: number;
    name: string;
    shorthand: string | null;
    color: string | null;
}
interface AliasRow {
    tag_id: number;
    alias: string;
}

export function makeTagsRepo(db: Database.Database) {
    const selectAll = db.prepare(
        'SELECT id, name, shorthand, color FROM tags ORDER BY name'
    );
    const selectOne = db.prepare(
        'SELECT id, name, shorthand, color FROM tags WHERE id = ?'
    );
    const selectAllAliases = db.prepare('SELECT tag_id, alias FROM aliases');
    const selectAliasesForTag = db.prepare(
        'SELECT tag_id, alias FROM aliases WHERE tag_id = ?'
    );
    const insertTag = db.prepare(
        'INSERT INTO tags (name, shorthand, color) VALUES (?, ?, ?)'
    );
    const insertAlias = db.prepare(
        'INSERT INTO aliases (tag_id, alias) VALUES (?, ?)'
    );
    const deleteAliases = db.prepare('DELETE FROM aliases WHERE tag_id = ?');
    const deleteTag = db.prepare('DELETE FROM tags WHERE id = ?');

    function aliasesFor(rows: AliasRow[]): Map<number, string[]> {
        const byTag = new Map<number, string[]>();
        for (const row of rows) {
            const existing = byTag.get(row.tag_id);
            if (existing) existing.push(row.alias);
            else byTag.set(row.tag_id, [row.alias]);
        }
        return byTag;
    }
    function toTag(row: TagRow, aliases: string[]): Tag {
        return {
            id: row.id,
            name: row.name,
            shorthand: row.shorthand,
            color: row.color,
            aliases
        };
    }
    function list(): Tag[] {
        const rows = selectAll.all() as TagRow[];
        const byTag = aliasesFor(selectAllAliases.all() as AliasRow[]);
        return rows.map((row) => toTag(row, byTag.get(row.id) ?? []));
    }
    function get(id: number): Tag | null {
        const row = selectOne.get(id) as TagRow | undefined;
        if (!row) return null;

        const aliasRows = selectAliasesForTag.all(id) as AliasRow[];
        return toTag(
            row,
            aliasRows.map((a) => a.alias)
        );
    }
    function create(input: TagInput): Tag {
        const run = db.transaction(() => {
            const result = insertTag.run(
                input.name,
                input.shorthand ?? null,
                input.color ?? null
            );
            const tagId = result.lastInsertRowid as number;
            for (const alias of input.aliases ?? [])
                insertAlias.run(tagId, alias);

            return tagId;
        });
        const tagId = run();
        return get(tagId)!;
    }
    function update(id: number, patch: Partial<TagInput>): Tag {
        const run = db.transaction(() => {
            const fields: string[] = [];
            const values: unknown[] = [];
            if (patch.name !== undefined) {
                fields.push('name = ?');
                values.push(patch.name);
            }
            if (patch.shorthand !== undefined) {
                fields.push('shorthand = ?');
                values.push(patch.shorthand);
            }
            if (patch.color !== undefined) {
                fields.push('color = ?');
                values.push(patch.color);
            }

            fields.push('updated_at = unixepoch()');
            const result = db
                .prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`)
                .run(...values, id);
            if (result.changes === 0) throw new Error(`Tag not found: ${id}`);
            if (patch.aliases !== undefined) {
                deleteAliases.run(id);
                for (const alias of patch.aliases) insertAlias.run(id, alias);
            }
        });
        run();
        return get(id)!;
    }
    function remove(id: number): void {
        deleteTag.run(id);
    }

    return { list, get, create, update, remove };
}
