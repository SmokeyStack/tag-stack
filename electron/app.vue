<template>
    <div><button @click="refreshData">Refresh Data</button></div>
    <div>
        <div v-if="loading">Loading...</div>
        <div v-else>
            <div v-if="output.length">
                <div v-for="image in output" :key="image">
                    <img :src="image" :alt="image" width="256px" />
                </div>
            </div>
            <div v-else>No images available</div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    const output = ref<string[]>([]);
    const loading = ref<boolean>(false);
    const fetchData = async () => {
        loading.value = true;

        try {
            const time = await window.ipcRenderer.invoke('app-start-time');
            console.log(`App started at ${time}`);
            const file_path = await window.ipcRenderer.invoke(
                'app-open-file-dialog'
            );
            const { data } = await useFetch('/api/fetch_files', {
                query: { data: file_path }
            });
            output.value = data.value!;
        } catch (error) {
            console.error(`Failed to fetch data: ${error}`);
        } finally {
            loading.value = false;
        }
    };
    const refreshData = () => {
        fetchData();
    };
</script>
