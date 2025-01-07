<script setup lang="ts">
    const tags = useState<Tag[]>('appTags');
    const emit = defineEmits(['select-tag']);
</script>

<template>
    <DialogContent
        class="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
        <DialogHeader class="p-6 pb-0">
            <DialogTitle class="text-center">Tags</DialogTitle>
            <Command>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            v-for="tag in tags"
                            :key="tag.id"
                            :value="tag.name">
                            <div
                                class="w-full gap-2 items-center rounded-md px-3 py-2 text-sm">
                                <div class="h-6 items-center rounded">
                                    <div
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
                                        class="py-1 px-2 text-sm rounded font-semibold text-center"
                                        @click="emit('select-tag', tag)">
                                        {{ tag.name }}
                                    </div>
                                </div>
                            </div>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </DialogHeader>
    </DialogContent>
</template>
