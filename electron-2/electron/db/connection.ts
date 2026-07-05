import Database from 'better-sqlite3';

export function openDb(file: string): Database.Database {
    const db = new Database(file);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    return db;
}
export function closeDb(db: Database.Database): void {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
}
