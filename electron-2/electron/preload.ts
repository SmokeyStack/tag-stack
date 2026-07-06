import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, type ElectronApi } from '../shared/ipc';

const api: ElectronApi = {
    openDirectoryDialog: () =>
        ipcRenderer.invoke(IpcChannels.openDirectoryDialog),
    listDirectory: (directory) =>
        ipcRenderer.invoke(IpcChannels.listDirectory, directory),
    createLibrary: () => ipcRenderer.invoke(IpcChannels.createLibrary),
    closeLibrary: () => ipcRenderer.invoke(IpcChannels.closeLibrary),
    currentLibrary: () => ipcRenderer.invoke(IpcChannels.currentLibrary),
    openLibrary: (root) => ipcRenderer.invoke(IpcChannels.openLibrary, root),
    recentLibraries: () => ipcRenderer.invoke(IpcChannels.recentLibraries),
    removeRecentLibrary: (root) =>
        ipcRenderer.invoke(IpcChannels.removeRecentLibrary, root),
    rescanLibrary: () => ipcRenderer.invoke(IpcChannels.rescanLibrary),
    listTags: () => ipcRenderer.invoke(IpcChannels.listTags),
    createTag: (input) => ipcRenderer.invoke(IpcChannels.createTag, input),
    updateTag: (id, patch) =>
        ipcRenderer.invoke(IpcChannels.updateTag, id, patch),
    deleteTag: (id) => ipcRenderer.invoke(IpcChannels.deleteTag, id),
    listEntries: () => ipcRenderer.invoke(IpcChannels.listEntries),
    assignTag: (entryId, tagId) =>
        ipcRenderer.invoke(IpcChannels.assignTag, entryId, tagId),
    unassignTag: (entryId, tagId) =>
        ipcRenderer.invoke(IpcChannels.unassignTag, entryId, tagId)
};

contextBridge.exposeInMainWorld('api', api);
