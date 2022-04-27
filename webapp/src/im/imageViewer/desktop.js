export default {
    openWin(options) {
        RongDesktop.imageViewerOpener.open(options);
    },
    close() {
        RongDesktop.imageViewerOpener.close();
    },
    logout() {
        RongDesktop.imageViewerOpener.logout();
    },
    recall(messageUId) {
        RongDesktop.imageViewerOpener.recall(messageUId);
    },
};
