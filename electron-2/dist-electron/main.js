import { BrowserWindow as e, app as t } from "electron";
//#region electron/main.ts
t.whenReady().then(() => {
	new e().loadURL(process.env.VITE_DEV_SERVER_URL);
});
//#endregion
export {};
