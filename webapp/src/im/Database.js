export default IS_DESKTOP ? RongDesktop.Database : {
    init(appkey, key, callback) {
        if (callback) {
            callback();
        }
    },
    close(callback) {
        if (callback) {
            callback();
        }
    },
    clean: $.noop,
};
