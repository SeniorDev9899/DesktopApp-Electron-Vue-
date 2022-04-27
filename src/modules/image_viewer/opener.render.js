const { ipcRenderer } = require('electron');

module.exports = {
    open(options) {
        ipcRenderer.send('openImageViewer', options);
    },
    close() {
        ipcRenderer.send('closeImageViewer');
    },
    // 注销时通知窗口关闭图片查看器
    logout() {
        ipcRenderer.send('logoutImageViewer');
    },
    // 消息撤回,通知图片查看器更新
    recall(messageUId) {
        ipcRenderer.send('recallMessage', messageUId);
    },
};
