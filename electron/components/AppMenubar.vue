<template>
    <Menubar>
        <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
                <MenubarItem> To be implemented </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <Dialog>
            <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                    <DialogTrigger asChild>
                        <MenubarItem>
                            <span>Manage Tags</span>
                        </MenubarItem>
                    </DialogTrigger>
                </MenubarContent>
            </MenubarMenu>
            <TagManager />
        </Dialog>
        <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
                <MenubarItem @click="openGithub">
                    Visit Github Repository
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
</template>

<script setup lang="ts">
    import {
        Menubar,
        MenubarContent,
        MenubarItem,
        MenubarMenu,
        MenubarTrigger
    } from '@/components/ui/menubar';
    import { Dialog, DialogTrigger } from '@/components/ui/dialog';

    function openGithub() {
        window.ipcRenderer.invoke(
            'app-open-url',
            'https://github.com/SmokeyStack/tag-stack'
        );
    }
</script>
