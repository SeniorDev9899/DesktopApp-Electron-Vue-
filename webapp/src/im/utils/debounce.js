/* eslint-disable prefer-rest-params */
function restArgs(func, startIndex) {
    // eslint-disable-next-line no-param-reassign
    startIndex = startIndex ? +startIndex : func.length - 1;
    return function restfunc() {
        const length = Math.max(arguments.length - startIndex, 0);
        const rest = Array(length);
        let index = 0;
        for (; index < length; index += 1) {
            rest[index] = arguments[index + startIndex];
        }
        switch (startIndex) {
        case 0:
            return func.call(this, rest);
        case 1:
            return func.call(this, arguments[0], rest);
        case 2:
            return func.call(this, arguments[0], arguments[1], rest);
        default:
        }
        const args = Array(startIndex + 1);
        for (index = 0; index < startIndex; index += 1) {
            args[index] = arguments[index];
        }
        args[startIndex] = rest;
        return func.apply(this, args);
    };
}

const delay = restArgs((func, wait, args) => setTimeout(() => func(...args), wait));
// see http://underscorejs.org/#debounce
export default function debounce(func, wait, immediate) {
    let timeout;
    let result;
    const later = function later(context, args) {
        timeout = null;
        if (args) {
            result = func.apply(context, args);
        }
    };
    const debounced = restArgs(function debounced(args) {
        if (timeout) {
            clearTimeout(timeout);
        }
        if (immediate) {
            const callNow = !timeout;
            timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(this, args);
            }
        } else {
            timeout = delay(later, wait, this, args);
        }
        return result;
    });
    debounced.cancel = function cancel() {
        clearTimeout(timeout);
        timeout = null;
    };
    return debounced;
}
