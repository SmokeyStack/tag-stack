<template>
    <Menubar>
        <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
                <MenubarItem> To be implemented </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
                <MenubarItem> To be implemented </MenubarItem>
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
</template>

<script setup lang="ts">
    import {
        Menubar,
        MenubarContent,
        MenubarItem,
        MenubarMenu,
        MenubarTrigger
    } from '@/components/ui/menubar';

    import * as shell from '@tauri-apps/plugin-shell';

    function openGithub() {
        shell.open('https://github.com/SmokeyStack/tag-stack');
    }
</script>
