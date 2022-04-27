const { remote, ipcRenderer } = require('electron');

const currentWindow = remote.getCurrentWindow();
const { platform } = require('../../utils');

module.exports = {
    on(event, listener) {
        currentWindow.addListener(event, listener);
    },
    off(event, listener) {
        currentWindow.removeListener(event, listener);
    },
    max() {
        currentWindow.maximize();
    },
    min() {
        currentWindow.minimize();
    },
    restore() {
        if (currentWindow.isMaximized) {
            currentWindow.unmaximize();
        } else if (currentWindow.isMinimized) {
            currentWindow.restore();
        }
    },
    close() {
        currentWindow.close();
    },
    bringFront(isOnTop) {
        currentWindow.setAlwaysOnTop(isOnTop);
    },
    focus() {
        currentWindow.focus();
    },
    isFocused() {
        return currentWindow.isFocused();
    },
    showInactive() {
        currentWindow.showInactive();
    },
    hide() {
        currentWindow.hide();
    },
    show() {
        currentWindow.show();
    },
    updateBadgeNumber(unreadCount, showCount) {
        ipcRenderer.send('badge-changed', unreadCount, showCount);
    },
    displayBalloon(title, content) {
        if (platform.win32) {
            ipcRenderer.send('display-balloon', title, content);
        }
    },
    // windows only;
    // Don’t forget to call the flashFrame method with false to turn off the flash.
    // In the above example, it is called when the window comes into focus,
    // but you might use a timeout or some other event to disable it.
    flashFrame(enabled) {
        ipcRenderer.send('flash-frame', enabled || true);
    },
    shakeWindow(config) {
        ipcRenderer.send('shake-window', config);
    },
    quit() {
        ipcRenderer.send('quit');
    },
    isVisible() {
        return currentWindow.isVisible();
    },
    toggleDevTools() {
        currentWindow.webContents.toggleDevTools();
    },
};
