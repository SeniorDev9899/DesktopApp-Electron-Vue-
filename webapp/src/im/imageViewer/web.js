const noop = $.noop;

export default {
    openWin(options) {
        window.ImageViewer.dialog.viewerWeb(options);
    },
    close: noop,
    logout: noop,
    recall(messageUId) {
        // TODO: 后续需解耦 RongIM.instance
        const im = window.RongIM.instance;
        im.$emit('recallMsg', messageUId);
    },
};
