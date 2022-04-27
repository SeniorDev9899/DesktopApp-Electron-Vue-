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
    platform: RongDesktop.platform,
} : {
    max: noop,
    min: noop,
    restore: noop,
    close: noop,
    platform: 'web',
};
