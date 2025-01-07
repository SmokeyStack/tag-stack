<template>
    <Menubar>
        <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
                <MenubarItem>To be implemented</MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
                <MenubarItem @click="openCreateTag = true">
                    <div class="w-full flex">
                        New Tag
                        <MenubarShortcut>Ctrl + T</MenubarShortcut>
                    </div>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                    <Dialog>
                        <DialogTrigger asChild @click.stop>
                            <span class="w-full flex">Manage Tags</span>
                        </DialogTrigger>
                        <TagManager />
                    </Dialog>
                </MenubarItem>
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
    <CreateTag
        v-model:open="openCreateTag"
        @create-tag-submit="openCreateTag = false" />
</template>

<script setup lang="ts">
    import { useMagicKeys } from '@vueuse/core';

    const openCreateTag = ref(false);
    const { Meta_T, Ctrl_T } = useMagicKeys({
        passive: false,
        onEventFired(e) {
            if (e.key === 't' && (e.metaKey || e.ctrlKey)) e.preventDefault();
        }
    });

    watch([Meta_T, Ctrl_T], (v) => {
        if (v[0] || v[1]) {
            openCreateTag.value = true;
        }
    });
    function openGithub() {
        window.ipcRenderer.invoke(
            'app-open-url',
            'https://github.com/SmokeyStack/tag-stack'
        );
    }
</script>
