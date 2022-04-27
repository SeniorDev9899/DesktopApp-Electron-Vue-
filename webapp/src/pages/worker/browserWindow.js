const noop = $.noop;

export default IS_DESKTOP ? {
    max() {
        RongDesktop.Win.max();
    },
    min() {
        RongDesktop.Win.min();
    },
    restore() {
        RongDesktop.Win.restore();
    },
    close() {
        RongDesktop.Win.close();
    },
    focus() {
        RongDesktop.Win.focus();
    },
    getPlatform() {
        return RongDesktop.platform;
    },
    enterPublic(params, callback) {
        RongDesktop.Win.enterPublic(params, callback);
    },
    onEnterPublic(callback) {
        RongDesktop.ipcRenderer.on('openWorkPage', (event, params) => {
            callback(params);
        });
    },
    onCommandClose(callback) {
        RongDesktop.ipcRenderer.on('close', () => {
            callback();
        });
    },
    onPublicNotify(callback) {
        RongDesktop.ipcRenderer.on('closeApp', (event, params) => {
            callback(params);
        });
    },
    reloadWork(callback) {
        RongDesktop.ipcRenderer.on('reload', (event, params) => {
            callback(params);
        });
    },
} : {
    max: noop,
    min: noop,
    restore: noop,
    close: noop,
    focus: noop,
    getPlatform() {
        return 'web';
    },
    enterPublic: noop,
    onEnterPublic: noop,
    onCommandClose: noop,
    onPublicNotify: noop,
    reloadWork: noop,
};
