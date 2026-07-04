import type { ElectronApi } from '#shared/ipc';

export function useElectronApi(): ElectronApi | null {
    return typeof window !== 'undefined' && window.api ? window.api : null;
}
