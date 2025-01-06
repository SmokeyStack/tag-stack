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
                                <Button @click="getImages"> Get Images </Button>
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
                                <TagsInput
                                    v-model="tags"
                                    class="w-full h-m-16 p-4">
                                    <TagsInputItem
                                        v-for="tag in tags"
                                        :key="tag.id"
                                        :value="tag.name"
                                        :style="{
                                            color: TAG_COLORS[
                                                tag.color as keyof typeof TAG_COLORS
                                            ]?.TEXT,
                                            background: TAG_COLORS[
                                                tag.color as keyof typeof TAG_COLORS
                                            ]?.PRIMARY,
                                            outline: `2px solid ${TAG_COLORS[
                                                tag.color as keyof typeof TAG_COLORS
                                            ]?.BORDER}`
                                        }"
                                        class="font-semibold text-center">
                                        <TagsInputItemText />
                                        <TagsInputItemDelete
                                            :style="{
                                                color: TAG_COLORS[
                                                tag.color as keyof typeof TAG_COLORS
                                            ]?.TEXT
                                            }" />
                                    </TagsInputItem>
                                    <Plus
                                        class="w-4 h-4"
                                        @click="open = true" />
                                    <CommandDialog v-model:open="open">
                                        <CommandInput
                                            placeholder="Search Tags" />
                                        <CommandList>
                                            <CommandEmpty>
                                                No results found.
                                            </CommandEmpty>
                                            <CommandGroup heading="Tags">
                                                <CommandItem
                                                    v-for="tag in tags"
                                                    :key="tag.id"
                                                    :value="tag.name"
                                                    @select.prevent="
                                                        handleTagSelect(tag)
                                                    ">
                                                    {{ tag.name }}
                                                </CommandItem>
                                            </CommandGroup>
                                        </CommandList>
                                    </CommandDialog>
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
        TagsInputItem,
        TagsInputItemDelete,
        TagsInputItemText
    } from '@/components/ui/tags-input';
    import {
        CommandEmpty,
        CommandGroup,
        CommandItem,
        CommandList
    } from '@/components/ui/command';
    import { Plus } from 'lucide-vue-next';

    import { ref } from 'vue';
    import { resizeImage } from '@/utils/resize_image';
    import { fetchTags } from '@/composables/fetch_tags';

    const image_data = ref<TagStackImageData[]>([]);
    const selected_image = ref<TagStackImageData | null>(null);
    const loading = ref<boolean>(false);
    const open = ref(false);
    const tags = ref<Tag[]>([]);
    const available_tags: Tag[] = [];
    const search_term = ref('');
    const filteredTags = computed(() =>
        available_tags.filter((i) => !tags.value.includes(i))
    );

    async function openDialog(): Promise<string | null> {
        return await window.ipcRenderer.invoke('app-open-file-dialog');
    }
    async function fetchFiles(file_path: string): Promise<FileData[]> {
        try {
            return await $fetch('/api/fetch_files', {
                query: { data: file_path }
            });
        } catch (error) {
            console.error('Error fetching files:', error);
            throw new Error('Failed to fetch files.');
        }
    }
    async function processImage(image: FileData): Promise<TagStackImageData> {
        return new Promise<TagStackImageData>((resolve) => {
            const image_reader = new Image();
            image_reader.src = image.file_path;
            image_reader.onload = async () => {
                if (image_reader.width < 256 || image_reader.height < 256) {
                    const result = await resizeImage(image.file_path);
                    resolve(
                        createTagStackImageData(result, image, image_reader)
                    );
                } else
                    resolve(
                        createTagStackImageData(
                            image.file_path,
                            image,
                            image_reader
                        )
                    );
            };
        });
    }
    function createTagStackImageData(
        url: string,
        source: FileData,
        image: HTMLImageElement
    ): TagStackImageData {
        return {
            url,
            width: image.width,
            height: image.height,
            is_square: image.width === image.height,
            directory: source.file_path.substring(
                0,
                source.file_path.lastIndexOf('\\')
            ),
            filename: source.file_path.substring(
                source.file_path.lastIndexOf('\\') + 1
            ),
            extension: getExtension(source.file_path),
            size: source.file_size
        };
    }
    async function getImages() {
        loading.value = true;

        try {
            const file_path: string | null = await openDialog();

            if (!file_path) throw new Error('No file path selected.');

            const files: FileData[] = await fetchFiles(file_path);
            const new_image_data: TagStackImageData[] = await Promise.all(
                files.map(processImage)
            );
            image_data.value = new_image_data;
        } catch (error) {
            console.error(
                `An error occurred while trying to get images: ${error}`
            );
        } finally {
            loading.value = false;
        }
    }
    function selectImage(image: TagStackImageData) {
        selected_image.value = image;
    }
    function getExtension(url: string): string {
        return url.split('.').pop()!.toUpperCase();
    }
    function handleTagSelect(tag: Tag) {
        if (typeof tag === 'string') {
            search_term.value = '';
            tags.value.push(tag);
        }
        if (filteredTags.value.length === 0) open.value = false;
    }
    onMounted(async () => {
        const tags_temp = [
            {
                id: 0,
                name: 'Archived',
                aliases: ['Archive'],
                color: 'RED'
            },
            {
                id: 1,
                name: 'Favorite',
                aliases: ['Favorited', 'Favorites'],
                color: 'YELLOW'
            },
            {
                id: 1000,
                name: 'Deferred Rendering',
                shorthand: 'dr',
                aliases: ['shaders'],
                color: 'MINT'
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

            for (const alias of tag.aliases)
                await window.ipcRenderer.invoke(
                    'sqlite-operations',
                    'run',
                    'INSERT OR IGNORE INTO aliases (tag_id, alias) VALUES (?, ?)',
                    [tag.id, alias]
                );
        }

        const fetchedTags = await fetchTags();
        available_tags.push(...fetchedTags);
        tags.value.push(...fetchedTags);
    });
</script>
