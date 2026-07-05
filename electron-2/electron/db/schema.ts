import Database from 'better-sqlite3';
import type { TagColor } from '../../shared/palette';

export const SCHEMA_VERSION = 1;
const DDL = `
CREATE TABLE tags (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  shorthand  TEXT,
  color      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE aliases (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  alias  TEXT NOT NULL,
  UNIQUE (tag_id, alias)
);
CREATE INDEX idx_aliases_tag ON aliases(tag_id);

CREATE TABLE entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  path       TEXT NOT NULL UNIQUE,   -- relative to library root, POSIX separators
  filename   TEXT NOT NULL,
  size       INTEGER,
  mtime_ms   INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE entry_tags (
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

export function initSchema(db: Database.Database): void {
    const version = db.pragma('user_version', { simple: true }) as number;
    if (version === SCHEMA_VERSION) return; // already initialized
    if (version > 0)
        throw new Error(
            `Library was created by an incompatible app version (schema v${version}).`
        );
    db.transaction(() => {
        db.exec(DDL);
        seedDefaultTags(db);
        db.pragma(`user_version = ${SCHEMA_VERSION}`);
    })();
}

function seedDefaultTags(db: Database.Database): void {
    const seeds: { name: string; color: TagColor }[] = [
        { name: 'Archived', color: 'RED' },
        { name: 'Favorite', color: 'YELLOW' }
    ];
    const insert = db.prepare(
        'INSERT INTO tags (name, shorthand, color) VALUES (?, NULL, ?)'
    );
    for (const seed of seeds) insert.run(seed.name, seed.color);
}
