<template>
    <h1>TagStack</h1>

    <div>
        <Button @click="fetchData">Refresh Data</Button>
    </div>

    <p v-if="appStartTime">App started at: {{ appStartTime }}</p>

    <p v-if="loading">Loading...</p>

    <p v-if="errorMessage">
        {{ errorMessage }}
    </p>

    <div v-if="files.length > 0">
        <div v-for="file in files" :key="file">
            <img :src="file" :alt="file" width="256" />
            <p>{{ file }}</p>
        </div>
    </div>

    <p v-else-if="!loading">No files loaded.</p>
</template>

<script setup lang="ts">
    import { onMounted, ref } from 'vue';
    import { Button } from './components/ui/button';

    const appStartTime = ref<string>('');
    const files = ref<string[]>([]);
    const loading = ref<boolean>(false);
    const errorMessage = ref<string>('');

    async function fetchData(): Promise<void> {
        loading.value = true;
        errorMessage.value = '';

        try {
            appStartTime.value = await window.api.getAppStartTime();
            const filePaths = await window.api.openFileDialog();
            if (filePaths.length === 0) {
                files.value = [];
                return;
            }

            const data = await $fetch('/api/fetch_files', {
                query: { data: filePaths }
            });
            console.log('Fetched data:', data);
            data.forEach((file) => {
                files.value.push(file.file_path);
            });
        } catch (error) {
            errorMessage.value =
                error instanceof Error ? error.message : 'Unknown error';
        } finally {
            loading.value = false;
        }
    }

    onMounted(() => {
        fetchData();
    });
</script>
