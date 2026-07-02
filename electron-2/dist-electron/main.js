import { BrowserWindow as e, app as t } from "electron";
//#region electron/main.ts
function n() {
	let t = new e({
		width: 1920,
		height: 1080,
		center: !0,
		autoHideMenuBar: !0
	});
	process.env.VITE_DEV_SERVER_URL ? t.loadURL(process.env.VITE_DEV_SERVER_URL) : t.loadFile(path.join(process.env.VITE_PUBLIC, "index.html"));
}
t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
}), t.whenReady().then(() => {
	n();
});
//#endregion
export {};
