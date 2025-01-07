import * as sql from '@tauri-apps/plugin-sql';

const tags = ref<Tag[]>([]);

export async function fetchTags(): Promise<Tag[]> {
    const db = await sql.default.load('sqlite:db/tags.db');

    try {
        const result: any = await db.select('SELECT * FROM tags');
        tags.value = result.map((tag: Tag) => ({
            id: tag.id,
            name: tag.name,
            shorthand: tag.shorthand,
            color: tag.color
        }));

        return tags.value;
    } catch (error) {
        console.error(`An error occurred while trying to fetch tags: ${error}`);
        throw new Error('Failed to fetch tags');
    } finally {
        await db.close();
    }
}
