<template>
    <div><Button @click="refreshData">Refresh Data</Button></div>
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
    import { invoke, convertFileSrc } from '@tauri-apps/api/core';
    import { open } from '@tauri-apps/plugin-dialog';
    import { ref } from 'vue';

    const output = ref<string[]>([]);
    const loading = ref<boolean>(false);
    const fetchData = async () => {
        loading.value = true;

        try {
            invoke('start_time').then((message: any) =>
                console.log(`App started at ${message}`)
            );
            const file_path: string | null = await open({
                multiple: false,
                directory: true
            });
            const { data } = await useFetch('/api/fetch_files', {
                query: { data: file_path }
            });
            data.value = data.value!.map((image: string) => {
                return convertFileSrc(image);
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
