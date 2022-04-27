const {
    ipcRenderer,
    remote,
} = require('electron');

const currentWindow = remote.getCurrentWindow();

const sharedLocale = remote.getGlobal('locale');

// 浏览器环境调用
const window = global;
window.RongDesktop = {
    ipcRenderer,
    locale: sharedLocale.getLocale(),
    closeWin() {
        currentWindow.close();
    },
};
window.require = remote.require;
