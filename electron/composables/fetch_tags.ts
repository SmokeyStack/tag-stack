const tags = ref<Tag[]>([]);

export async function fetchTags(): Promise<Tag[]> {
    const path = await window.ipcRenderer.invoke('get-user-data-path');
    const fetchedTags: any = await $fetch('/api/fetch_tags', {
        query: { data: path }
    });
    tags.value = fetchedTags.map((tag: Tag) => ({
        id: tag.id,
        name: tag.name,
        shorthand: tag.shorthand,
        color: tag.color
    }));

    return tags.value;
}
