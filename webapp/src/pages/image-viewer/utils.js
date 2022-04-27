/* eslint-disable no-param-reassign */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-multi-assign */
export default function (ImageViewer) {
    const keyCode = {
        backspace: 8,
        tab: 9,
        enter: 13,
        shift: 16,
        ctrl: 17,
        alt: 18,
        caps: 20,
        esc: 27,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        delete: 46,
        win: 91,
        q: 81,
    };

    function loadTemplate(template) {
        const version = Math.random();
        let promise;
        const pathRegex = new RegExp(/^([a-z_\-\s0-9./]+)+\.html$/);
        const isTemplateUrl = pathRegex.test(template);
        if (isTemplateUrl) {
            promise = $.get(`${template}?v=${version}`);
        } else {
            const html = $(template).html();
            promise = $.Deferred().resolve(html).promise();
        }
        return promise;
    }

    function templateFormat(source, params) {
        let undef;
        if (arguments.length === 1) {
            return function temp() {
                const args = $.makeArray(arguments);
                args.unshift(source);
                return $.validator.format.apply(this, args);
            };
        }
        if (params === undef) {
            return source;
        }
        if (arguments.length > 2 && params.constructor !== Array) {
            params = $.makeArray(arguments).slice(1);
        }
        if (params.constructor !== Array) {
            params = [params];
        }
        $.each(params, (i, n) => {
            source = source.replace(new RegExp(`\\{{${i}\\}}`, 'g'), () => n);
        });
        return source;
    }

    function kebabToCamel(string) {
        const firstLetter = string[0] || '';
        return firstLetter + string.slice(1).replace(/-\w/g, match => match[1].toUpperCase());
    }

    function asyncComponent(options, resolve, reject) {
        const promise = loadTemplate(options.template);
        promise.then((html) => {
            const component = $.extend({}, options, { template: html });
            resolve(component);
        }).fail((xhr, status, error) => {
            reject(error);
        });
    }

    const Base64 = {
        replace(str) {
            const reg = new RegExp('^data:image/[^;]+;base64,');
            if (str) {
                return str.replace(reg, '');
            }
            return '';
        },
        concat(base64, type) {
            type = type || 'data:image/jpg;base64,';
            base64 = this.replace(base64);
            return type + base64;
        },
    };
    // see http://underscorejs.org/#throttle
    function throttle(func, wait, options) {
        let timeout;
        let context;
        let args;
        let result;
        let previous = 0;
        if (!options) {
            options = {};
        }
        const later = function later() {
            previous = options.leading === false ? 0 : (new Date()).getTime();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) {
                context = args = null;
            }
        };
        const throttled = function throttled() {
            const now = (new Date()).getTime();
            if (!previous && options.leading === false) {
                previous = now;
            }
            const remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timeout) {
                    context = args = null;
                }
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
        throttled.cancel = function cancel() {
            clearTimeout(timeout);
            previous = 0;
            timeout = context = args = null;
        };
        return throttled;
    }
    const delay = restArgs((func, wait, args) => setTimeout(() => func(...args), wait));
    // see http://underscorejs.org/#debounce
    function debounce(func, wait, immediate) {
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

    function restArgs(func, startIndex) {
        startIndex = startIndex ? +startIndex : func.length - 1;
        return function restArgsHandle() {
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

    /*
说明：统一弹窗格式
参数：
    @param {object}      params
    @param {string}      params.type          - 'confirm':有2个按钮的弹窗，'alert':有1个按钮的弹窗，默认为'alert'
    @param {string}      params.title         - 弹窗title，不传则为空
    @param {string}      params.message       - 弹窗内容，不传则为空
    @param {string}      params.submitText    - 确定按钮的文案
    @param {boolean}     params.isAlignLeft   - 弹窗内容不都左对齐
    @param {function}    params.closeCallback - 取消按钮回调函数
    @param {function}    params.callback      - 确认按钮回调函数
*/
    function messagebox(params) {
        /*    var r = confirm(params.message)
    if (r === true) {
        params.callback && params.callback();
    }
    return; */
        const options = {
            name: 'messagebox',
            template: $('#rong-messagebox').html(),
            data() {
                return {
                    type: params.type || 'alert',
                    title: params.title,
                    message: params.message,
                    submitText: params.submitText,
                    show: true,
                    isAlignLeft: params.isAlignLeft,
                };
            },
            created() {
                const context = this;
                const im = ImageViewer.instance;
                context.title = params.title || context.locale.tips.msgboxTitle;
                context.submitText = params.submitText || context.locale.tips.msgboxSubmitText;
                context.imLogined = function imLogined() {
                    context.close();
                    im.$off(context.imLogined);
                };
                im.$on('imlogined', context.imLogined);
                im.$on('messageboxHide', context.close);
                window.addEventListener('hashchange', context.close);
            },
            methods: {
                close() {
                    if (params.closeCallback) params.closeCallback();
                    window.removeEventListener('hashchange', this.close);
                    this.show = false;
                },
                confirm() {
                    if (params.callback) params.callback();
                    this.show = false;
                },
            },
            directives: {
                autofocus: {
                    inserted(el) {
                        Vue.nextTick(() => {
                            el.focus();
                        });
                    },
                },
            },
        };
        const locale = {
            computed: {
                locale() {
                    const localeInfo = ImageViewer.instance.locale;
                    const name = kebabToCamel(options.name);
                    return $.extend(true, {}, localeInfo, localeInfo.components[name]);
                },
            },
        };
        options.mixins = [locale];
        const Messagebox = Vue.extend(options);
        const instance = new Messagebox({
            el: document.createElement('div'),
        });
        const wrap = ImageViewer.instance.$el.firstChild;
        $(wrap).append(instance.$el);
        return instance;
    }

    ImageViewer.utils = {
        keyCode,
        loadTemplate,
        templateFormat,
        asyncComponent,
        kebabToCamel,
        Base64,
        debounce,
        throttle,
        messagebox,
    };
}
