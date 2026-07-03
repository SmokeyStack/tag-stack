import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronApi } from './contracts';

const api: ElectronApi = {
    getAppStartTime: () => ipcRenderer.invoke('app:get-start-time'),
    openFileDialog: () => ipcRenderer.invoke('dialog:open-files')
};

contextBridge.exposeInMainWorld('api', api);
