
const {
    app,
    ipcMain,
} = require('electron');
const ImageViewer = require('../../windows/image_viewer');

module.exports = {
    init() {
        const imageViewer = new ImageViewer({ show: false, dataSource: [] });
        // imageViewer.toggleDevTools();

        app.on('before-quit', () => {
            imageViewer.close();
        });

        ipcMain.on('openImageViewer', (event, options) => {
            imageViewer.changed(options);
            imageViewer.show();
        });

        ipcMain.on('closeImageViewer', () => {
            imageViewer.close();
        });

        ipcMain.on('logoutImageViewer', () => {
            imageViewer.logout();
        });

        ipcMain.on('showImageViewer', () => {
            imageViewer.show();
        });
        ipcMain.on('recallMessage', (event, messageUId) => {
            imageViewer.recallMessage(messageUId);
        });
    },
};
