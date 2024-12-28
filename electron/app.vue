<template>
    <Menubar>
        <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
                <MenubarItem> To be implemented </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
                <MenubarItem> To be implemented </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
                <MenubarItem @click="openGithub">
                    Visit Github Repository
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
    <div class="p-4">
        <div><Button @click="refreshData">Refresh Data</Button></div>
        <div>
            <div v-if="loading">Loading...</div>
            <div v-else>
                <div v-if="output.length">
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-4">
                        <div v-for="image in output" :key="image">
                            <img :src="image" :alt="image" />
                        </div>
                    </div>
                </div>
                <div v-else>No images available</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Button } from '@/components/ui/button';
    import {
        Menubar,
        MenubarContent,
        MenubarItem,
        MenubarMenu,
        MenubarSeparator,
        MenubarShortcut,
        MenubarTrigger
    } from '@/components/ui/menubar';

    import { ref } from 'vue';

    const openGithub = () => {
        window.ipcRenderer.invoke(
            'app-open-url',
            'https://github.com/SmokeyStack/tag-stack'
        );
    };

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
