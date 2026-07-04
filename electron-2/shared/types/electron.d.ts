import type { ElectronApi } from '#shared/ipc';

export {};

declare global {
    interface Window {
        api: ElectronApi;
    }
}
