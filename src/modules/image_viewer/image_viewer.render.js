const { remote } = require('electron');

const currentWindow = remote.getCurrentWindow();
const { BrowserWindow } = remote;
module.exports = {
    window: {
        on(event, listener) {
            currentWindow.addListener(event, listener);
        },
        max() {
            currentWindow.maximize();
        },
        unmax() {
            currentWindow.unmaximize();
        },
        min() {
            currentWindow.minimize();
        },
        restore() {
            currentWindow.restore();
        },
        close() {
            currentWindow.close();
        },
        bringFront() {
            currentWindow.setAlwaysOnTop(false);
        },
        focus() {
            currentWindow.focus();
        },
        showInactive() {
            currentWindow.showInactive();
        },
        hide() {
            currentWindow.hide();
        },
        show(show) {
            if (show) {
                currentWindow.show();
            } else {
                currentWindow.hide();
            }
        },
        center() {
            // BrowserWindow.imageWindow.center();
        },
        reload() {
            // BrowserWindow.imageWindow.reload();
        },
        setFullScreen(isFull) {
            currentWindow.setFullScreen(isFull);
        },
        setMinimumSize(width, height) {
            currentWindow.setMinimumSize(width, height);
        },
        currentWindow,
    },
    system: {
        platform: process.platform,
        getWorkAreaSize() {
            return BrowserWindow.mainWindow.getWorkAreaSize();
        },
    },
};
