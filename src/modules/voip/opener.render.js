const { ipcRenderer } = require('electron');

module.exports = {
    /**
     * @param {{ userid, locale, navi, token, appkey }} options
     */
    open(options) {
        ipcRenderer.send('openVoip', options);
    },
    IMRequest(params) {
        ipcRenderer.send('IMRequest', params);
    },
    show() { // 原方法 showVoip
        ipcRenderer.send('showVoip');
    },
};
