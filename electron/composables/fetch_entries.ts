const entries = ref<Entry[]>([]);

export async function fetchEntries(): Promise<Entry[]> {
    const path = await window.ipcRenderer.invoke('get-user-data-path');
    const fetchedEntries: any = await $fetch('/api/fetch_entries', {
        query: { data: path }
    });
    entries.value = fetchedEntries.map((entry: Entry) => ({
        id: entry.id,
        filename: entry.filename,
        path: entry.path,
        fields: entry.fields
    }));

    return entries.value;
}
