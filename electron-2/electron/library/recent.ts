import fs from 'node:fs/promises';
import path from 'node:path';
import { PathManager } from '../security/paths';
import type { RecentLibrary } from '../../shared/ipc';

export type RecentStore = ReturnType<typeof makeRecentStore>;

export function makeRecentStore(filePath: string, limit = 10) {
    async function load(): Promise<RecentLibrary[]> {
        try {
            const raw = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.filter(
                (item): item is RecentLibrary =>
                    typeof item === 'object' &&
                    item !== null &&
                    typeof item.root === 'string'
            );
        } catch {
            return [];
        }
    }
    async function save(list: RecentLibrary[]): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(list, null, 2));
    }
    async function list(): Promise<RecentLibrary[]> {
        return load();
    }
    async function touch(root: string): Promise<void> {
        const normalized = PathManager.normalize(root);
        const existing = await load();
        const filtered = existing.filter(
            (item) => PathManager.normalize(item.root) !== normalized
        );
        filtered.unshift({
            root,
            name: path.basename(root),
            lastOpenedAt: Date.now()
        });
        await save(filtered.slice(0, limit));
    }
    async function remove(root: string): Promise<void> {
        const normalized = PathManager.normalize(root);
        const existing = await load();
        const filtered = existing.filter(
            (item) => PathManager.normalize(item.root) !== normalized
        );
        await save(filtered);
    }
    async function has(root: string): Promise<boolean> {
        const normalized = PathManager.normalize(root);
        const existing = await load();
        return existing.some(
            (item) => PathManager.normalize(item.root) === normalized
        );
    }

    return { list, touch, remove, has };
}
