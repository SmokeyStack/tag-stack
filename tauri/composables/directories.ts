import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';

export async function updateRecentDirectories(
    directory_path: string
): Promise<void> {
    const user_data = path.BaseDirectory.AppData;
    const recent_directories_path = 'db/recent_directories.json';

    if (!(await fs.exists('db', { baseDir: user_data })))
        await fs.mkdir('db', { baseDir: user_data });
    if (!(await fs.exists(recent_directories_path, { baseDir: user_data })))
        await fs.writeTextFile(recent_directories_path, '[]', {
            baseDir: user_data
        });

    const recent_directories: string[] = JSON.parse(
        await fs.readTextFile(recent_directories_path, { baseDir: user_data })
    );

    if (!Array.isArray(recent_directories)) {
        console.error(
            `Invalid format of recent_directories.json. It should be an array.`
        );
        throw new Error(
            'Invalid format of recent_directories.json. It should be an array.'
        );
    }

    if (recent_directories.includes(directory_path))
        recent_directories.splice(
            recent_directories.indexOf(directory_path),
            1
        );

    recent_directories.unshift(directory_path);

    if (recent_directories.length > 10) recent_directories.length = 10;

    await fs.writeTextFile(
        recent_directories_path,
        JSON.stringify(recent_directories),
        { baseDir: user_data }
    );
}

export async function getMostRecentDirectory(): Promise<string> {
    const user_data = path.BaseDirectory.AppData;
    const recent_directories_path = 'db/recent_directories.json';

    if (!(await fs.exists('db', { baseDir: user_data })))
        await fs.mkdir('db', { baseDir: user_data });
    if (!(await fs.exists(recent_directories_path, { baseDir: user_data })))
        await fs.writeTextFile(recent_directories_path, '[]', {
            baseDir: user_data
        });

    const recent_directories: string[] = JSON.parse(
        await fs.readTextFile(recent_directories_path, { baseDir: user_data })
    );

    if (!Array.isArray(recent_directories)) {
        console.error(
            `Invalid format of recent_directories.json. It should be an array.`
        );
        throw new Error(
            'Invalid format of recent_directories.json. It should be an array.'
        );
    }

    return recent_directories[0];
}
