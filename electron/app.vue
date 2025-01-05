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
                            <template v-if="selected_image">
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
                                                {{ selected_image?.extension }}
                                                -
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
                            </template>
                            <div class="flex p-6">
                                <TagsInput v-model="tags">
                                    <TagsInputItem
                                        v-for="tag in tags"
                                        :key="tag"
                                        :value="tag"
                                        class="text-[#164f3e] bg-[#4aed90] outline outline-[#79f2b1]">
                                        <TagsInputItemText />
                                        <TagsInputItemDelete
                                            :style="{
                                                color: '#164f3e'
                                            }" />
                                    </TagsInputItem>
                                    <TagsInputInput placeholder="+" />
                                </TagsInput>
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
    import {
        TagsInput,
        TagsInputInput,
        TagsInputItem,
        TagsInputItemDelete,
        TagsInputItemText
    } from '@/components/ui/tags-input';

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
    const tags = ref<string[]>([]);

    async function fetchData() {
        loading.value = true;

        try {
            const file_path = await window.ipcRenderer.invoke(
                'app-open-file-dialog'
            );
            const files = await $fetch('/api/fetch_files', {
                query: { data: file_path }
            });
            const new_image_data: ImageData[] = await Promise.all(
                files.map(async (source) => {
                    const image = new Image();
                    image.src = source.path;

                    return new Promise<ImageData>((resolve) => {
                        image.onload = async () => {
                            let resized_image = source.path;

                            if (image.width < 256 || image.height < 256)
                                resized_image = await resizeImage(source.path);

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
    onMounted(async () => {
        const tags_temp = [
            {
                id: 0,
                name: 'Archived',
                aliases: ['Archive'],
                color: 'Red'
            },
            {
                id: 1,
                name: 'Favorite',
                aliases: ['Favorited', 'Favorites'],
                color: 'Yellow'
            },
            {
                id: 1000,
                name: 'Deferred Rendering',
                shorthand: 'dr',
                aliases: ['shaders'],
                color: 'mint'
            }
        ];
        await window.ipcRenderer.invoke(
            'sqlite-operations',
            'run',
            'CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, name TEXT, shorthand TEXT, color TEXT)'
        );
        await window.ipcRenderer.invoke(
            'sqlite-operations',
            'run',
            'CREATE TABLE IF NOT EXISTS aliases (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_id INTEGER, alias TEXT, UNIQUE (tag_id, alias), FOREIGN KEY (tag_id) REFERENCES tags (id))'
        );
        for (const tag of tags_temp) {
            await window.ipcRenderer.invoke(
                'sqlite-operations',
                'run',
                'INSERT OR REPLACE INTO tags (id, name, shorthand, color) VALUES (?, ?, ?, ?)',
                [tag.id, tag.name, tag.shorthand || null, tag.color]
            );
            for (const alias of tag.aliases) {
                await window.ipcRenderer.invoke(
                    'sqlite-operations',
                    'run',
                    'INSERT OR IGNORE INTO aliases (tag_id, alias) VALUES (?, ?)',
                    [tag.id, alias]
                );
            }
        }
        const tags_result = await window.ipcRenderer.invoke(
            'sqlite-operations',
            'each',
            'SELECT * FROM tags'
        );
        tags_result.forEach((tag: { name: string }) => {
            tags.value.push(tag.name);
        });
        await window.ipcRenderer.invoke(
            'sqlite-operations',
            'each',
            'SELECT * FROM aliases'
        );
    });
</script>
