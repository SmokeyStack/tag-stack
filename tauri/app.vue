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
                                    v-else-if="image_data.length"
                                    class="grid grid-cols-custom-3 gap-4">
                                    <div
                                        v-for="image in image_data"
                                        :key="image.url"
                                        class="relative w-32 h-32 overflow-hidden hover:outline hover:outline-blue-500">
                                        <template v-if="!image.is_square">
                                            <img
                                                :src="image.url"
                                                :alt="image.url"
                                                class="w-full h-full object-cover blur" />
                                        </template>
                                        <div
                                            class="absolute inset-0 flex justify-center items-center">
                                            <img
                                                :src="image.url"
                                                :alt="image.url"
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

    import * as core from '@tauri-apps/api/core';
    import * as dialog from '@tauri-apps/plugin-dialog';

    import { ref } from 'vue';
    import { resizeImage } from '@/utils/resize_image';

    interface ImageData {
        url: string;
        width: number;
        height: number;
        is_square: boolean;
    }

    const image_data = ref<ImageData[]>([]);
    const loading = ref<boolean>(false);

    async function fetchData() {
        loading.value = true;

        try {
            const file_path: string | null = await dialog.open({
                multiple: false,
                directory: true
            });
            const files: string[] = await $fetch('/api/fetch_files', {
                query: { data: file_path }
            });
            const new_image_data: ImageData[] = await Promise.all(
                files.map(async (source: string) => {
                    const converted_image: string = core.convertFileSrc(source);
                    const image = new Image();
                    image.src = converted_image;

                    return new Promise<ImageData>((resolve) => {
                        image.onload = async () => {
                            let resized_image = converted_image;

                            if (image.width < 1024 || image.height < 1024) {
                                resizeImage(source).then((result) => {
                                    resolve({
                                        url: result,
                                        width: image.width,
                                        height: image.height,
                                        is_square: image.width === image.height
                                    });
                                });
                            } else {
                                resolve({
                                    url: resized_image,
                                    width: image.width,
                                    height: image.height,
                                    is_square: image.width === image.height
                                });
                            }
                        };
                    });
                })
            );
            image_data.value = new_image_data;
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
