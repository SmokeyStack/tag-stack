<template>
    <div>
        <button @click="refreshData">Refresh Data</button>
    </div>
    <div>
        <div v-if="output">
            <div v-for="image in output" :key="image">
                <img :src="image" :alt="image" width="256px" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { invoke, convertFileSrc } from '@tauri-apps/api/core';
    import { open } from '@tauri-apps/plugin-dialog';
    const invoke = window.__TAURI__.core.invoke;
    import { ref, onMounted } from 'vue';
    const output = ref(null);
    const fetchData = async () => {
        invoke('start_time').then((message: any) =>
            console.log(`App started at ${message}`)
        );
        const file = await open({
            multiple: false,
            directory: true
        });
        const { data } = await useFetch('/api/fetch_files', {
            query: { data: file }
        });
        data.value = data.value.map((image: string) => {
            return window.__TAURI__.core.convertFileSrc(image);
        });
        output.value = data.value;
    };
    const refreshData = () => {
        fetchData();
    };
    onMounted(fetchData);
</script>
