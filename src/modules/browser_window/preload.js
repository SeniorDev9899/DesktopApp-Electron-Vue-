const { ipcRenderer, desktopCapturer } = require('electron');
const { remote } = require('electron');
const { shell } = require('electron');

require('@rongcloud/electron-solution/renderer');
const RongIMLib = require('@rongcloud/imlib-v2');

const { BrowserWindow } = remote;

const currentWindow = remote.getCurrentWindow();

let configInfo;

try {
    configInfo = remote.require('./config.js');
} catch (err) {
    configInfo = null;
}

// 浏览器环境运行
const window = global;

window.RongIMLib = RongIMLib;

window.RongDesktop = {
    system: require('../system/system.render'),
    shell,
    ipcRenderer,
    desktopCapturer,
    configInfo,
    require,
    remote,
    platform: process.platform,
    Win: {
        on(event, listener) {
            currentWindow.on(event, listener);
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
        show(show) {
            if (show) {
                currentWindow.show();
            } else {
                currentWindow.hide();
            }
        },
        enterPublic(params, callback) {
            ipcRenderer.send('openConversation', params);
            callback();
        },
    },
    Extra: {
        enableVueDevtool(path) {
            if (configInfo.DEBUG) {
                BrowserWindow.addDevToolsExtension(path);
            }
        },
    },
};
