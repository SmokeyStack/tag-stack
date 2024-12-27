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
    import { ref, onMounted } from 'vue';
    const output = ref(null);
    const fetchData = async () => {
        const time = await window.ipcRenderer.invoke('app-start-time');
        console.log(`App started at ${time}`);
        const filesPath = await window.ipcRenderer.invoke('open-file-dialog');
        const { data } = await useFetch('/api/fetch_files', {
            query: { data: filesPath }
        });
        output.value = data.value;
    };
    const refreshData = () => {
        fetchData();
    };
    onMounted(fetchData);
</script>
