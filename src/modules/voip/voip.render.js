const { ipcRenderer, remote } = require('electron');

const currentWindow = remote.getCurrentWindow();
module.exports = {
    voipReady() {
        ipcRenderer.send('voipReady', currentWindow.id);
    },
    voipRequest(params) {
        ipcRenderer.send('voipRequest', params);
    },
    setBounds(params) {
        ipcRenderer.send('voipSetBounds', params);
    },
    setRingPos() {
        ipcRenderer.send('setRingPos');
    },
    voipLogger(levels, message) {
        ipcRenderer.send('voipLog', levels, message);
    },
    window: {
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
    },
};
