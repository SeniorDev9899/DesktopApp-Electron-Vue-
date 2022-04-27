const noop = $.noop;

export default IS_DESKTOP ? RongDesktop.upload : {
    setItem: noop,
    getItem: noop,
    removeItem: noop,
};
