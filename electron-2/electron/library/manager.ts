import fs from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { closeDb, openDb } from '../db/connection';
import { makeEntriesRepo, type EntriesRepo } from '../db/repo/entries';
import { makeSettingsRepo, type SettingsRepo } from '../db/repo/settings';
import { makeTagsRepo, type TagsRepo } from '../db/repo/tags';
import { initSchema } from '../db/schema';
import { PathManager } from '../security/paths';
import { IMAGE_FILE_REGEX, type LibraryInfo } from '../../shared/ipc';

let current: {
    root: string;
    db: Database.Database;
    tags: TagsRepo;
    entries: EntriesRepo;
    settings: SettingsRepo;
} | null = null;

export function requireLibrary() {
    if (!current) throw new Error('No library is open');
    return current;
}
export function getLibraryInfo(): LibraryInfo | null {
    if (!current) return null;
    return {
        root: current.root,
        name: path.basename(current.root),
        entryCount: current.entries.count()
    };
}
export async function openLibraryAt(root: string): Promise<LibraryInfo> {
    const resolvedRoot = path.resolve(root);
    const stats = await fs.stat(resolvedRoot);
    if (!stats.isDirectory())
        throw new Error(`Library location is not a directory: ${resolvedRoot}`);
    try {
        await fs.mkdir(path.join(resolvedRoot, '.tagstack'), {
            recursive: true
        });
    } catch {
        throw new Error(
            `Cannot create library here (folder not writable): ${resolvedRoot}`
        );
    }
    closeLibrary();

    const db = openDb(path.join(resolvedRoot, '.tagstack', 'library.db'));
    try {
        initSchema(db);
    } catch (error) {
        db.close();
        throw error;
    }

    const tags = makeTagsRepo(db);
    const entries = makeEntriesRepo(db);
    const settings = makeSettingsRepo(db);
    current = { root: resolvedRoot, db, tags, entries, settings };
    PathManager.grantExclusive(resolvedRoot);
    const files = await fs.readdir(resolvedRoot, { withFileTypes: true });
    const images = files.filter(
        (entry) => entry.isFile() && IMAGE_FILE_REGEX.test(entry.name)
    );
    const statResults = await Promise.allSettled(
        images.map(async (entry) => {
            const filePath = path.join(resolvedRoot, entry.name);
            const fileStats = await fs.stat(filePath);
            return { entry, filePath, fileStats };
        })
    );
    db.transaction(() => {
        for (const result of statResults) {
            if (result.status !== 'fulfilled') continue;

            const { entry, filePath, fileStats } = result.value;
            entries.upsertByPath({
                path: path
                    .relative(resolvedRoot, filePath)
                    .split(path.sep)
                    .join('/'),
                filename: entry.name,
                size: fileStats.size,
                mtimeMs: fileStats.mtimeMs
            });
        }
    })();
    return getLibraryInfo()!;
}
export function closeLibrary(): void {
    if (!current) return;

    closeDb(current.db);
    current = null;
    PathManager.revokeAllPaths();
}
