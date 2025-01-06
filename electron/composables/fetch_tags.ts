import { ref } from 'vue';

const tags = ref<Tag[]>([]);

export async function fetchTags(): Promise<Tag[]> {
    if (!tags.value.length) {
        const path = await window.ipcRenderer.invoke('get-user-data-path');
        await useAsyncData(
            'tags',
            async () =>
                await $fetch('/api/fetch_tags', {
                    query: { data: path }
                })
        );

        const { data: fetchedTags } = useNuxtData('tags');
        tags.value = fetchedTags.value.map((tag: Tag) => ({
            id: tag.id,
            name: tag.name,
            shorthand: tag.shorthand,
            color: tag.color
        }));
    }
    return tags.value;
}
