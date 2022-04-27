import config from '../config';

export default config.debug ? window.console : (() => {
    const console = {};
    Object.keys(window.console).forEach((fnName) => {
        if ($.isFunction(window.console[fnName])) {
            console[fnName] = $.noop;
        }
    });
})();
