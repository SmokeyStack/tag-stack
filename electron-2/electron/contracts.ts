export interface ElectronApi {
    getAppStartTime: () => Promise<string>;
    openFileDialog: () => Promise<string[]>;
}
