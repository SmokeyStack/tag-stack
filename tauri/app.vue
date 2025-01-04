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
                                        class="relative w-32 h-32 overflow-hidden hover:outline hover:outline-blue-500"
                                        :class="{
                                            'outline outline-blue-500':
                                                selected_image === image
                                        }"
                                        @click="selectImage(image)">
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
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel :min-size="40" :default-size="25">
                            <div
                                class="h-full p-4 flex items-center justify-center">
                                <template v-if="selected_image">
                                    <img
                                        :src="selected_image.url"
                                        alt="Selected Image"
                                        class="w-full h-full object-contain" />
                                </template>
                                <template v-else> Two </template>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle with-handle />
                        <ResizablePanel :min-size="40" :default-size="75">
                            <div class="flex p-6">
                                <div class="flex flex-col">
                                    <div>
                                        <span>
                                            {{ selected_image?.directory }}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="font-semibold">
                                            {{ selected_image?.filename }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex pl-6">
                                <div class="flex flex-col">
                                    <div>
                                        <span class="font-semibold">
                                            {{ selected_image?.extension }} -
                                            {{ selected_image?.size }}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="font-semibold">
                                            {{ selected_image?.width }} x
                                            {{ selected_image?.height }} px
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
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
        directory: string;
        filename: string;
        extension: string;
        size: string;
    }

    const image_data = ref<ImageData[]>([]);
    const selected_image = ref<ImageData | null>(null);
    const loading = ref<boolean>(false);

    async function fetchData() {
        loading.value = true;

        try {
            const file_path: string | null = await dialog.open({
                multiple: false,
                directory: true
            });
            const files = await $fetch('/api/fetch_files', {
                query: { data: file_path }
            });
            const new_image_data: ImageData[] = await Promise.all(
                files.map(async (source) => {
                    const converted_image: string = core.convertFileSrc(
                        source.path
                    );
                    const image = new Image();
                    image.src = converted_image;

                    return new Promise<ImageData>((resolve) => {
                        image.onload = async () => {
                            let resized_image = converted_image;

                            if (image.width < 256 || image.height < 256) {
                                resizeImage(source.path).then((result) => {
                                    resolve({
                                        url: result,
                                        width: image.width,
                                        height: image.height,
                                        is_square: image.width === image.height,
                                        directory: source.path.substring(
                                            0,
                                            source.path.lastIndexOf('\\')
                                        ),
                                        filename: source.path.substring(
                                            source.path.lastIndexOf('\\') + 1
                                        ),
                                        extension: getExtension(source.path),
                                        size: source.size
                                    });
                                });
                            } else {
                                resolve({
                                    url: resized_image,
                                    width: image.width,
                                    height: image.height,
                                    is_square: image.width === image.height,
                                    directory: source.path.substring(
                                        0,
                                        source.path.lastIndexOf('\\')
                                    ),
                                    filename: source.path.substring(
                                        source.path.lastIndexOf('\\') + 1
                                    ),
                                    extension: getExtension(source.path),
                                    size: source.size
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
    function selectImage(image: ImageData) {
        selected_image.value = image;
    }
    function getExtension(url: string): string {
        return url.split('.').pop()!.toUpperCase();
    }
</script>
