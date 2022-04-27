// see http://underscorejs.org/#throttle
export default function throttle(func, wait, options) {
    let timeout;
    let context;
    let args;
    let result;
    let previous = 0;
    if (!options) {
        // eslint-disable-next-line no-param-reassign
        options = {};
    }
    const later = function later() {
        previous = options.leading === false ? 0 : (new Date()).getTime();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) {
            context = null;
            args = null;
        }
    };
    const throttled = function throttled() {
        const now = (new Date()).getTime();
        if (!previous && options.leading === false) {
            previous = now;
        }
        const remaining = wait - (now - previous);
        context = this;
        // eslint-disable-next-line prefer-rest-params
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) {
                context = null;
                args = null;
            }
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
    throttled.cancel = function cancel() {
        clearTimeout(timeout);
        previous = 0;
        // eslint-disable-next-line no-multi-assign
        timeout = context = args = null;
    };
    return throttled;
}
