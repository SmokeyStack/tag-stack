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
                                <Button @click="getImages">Get Images</Button>
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
                                                - {{ selected_image?.size }}
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
                                <div class="flex p-6">
                                    <Dialog>
                                        <div
                                            class="flex flex-wrap gap-2 items-center rounded-md border border-input bg-background text-sm w-full h-m-16 p-4">
                                            <div
                                                v-for="tag in applied_tags"
                                                :key="tag.id"
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
                                                data-state="inactive"
                                                class="flex h-6 items-center rounded bg-secondary data-[state=active]:ring-ring data-[state=active]:ring-2 data-[state=active]:ring-offset-2 ring-offset-background font-semibold text-center">
                                                <span
                                                    class="py-1 px-2 text-sm rounded">
                                                    {{ tag.name }}
                                                </span>
                                                <div
                                                    @click="
                                                        handleTagDelete(tag)
                                                    "
                                                    class="flex rounded bg-transparent mr-1">
                                                    <X class="w-4 h-4" />
                                                </div>
                                            </div>
                                            <DialogTrigger asChild @click.stop>
                                                <Plus class="w-4 h-4" />
                                            </DialogTrigger>
                                            <TagManager
                                                @select-tag="handleTagSelect" />
                                        </div>
                                    </Dialog>
                                </div>
                            </template>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Plus, X } from 'lucide-vue-next';
    import * as core from '@tauri-apps/api/core';
    import * as path from '@tauri-apps/api/path';
    import * as dialog from '@tauri-apps/plugin-dialog';
    import * as fs from '@tauri-apps/plugin-fs';
    import * as sql from '@tauri-apps/plugin-sql';

    const image_data = ref<TagStackImageData[]>([]);
    const selected_image = ref<TagStackImageData | null>(null);
    const loading = ref<boolean>(false);
    const tags = useState<Tag[]>('appTags');
    const applied_tags = ref<Tag[]>([]);
    const search_term = ref('');
    const entries = useState<Entry[]>('appEntries');

    async function openDialog(): Promise<string | null> {
        try {
            return await dialog.open({ multiple: false, directory: true });
        } catch (error) {
            console.error('Error opening dialog:', error);
            throw new Error('Failed to open dialog.');
        }
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
            const converted_image = core.convertFileSrc(image.file_path);
            const image_reader = new Image();
            image_reader.src = converted_image;
            image_reader.onload = async () => {
                if (image_reader.width < 256 || image_reader.height < 256) {
                    const result = await resizeImage(image.file_path);
                    resolve(
                        createTagStackImageData(result, image, image_reader)
                    );
                } else
                    resolve(
                        createTagStackImageData(
                            converted_image,
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
            id: -1,
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

            for (const image of new_image_data) {
                const exists = await entryExists(image);

                if (!exists) await insertEntry(image);
                else image.id = exists;
            }

            entries.value = await fetchEntries();
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
        if (!image) return;

        const entry = entries.value.find((entry) => entry.id === image.id);

        if (!entry?.fields) return;

        const tag_ids: number[] =
            (entry.fields as { [key: string]: any })['tag_id'] ?? [];
        const tag_map: Map<number, Tag> = new Map(
            tags.value.map((tag) => [tag.id, tag])
        );
        applied_tags.value = tag_ids
            .filter((tag) => tag_map.has(tag))
            .map((tag) => tag_map.get(tag) as Tag);
    }
    function getExtension(url: string): string {
        return url.split('.').pop()!.toUpperCase();
    }
    async function handleTagSelect(tag: Tag) {
        search_term.value = '';

        if (!applied_tags.value.includes(tag)) {
            applied_tags.value.push(tag);
            if (selected_image.value)
                await insertTagIntoImage(selected_image.value.id, tag.id);
        }
    }
    function handleTagDelete(tag: Tag) {
        applied_tags.value.splice(applied_tags.value.indexOf(tag), 1);

        if (selected_image.value)
            removeTagFromImage(selected_image.value.id, tag.id);
    }
    async function insertEntry(entry: TagStackImageData) {
        const db = await sql.default.load('sqlite:db/tags.db');

        try {
            await db.execute(
                'INSERT INTO entries (filename, path) VALUES ($1, $2)',
                [entry.filename, entry.directory]
            );
            const result: any[] = await db.select(
                'SELECT MAX(id) as id FROM entries',
                [entry.filename, entry.directory]
            );
            entry.id = result[0].id;
            await db.execute(
                'INSERT INTO fields (entry_id, tag_id) VALUES ($1, $2)',
                [entry.id, 1]
            );
        } catch (error) {
            console.error(
                `An error occurred while trying to insert an entry: ${error}`
            );
            throw new Error('Failed to insert entry.');
        } finally {
            await db.close();
        }
    }
    async function entryExists(
        entry: TagStackImageData
    ): Promise<number | null> {
        const db = await sql.default.load('sqlite:db/tags.db');

        try {
            const result: any[] = await db.select(
                'SELECT id FROM entries WHERE filename = $1 AND path = $2',
                [entry.filename, entry.directory]
            );

            return result.length !== 0 ? result[0].id : null;
        } catch (error) {
            console.error(
                `An error occurred while trying to check if an entry exists: ${error}`
            );
            throw new Error('Failed to check if entry exists.');
        } finally {
            await db.close();
        }
    }
    async function removeTagFromImage(id: number, tag: number) {
        const db = await sql.default.load('sqlite:db/tags.db');

        try {
            await db.execute(
                'DELETE FROM fields WHERE entry_id = $1 AND tag_id = $2',
                [id, tag]
            );
            entries.value = await fetchEntries();
        } catch (error) {
            console.error('Error removing tag from image:', error);
            throw new Error('Failed to remove tag from image.');
        } finally {
            await db.close();
        }
    }
    async function insertTagIntoImage(id: number, tag: number) {
        const db = await sql.default.load('sqlite:db/tags.db');

        try {
            await db.execute(
                'INSERT INTO fields (entry_id, tag_id) VALUES ($1, $2)',
                [id, tag]
            );
            entries.value = await fetchEntries();
        } catch (error) {
            console.error('Error inserting tag into image:', error);
            throw new Error('Failed to inserting tag into image.');
        } finally {
            await db.close();
        }
    }
    onMounted(async () => {
        await callOnce(async () => {
            const default_tags = [
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
                }
            ];

            if (
                !(await fs.exists('db', {
                    baseDir: path.BaseDirectory.AppData
                }))
            )
                await fs.mkdir('db', { baseDir: path.BaseDirectory.AppData });

            const db = await sql.default.load(`sqlite:db/tags.db`);
            await db.execute(
                'CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, name TEXT, shorthand TEXT, color TEXT)'
            );
            await db.execute(
                'CREATE TABLE IF NOT EXISTS aliases (id INTEGER PRIMARY KEY AUTOINCREMENT, tag_id INTEGER, alias TEXT, UNIQUE (tag_id, alias), FOREIGN KEY (tag_id) REFERENCES tags (id))'
            );
            await db.execute(
                'CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, path TEXT NOT NULL)'
            );
            await db.execute(
                'CREATE TABLE IF NOT EXISTS fields (entry_id INTEGER, tag_id INTEGER, FOREIGN KEY (entry_id) REFERENCES entries (id))'
            );

            for (const tag of default_tags) {
                await db.execute(
                    'INSERT OR REPLACE INTO tags (id, name, shorthand, color) VALUES ($1, $2, $3, $4)',
                    [tag.id, tag.name, null, tag.color]
                );

                for (const alias of tag.aliases)
                    await db.execute(
                        'INSERT OR IGNORE INTO aliases (tag_id, alias) VALUES ($1, $2)',
                        [tag.id, alias]
                    );
            }
            await db.close();

            tags.value = await fetchTags();
        });
    });
</script>
