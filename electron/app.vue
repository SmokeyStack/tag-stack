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
                <ResizablePanel
                    class="h-full"
                    :min-size="21"
                    :default-size="79">
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
                                        v-for="(image, index) in output"
                                        :key="image"
                                        class="relative w-32 h-32 overflow-hidden hover:outline hover:outline-blue-500">
                                        <template v-if="!isSquare(index)">
                                            <NuxtImg
                                                :src="image"
                                                :alt="image"
                                                class="w-full h-full object-cover blur" />
                                        </template>
                                        <div
                                            class="absolute inset-0 flex justify-center items-center">
                                            <NuxtImg
                                                :src="image"
                                                :alt="image"
                                                class="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                </div>
                                <div v-else>No images available</div>
                            </div>
                        </div>
                    </ScrollArea>
                </ResizablePanel>
                <ResizableHandle with-handle />
                <ResizablePanel
                    class="h-full"
                    :min-size="21"
                    :default-size="21">
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

    import { ref } from 'vue';
    import { resizeImage } from '@/utils/resize_image';

    const output = ref<string[]>([]);
    const loading = ref<boolean>(false);
    const image_dimensions = ref<{ width: number; height: number }[]>([]);

    function openGithub() {
        window.ipcRenderer.invoke(
            'app-open-url',
            'https://github.com/SmokeyStack/tag-stack'
        );
    }

    function isSquare(index: number) {
        const dimensions = image_dimensions.value[index];
        return dimensions && dimensions.width === dimensions.height;
    }

    async function fetchData() {
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
            const pixel_ratio = window.devicePixelRatio;
            data.value!.forEach(async (img, index) => {
                const resizedImg = await resizeImage(img, pixel_ratio);
                output.value[index] = resizedImg;
                const image = new Image();
                image.src = resizedImg;
                image.onload = () => {
                    image_dimensions.value[index] = {
                        width: image.width,
                        height: image.height
                    };
                };
            });
        } catch (error) {
            console.error(`Failed to fetch data: ${error}`);
        } finally {
            loading.value = false;
        }
    }

    function refreshData() {
        fetchData();
    }
</script>
