<template>
    <Dialog v-model:open="open">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
            </DialogHeader>
            <DialogDescription>
                <form @submit.prevent="onSubmit" class="space-y-6">
                    <FormField v-slot="{ componentField }" name="name">
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input type="text" v-bind="componentField" />
                            </FormControl>
                            <FormDescription>
                                The normal name of the tag, with no shortening
                                or specification.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="shorthand">
                        <FormItem>
                            <FormLabel>Shorthand</FormLabel>
                            <FormControl>
                                <Input type="text" v-bind="componentField" />
                            </FormControl>
                            <FormDescription>
                                The shorthand name for the tag. Works like an
                                alias but is used for specific display purposes.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="aliases">
                        <FormItem>
                            <FormLabel>Aliases</FormLabel>
                            <FormControl>
                                <Input type="text" v-bind="componentField" />
                            </FormControl>
                            <FormDescription>
                                Alternate names for the tag.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="color">
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                                <Input type="text" v-bind="componentField" />
                            </FormControl>
                            <FormDescription>
                                A color name string for customizing the tag's
                                display color.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <DialogFooter>
                        <DialogClose as-child>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogDescription>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { toTypedSchema } from '@vee-validate/zod';
    import { useForm } from 'vee-validate';
    import { z } from 'zod';
    import * as sql from '@tauri-apps/plugin-sql';

    const open = ref(false);
    const emit = defineEmits(['create-tag-submit']);
    const formSchema = toTypedSchema(
        z.object({
            name: z.string().min(1).max(50),
            shorthand: z.string().min(1).max(50).optional(),
            aliases: z.array(z.string()).optional(),
            color: z.string().min(1).max(50).optional()
        })
    );
    const form = useForm({
        validationSchema: formSchema
    });

    async function nextId() {
        const db = await sql.default.load(`sqlite:db/tags.db`);

        try {
            const result: any[] = await db.select(
                'SELECT MAX(id) as max_id FROM tags'
            );
            console.log(JSON.stringify(result));

            return result[0].max_id + 1;
        } catch (error) {
            console.error(`Error getting next tag ID: ${error}`);
            throw new Error('Failed to get next tag ID');
        } finally {
            await db.close();
        }
    }
    function onSubmit() {
        form.handleSubmit(async (tag) => {
            const id = await nextId();
            const db = await sql.default.load(`sqlite:db/tags.db`);

            try {
                await db.execute(
                    'INSERT OR REPLACE INTO tags (id, name, shorthand, color) VALUES ($1, $2, $3, $4)',
                    [id, tag.name, tag.shorthand || null, tag.color]
                );
                if (tag.aliases)
                    for (const alias of tag.aliases)
                        await db.execute(
                            'INSERT OR REPLACE INTO tag_aliases (tag_id, alias) VALUES ($1, $2)',
                            [id, alias]
                        );
                emit('create-tag-submit');
                useState<Tag[]>('appTags').value = await fetchTags();
            } catch (error) {
                console.error(`Error saving tag: ${error}`);
                throw new Error('Failed to save tag');
            } finally {
                await db.close();
            }
        })();
    }
</script>
