import messageboxTemplate from './messagebox.shtml';

/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
export default function (RongWork) {
    function templateFormat(source, params) {
        let undef;
        if (arguments.length === 1) {
            return function templateFormatHandle() {
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

    function loadTemplate(template) {
        const version = RongWork.instance.config.product.version;
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

    function asyncComponent(options, resolve, reject) {
        const promise = loadTemplate(options.template);
        promise.then((html) => {
            options.mixins = options.mixins || [];
            const locale = {
                computed: {
                    locale() {
                        const localeInfo = RongWork.instance.locale;
                        const name = kebabToCamel(options.name);
                        return $.extend(true, {}, localeInfo, (localeInfo.components || {})[name]);
                    },
                },
                methods: {
                    localeFormat: templateFormat,
                },
            };
            options.mixins.push(locale);
            const component = $.extend({}, options, { template: html });
            resolve(component);
        }).fail((xhr, status, error) => {
            reject(error);
        });
    }

    function without(origin, out) {
        return origin.filter(item => out.indexOf(item) === -1);
    }

    function watchHideDialog(context) {
        window.onhashchange = () => {
            context.close();
        };
    }

    // 增加一个弹出框
    function mountDialog(options, callback) {
        const templateSrc = options.template;
        if (mountDialog[templateSrc] === 'busy') {
            return;
        }
        mountDialog[templateSrc] = 'busy';
        const promise = loadTemplate(options.template);
        promise.then((html) => {
            $.extend(options, { template: html });
            options.mixins = options.mixins || [];
            const locale = {
                mounted() {
                    const im = RongWork.instance;
                    const context = this;
                    context.imLogouted = () => {
                        context.$destroy();
                        $(context.$el).remove();
                        im.$off('imLogouted', context.imLogouted);
                    };
                    // 当页面有跳转的时候，关闭弹层
                    watchHideDialog(context);
                    im.$on('imLogouted', context.imLogouted);
                },
                computed: {
                // 获取对应的相关文案
                    locale() {
                        const localeInfo = RongWork.instance.locale;
                        const name = kebabToCamel(options.name);
                        return $.extend(true, {}, localeInfo, localeInfo.components[name]);
                    },
                },
                methods: {
                    localeFormat: templateFormat,
                },
            };
            options.mixins.push(locale);

            const Dialog = Vue.extend(options);
            const instance = new Dialog({
                el: document.createElement('div'),
            });
            const wrap = RongWork.instance.$el.firstChild;
            $(wrap).append(instance.$el);
            if ($.isFunction(callback)) callback(instance);
        }).always(() => {
            delete mountDialog[templateSrc];
        });
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
        const options = {
            name: 'messagebox',
            template: messageboxTemplate,
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
                const im = RongWork.instance;
                context.title = params.title;
                context.imLogined = () => {
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
                    const localeInfo = RongWork.instance.locale;
                    const name = kebabToCamel(options.name);
                    return $.extend(true, {}, localeInfo, (localeInfo.components || {})[name]);
                },
            },
        };
        options.mixins = [locale];
        const Messagebox = Vue.extend(options);
        const instance = new Messagebox({
            el: document.createElement('div'),
        });
        const wrap = RongWork.instance.$el.firstChild;
        $(wrap).append(instance.$el);
    }

    RongWork.utils = {
        messagebox,
        mountDialog,
        without,
        appType: {
            base: 1,
            other: 2,
        },
        asyncComponent,
    };
}
