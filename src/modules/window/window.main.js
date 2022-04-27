
const {
    app,
    BrowserWindow,
    ipcMain,
} = require('electron');
// const path = require('path');
const { platform } = require('../../utils');

ipcMain.on('badge-changed', (event, unreadCount, showCount) => {
    if (platform.darwin) {
        setBadge(showCount);
    } else {
        BrowserWindow.tray.showBlink(unreadCount);
    }
});

ipcMain.on('display-balloon', (event, title, content) => {
    BrowserWindow.tray.displayBalloon(title, content);
});

ipcMain.on('flash-frame', (event, enabled) => {
    // if (platform.win32 && BrowserWindow.mainWindow) {
    if (BrowserWindow.mainWindow) {
        BrowserWindow.mainWindow.flashFrame(enabled);
    }
});

ipcMain.on('shake-window', (event, config) => {
    const currentWindow = BrowserWindow.mainWindow;
    if (currentWindow) {
        currentWindow.shakeWindow(config);
    }
});

ipcMain.on('quit', () => {
    app.quit();
});

function setBadge(showCount) {
    /**
     * 38485 - 【消息计数】MAC 端被踢下线后，应用消息计数显示了null
     * 方案A：在setBadge时判空就可以了。但未解决为什么logout失败
     */
    let unreadCount;
    if (showCount === null || showCount === 'null') {
        unreadCount = '';
    } else {
        unreadCount = showCount;
    }
    app.dock.setBadge(`${unreadCount}`);
    BrowserWindow.tray.setTitle(unreadCount);
}
