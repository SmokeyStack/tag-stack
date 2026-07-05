// better-sqlite3 is rebuilt for Electron's ABI by `electron-builder install-app-deps`,
// so plain `node` can't load it. Run vitest under Electron's bundled Node instead —
// same runtime the app ships with. --pool=forks so workers inherit the executable.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electron = require('electron'); // path to the electron binary in a plain-node context

const result = spawnSync(
    electron,
    ['node_modules/vitest/vitest.mjs', 'run', '--pool=forks', ...process.argv.slice(2)],
    {
        stdio: 'inherit',
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    }
);
process.exit(result.status ?? 1);
