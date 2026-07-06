import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    closeLibrary,
    openLibraryAt,
    requireLibrary,
    scanAndReconcile
} from '../electron/library/manager';

let tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tagstack-lib-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(async () => {
    closeLibrary();
    for (const dir of tempDirs)
        await fs.rm(dir, { recursive: true, force: true });
    tempDirs = [];
});

describe('scanAndReconcile', () => {
    it('picks up added, removed, and updated files on rescan', async () => {
        const dir = await makeTempDir();
        await fs.writeFile(path.join(dir, 'a.png'), 'aaaa');
        await fs.writeFile(path.join(dir, 'b.png'), 'bb');

        const info = await openLibraryAt(dir);
        expect(info.entryCount).toBe(2);

        await fs.writeFile(path.join(dir, 'c.png'), 'c');
        await fs.rm(path.join(dir, 'b.png'));
        await fs.writeFile(path.join(dir, 'a.png'), 'aaaaaaaa');

        const result = await scanAndReconcile();
        expect(result).toEqual({ added: 1, removed: 1, updated: 1 });

        const second = await scanAndReconcile();
        expect(second).toEqual({ added: 0, removed: 0, updated: 0 });

        const lib = requireLibrary();
        const dbPaths = lib.entries.listPaths().map((row) => row.path).sort();
        expect(dbPaths).toEqual(['a.png', 'c.png']);
    });
});
