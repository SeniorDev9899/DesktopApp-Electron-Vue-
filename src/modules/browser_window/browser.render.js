const {
    ipcRenderer,
} = require('electron');

/* params {
    path:新窗口地址, 必填
    isLocal: 是否打开本地页面, 为true时path应该是相对路径, 非必填
    id: 记录该窗口的Id, 不填则为path, 非必填
} */
const create = function (params) {
    ipcRenderer.send('create', params);
};

const close = function (path) {
    ipcRenderer.send('close', path);
};

const closeAll = function () {
    ipcRenderer.send('closeAll');
};

const command = function (params) {
    ipcRenderer.send('browserWinCommand', params);
};

const sendNotify = function (params) {
    ipcRenderer.send('closeApp', params);
};

module.exports = {
    create,
    close,
    closeAll,
    command,
    sendNotify,
};
