const {
    ipcRenderer,
} = require('electron');

const { desktopCapturer } = require('electron');

const window = global;

require('@rongcloud/electron-solution/renderer');

window.RongIMLib = require('@rongcloud/imlib-v2');

window.RongDesktop = window.RongDesktop || {};
window.RongDesktop.ipcRenderer = ipcRenderer;
window.RongDesktop.voip = require('../modules/voip/voip.render');

window.RongDesktop.desktopCapturer = desktopCapturer;
window.RongDesktop.toggleDevTools = function toggleDevTools() {
    ipcRenderer.send('toggleDevToolsVoip');
};
