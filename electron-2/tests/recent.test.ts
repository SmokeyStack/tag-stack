import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { makeRecentStore, type RecentStore } from '../electron/library/recent';

let tempDirs: string[] = [];

async function makeTempFile(): Promise<{ dir: string; file: string }> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tagstack-recent-'));
    tempDirs.push(dir);
    return { dir, file: path.join(dir, 'recent-libraries.json') };
}

afterEach(async () => {
    for (const dir of tempDirs)
        await fs.rm(dir, { recursive: true, force: true });
    tempDirs = [];
});

describe('recent store', () => {
    it('lists touched roots in MRU order', async () => {
        const { file } = await makeTempFile();
        const store: RecentStore = makeRecentStore(file);

        await store.touch('/libs/one');
        await store.touch('/libs/two');
        await store.touch('/libs/three');

        const list = await store.list();
        expect(list.map((item) => item.root)).toEqual([
            '/libs/three',
            '/libs/two',
            '/libs/one'
        ]);
    });

    it('moves a re-touched root to the front without duplicating it', async () => {
        const { file } = await makeTempFile();
        const store: RecentStore = makeRecentStore(file);

        await store.touch('/libs/one');
        await store.touch('/libs/two');
        await store.touch('/libs/one');

        const list = await store.list();
        expect(list.map((item) => item.root)).toEqual([
            '/libs/one',
            '/libs/two'
        ]);
    });

    it('removes a root', async () => {
        const { file } = await makeTempFile();
        const store: RecentStore = makeRecentStore(file);

        await store.touch('/libs/one');
        await store.touch('/libs/two');
        await store.remove('/libs/one');

        const list = await store.list();
        expect(list.map((item) => item.root)).toEqual(['/libs/two']);
    });

    it('has() is case-insensitive on win32', async () => {
        const { dir, file } = await makeTempFile();
        const store: RecentStore = makeRecentStore(file);
        const mixedCaseRoot = path.join(dir, 'MyLibrary');

        await store.touch(mixedCaseRoot);

        if (process.platform === 'win32') {
            expect(await store.has(mixedCaseRoot.toUpperCase())).toBe(true);
            expect(await store.has(mixedCaseRoot.toLowerCase())).toBe(true);
        } else {
            expect(await store.has(mixedCaseRoot)).toBe(true);
        }
    });

    it('returns an empty list when the file is corrupt JSON', async () => {
        const { file } = await makeTempFile();
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, '{not valid json');
        const store: RecentStore = makeRecentStore(file);

        const list = await store.list();
        expect(list).toEqual([]);
    });

    it('caps the list at the configured limit, dropping the oldest', async () => {
        const { file } = await makeTempFile();
        const store: RecentStore = makeRecentStore(file, 10);

        for (let i = 0; i < 11; i++) await store.touch(`/libs/${i}`);

        const list = await store.list();
        expect(list).toHaveLength(10);
        expect(list.map((item) => item.root)).not.toContain('/libs/0');
        expect(list[0].root).toBe('/libs/10');
    });
});
