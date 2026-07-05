import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeEntriesRepo, type EntriesRepo } from '../electron/db/repo/entries';
import {
    makeSettingsRepo,
    type SettingsRepo
} from '../electron/db/repo/settings';
import { makeTagsRepo, type TagsRepo } from '../electron/db/repo/tags';
import { initSchema, SCHEMA_VERSION } from '../electron/db/schema';

let db: Database.Database;

beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initSchema(db);
});

describe('initSchema', () => {
    it('stamps user_version to SCHEMA_VERSION', () => {
        const version = db.pragma('user_version', { simple: true });
        expect(version).toBe(SCHEMA_VERSION);
    });

    it('is a no-op on a second call', () => {
        expect(() => initSchema(db)).not.toThrow();
        const version = db.pragma('user_version', { simple: true });
        expect(version).toBe(SCHEMA_VERSION);
    });

    it('throws on an incompatible schema version', () => {
        db.pragma('user_version = 99');
        expect(() => initSchema(db)).toThrow('incompatible');
    });

    it('seeds Archived (RED) and Favorite (YELLOW) tags', () => {
        const tags = makeTagsRepo(db).list();
        expect(tags).toHaveLength(2);
        const archived = tags.find((tag) => tag.name === 'Archived');
        const favorite = tags.find((tag) => tag.name === 'Favorite');
        expect(archived?.color).toBe('RED');
        expect(favorite?.color).toBe('YELLOW');
    });
});

describe('tags repo', () => {
    let tags: TagsRepo;

    beforeEach(() => {
        tags = makeTagsRepo(db);
    });

    it('creates a tag with aliases and lists it sorted with aliases', () => {
        tags.create({ name: 'Zebra', aliases: ['stripey', 'horse-cousin'] });
        tags.create({ name: 'Apple', aliases: ['fruit'] });

        const list = tags.list();
        expect(list.map((tag) => tag.name)).toEqual([
            'Apple',
            'Archived',
            'Favorite',
            'Zebra'
        ]);

        const apple = list.find((tag) => tag.name === 'Apple')!;
        expect(apple.aliases).toEqual(['fruit']);

        const zebra = list.find((tag) => tag.name === 'Zebra')!;
        expect(zebra.aliases.slice().sort()).toEqual(
            ['horse-cousin', 'stripey'].sort()
        );
    });

    it('updates name and replaces aliases', () => {
        const created = tags.create({ name: 'Old Name', aliases: ['a', 'b'] });

        const updated = tags.update(created.id, {
            name: 'New Name',
            aliases: ['c']
        });

        expect(updated.name).toBe('New Name');
        expect(updated.aliases).toEqual(['c']);
    });

    it('throws when updating a nonexistent id', () => {
        expect(() => tags.update(999999, { name: 'Nope' })).toThrow(
            'Tag not found: 999999'
        );
    });

    it('cascades alias and entry_tags deletion on remove', () => {
        const entries = makeEntriesRepo(db);
        const created = tags.create({ name: 'Removable', aliases: ['x'] });
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 10,
            mtimeMs: 1
        });
        const entryId = entries.list().find((e) => e.path === 'a.png')!.id;
        entries.assignTag(entryId, created.id);

        tags.remove(created.id);

        const aliasRows = db
            .prepare('SELECT * FROM aliases WHERE tag_id = ?')
            .all(created.id);
        expect(aliasRows).toHaveLength(0);

        const entryTagRows = db
            .prepare('SELECT * FROM entry_tags WHERE tag_id = ?')
            .all(created.id);
        expect(entryTagRows).toHaveLength(0);
    });
});

describe('entries repo', () => {
    let entries: EntriesRepo;

    beforeEach(() => {
        entries = makeEntriesRepo(db);
    });

    it('upserts by path idempotently and updates fields', () => {
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 10,
            mtimeMs: 1
        });
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 20,
            mtimeMs: 2
        });

        expect(entries.count()).toBe(1);
        const row = entries.list().find((e) => e.path === 'a.png')!;
        expect(row.size).toBe(20);
    });

    it('assigns tags idempotently', () => {
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 10,
            mtimeMs: 1
        });
        const tags = makeTagsRepo(db);
        const tag = tags.create({ name: 'Sample' });
        const entryId = entries.list()[0].id;

        entries.assignTag(entryId, tag.id);
        entries.assignTag(entryId, tag.id);

        const rows = db
            .prepare(
                'SELECT * FROM entry_tags WHERE entry_id = ? AND tag_id = ?'
            )
            .all(entryId, tag.id);
        expect(rows).toHaveLength(1);
    });

    it('unassigns tags', () => {
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 10,
            mtimeMs: 1
        });
        const tags = makeTagsRepo(db);
        const tag = tags.create({ name: 'Sample' });
        const entryId = entries.list()[0].id;

        entries.assignTag(entryId, tag.id);
        entries.unassignTag(entryId, tag.id);

        const row = entries.list().find((e) => e.id === entryId)!;
        expect(row.tagIds).toEqual([]);
    });

    it('removes entry_tags rows when the tag is deleted (FK cascade)', () => {
        entries.upsertByPath({
            path: 'a.png',
            filename: 'a.png',
            size: 10,
            mtimeMs: 1
        });
        const tags = makeTagsRepo(db);
        const tag = tags.create({ name: 'Sample' });
        const entryId = entries.list()[0].id;
        entries.assignTag(entryId, tag.id);

        tags.remove(tag.id);

        const row = entries.list().find((e) => e.id === entryId)!;
        expect(row.tagIds).toEqual([]);
    });
});

describe('settings repo', () => {
    let settings: SettingsRepo;

    beforeEach(() => {
        settings = makeSettingsRepo(db);
    });

    it('round-trips get/set', () => {
        expect(settings.get('theme')).toBeNull();
        settings.set('theme', 'dark');
        expect(settings.get('theme')).toBe('dark');
    });

    it('overwrites an existing value', () => {
        settings.set('theme', 'dark');
        settings.set('theme', 'light');
        expect(settings.get('theme')).toBe('light');
    });
});
