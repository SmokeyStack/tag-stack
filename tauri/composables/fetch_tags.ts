import { ref } from 'vue';
import * as sql from '@tauri-apps/plugin-sql';

const tags = ref<Tag[]>([]);

export async function fetchTags(): Promise<Tag[]> {
    if (!tags.value.length) {
        await useAsyncData('tags', async () => {
            const db = await sql.default.load('sqlite:db/tags.db');

            try {
                const result: any = await db.select('SELECT * FROM tags');
                const tags = result.map((tag: Tag) => ({
                    id: tag.id,
                    name: tag.name,
                    shorthand: tag.shorthand,
                    color: tag.color
                }));
                return tags;
            } catch (error) {
                console.error(
                    `An error occurred while trying to fetch tags: ${error}`
                );
            } finally {
                await db.close();
            }
        });

        const { data: fetchedTags } = useNuxtData('tags');
        tags.value = fetchedTags.value;
    }
    return tags.value;
}
