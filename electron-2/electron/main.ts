import { app, BrowserWindow } from 'electron';

function createWindow() {
    const window = new BrowserWindow({
        width: 1920,
        height: 1080,
        center: true,
        autoHideMenuBar: true
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        window.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        window.loadFile(path.join(process.env.VITE_PUBLIC!, 'index.html'));
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
