const { remote } = require('electron');

const { BrowserWindow } = remote;

module.exports = {
    openCacheFolder() {
        const path = remote.app.getPath('userData');
        if (remote.shell) {
            remote.shell.showItemInFolder(path);
        }
    },
    enableVueDevtool(path) {
        BrowserWindow.addDevToolsExtension(path);
    },
};
