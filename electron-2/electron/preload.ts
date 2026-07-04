import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, type ElectronApi } from '../shared/ipc';

const api: ElectronApi = {
    openDirectoryDialog: () =>
        ipcRenderer.invoke(IpcChannels.openDirectoryDialog),
    listDirectory: (directory) =>
        ipcRenderer.invoke(IpcChannels.listDirectory, directory)
};

contextBridge.exposeInMainWorld('api', api);
