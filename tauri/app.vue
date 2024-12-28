<template>
    <div class="h-screen flex flex-col">
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
        <div class="flex-grow overflow-hidden">
            <ResizablePanelGroup direction="horizontal" class="h-full">
                <ResizablePanel class="h-full" :min-size="21">
                    <ScrollArea class="h-full rounded-md border p-4">
                        <div class="p-4 h-full overflow-auto">
                            <div>
                                <Button @click="refreshData">
                                    Refresh Data
                                </Button>
                            </div>
                            <div>
                                <div v-if="loading">Loading...</div>
                                <div
                                    v-else-if="output.length"
                                    class="grid grid-cols-custom-3 gap-4">
                                    <div
                                        v-for="image in output"
                                        :key="image"
                                        class="relative w-full h-64 overflow-hidden">
                                        <img
                                            :src="image"
                                            :alt="image"
                                            class="absolute inset-0 w-full h-full object-cover filter blur-lg" />
                                        <!-- Centered foreground image -->
                                        <div
                                            class="absolute inset-0 flex justify-center items-center">
                                            <img
                                                :src="image"
                                                :alt="image"
                                                class="object-contain" />
                                        </div>
                                    </div>
                                </div>
                                <div v-else>No images available</div>
                            </div>
                        </div>
                    </ScrollArea>
                </ResizablePanel>
                <ResizableHandle with-handle />
                <ResizablePanel class="h-full" :min-size="21">
                    <div class="h-full p-4 flex items-center justify-center">
                        Two
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
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
        MenubarTrigger
    } from '@/components/ui/menubar';
    import {
        ResizableHandle,
        ResizablePanel,
        ResizablePanelGroup
    } from '@/components/ui/resizable';
    import { ScrollArea } from '@/components/ui/scroll-area';

    import * as core from '@tauri-apps/api/core';
    import * as dialog from '@tauri-apps/plugin-dialog';
    import * as shell from '@tauri-apps/plugin-shell';

    import { ref } from 'vue';

    const openGithub = () => {
        shell.open('https://github.com/SmokeyStack/tag-stack');
    };

    const output = ref<string[]>([]);
    const loading = ref<boolean>(false);
    const fetchData = async () => {
        loading.value = true;

        try {
            core.invoke('start_time').then((message: any) =>
                console.log(`App started at ${message}`)
            );
            const file_path: string | null = await dialog.open({
                multiple: false,
                directory: true
            });
            const { data } = await useFetch('/api/fetch_files', {
                query: { data: file_path }
            });
            data.value = data.value!.map((image: string) => {
                return core.convertFileSrc(image);
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
