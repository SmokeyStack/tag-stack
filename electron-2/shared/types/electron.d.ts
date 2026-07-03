import type { ElectronApi } from '../../electron/contracts';

export {};

declare global {
    interface Window {
        api: ElectronApi;
    }
}
