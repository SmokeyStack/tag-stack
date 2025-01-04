<template>
    <div class="h-screen flex flex-col">
        <AppMenubar />
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
                                            <img
                                                :src="image"
                                                :alt="image"
                                                class="w-full h-full object-cover blur" />
                                        </template>
                                        <div
                                            class="absolute inset-0 flex justify-center items-center">
                                            <img
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

    function isSquare(index: number): boolean {
        const dimensions = image_dimensions.value[index];
        return dimensions && dimensions.width === dimensions.height;
    }

    async function fetchData() {
        loading.value = true;

        try {
            const file_path = await window.ipcRenderer.invoke(
                'app-open-file-dialog'
            );
            const data: string[] = await $fetch('/api/fetch_files', {
                query: { data: file_path }
            });
            output.value = data!;
            data.forEach((img: string, index: number) => {
                const image = new Image();
                image.src = img;
                image.onload = () => {
                    image_dimensions.value[index] = {
                        width: image.width,
                        height: image.height
                    };
                };
            });
            data.forEach((image: string, index: number) => {
                resizeImage(image)
                    .then((resized_image) => {
                        output.value[index] = resized_image;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
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
