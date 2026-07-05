import path from 'node:path';

export class PathManager {
    private static grantedPaths = new Set<string>();
    private static normalizePath(p: string): string {
        const resolved = path.resolve(p);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }
    static grantPath(root: string): void {
        PathManager.grantedPaths.add(PathManager.normalizePath(root));
    }
    static grantExclusive(root: string): void {
        PathManager.grantedPaths.clear();
        PathManager.grantedPaths.add(PathManager.normalizePath(root));
    }
    static revokeAllPaths(): void {
        PathManager.grantedPaths.clear();
    }
    static isGrantedPath(target: string): boolean {
        const resolved = PathManager.normalizePath(target);
        for (const root of PathManager.grantedPaths)
            if (resolved === root || resolved.startsWith(root + path.sep))
                return true;

        return false;
    }
    static getGrantedPaths(): string[] {
        return [...PathManager.grantedPaths];
    }
}
