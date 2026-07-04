<template>
    <h1>TagStack</h1>

    <div>
        <Button @click="openFolder">Open Folder</Button>
    </div>

    <p v-if="appStartTime">App started at: {{ appStartTime }}</p>

    <p v-if="loading">Loading...</p>

    <p v-if="errorMessage">
        {{ errorMessage }}
    </p>

    <div v-if="files.length > 0">
        <div v-for="file in files" :key="file.path">
            <img :src="toMediaUrl(file.path)" :alt="file.path" width="256" />
            <p>{{ file.path }}</p>
            <p>{{ toMediaUrl(file.path) }}</p>
        </div>
    </div>

    <p v-else-if="!loading">No files loaded.</p>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { Button } from './components/ui/button';
    import { useElectronApi } from './composables/useElectronApi';
    import { toMediaUrl, type FileData } from '~~/shared/ipc';

    const appStartTime = ref<string>('');
    const files = ref<FileData[]>([]);
    const loading = ref<boolean>(false);
    const errorMessage = ref<string>('');
    async function openFolder() {
        const api = useElectronApi();
        if (!api) return;

        const directory = await api.openDirectoryDialog();
        if (!directory) return;

        loading.value = true;
        errorMessage.value = '';
        try {
            files.value = await api.listDirectory(directory);
        } catch (error) {
            errorMessage.value =
                error instanceof Error ? error.message : 'Unknown error';
        } finally {
            loading.value = false;
        }
    }
</script>
