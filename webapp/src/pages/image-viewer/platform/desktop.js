/* eslint-disable no-param-reassign */
export default function (ImageViewer) {
    ImageViewer.browserWindow = RongDesktop.imageViewer.window;
    ImageViewer.download = RongDesktop.download;
    ImageViewer.options = RongDesktop.imageViewer.options;
    ImageViewer.system = RongDesktop.imageViewer.system;
    ImageViewer.cache = RongDesktop.cache;
    ImageViewer.browserWindow.on('maximize', () => {
        if (ImageViewer.instance) {
            ImageViewer.instance.isMaxWindow = true;
        }
    });
    ImageViewer.browserWindow.on('unmaximize', () => {
        if (ImageViewer.instance) {
            ImageViewer.instance.isMaxWindow = false;
        }
    });

    RongDesktop.ipcRenderer.on('update', (event, _options) => {
        if (ImageViewer.onUpdate) {
            ImageViewer.onUpdate(_options);
        }
    });

    RongDesktop.ipcRenderer.on('closeImageViewer', (/* event */) => {
        if (ImageViewer.onClose) {
            ImageViewer.onClose();
        }
    });

    RongDesktop.ipcRenderer.on('logout', (/* event */) => {
        if (ImageViewer.onLogout) {
            ImageViewer.onLogout();
        }
    });

    RongDesktop.ipcRenderer.on('recallMessage', (event, messageUId) => {
        if (ImageViewer.onRecall) {
            ImageViewer.onRecall(messageUId);
        }
    });
}
