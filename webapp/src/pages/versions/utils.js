import config from './config';
import locale from './locale';

/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-rest-params */
/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
export default function (RongAppversion) {
    const cache = (function () {
    /*
    说明：
    1: JSON.stringfy --> set --> get --> JSON.parse
    2: data format well return as set`s
    3: undefined in array will be null after stringfy+parse
    4: NS --> namespace 缩写
    */
        let keyNS = 'rong-default-';

        function get(key) {
        /*
        legal data: "" [] {} null flase true

        illegal: undefined
            1: key not set
            2: key is cleared
            3: key removed
            4: wrong data format
        */
            key = keyNS + key;

            if (!isKeyExist(key)) {
                return undefined;
            }

            // maybe keyNS could avoid conflict
            let val = localStorage.getItem(key) || sessionStorage.getItem(key);
            val = JSON.parse(val);

            const hasOwnProperty = Object.prototype.hasOwnProperty;
            // val format check
            if (val !== null && hasOwnProperty.call(val, 'type') && hasOwnProperty.call(val, 'data')) {
                return val.data;
            }
            return undefined;
        }

        // isPersistent
        function set(key, val, isTemp) {
            let store = localStorage;
            if (isTemp) {
                store = sessionStorage;
            }

            key = keyNS + key;
            const type = (typeof val);
            val = {
                data: val,
                type,
            };

            store[key] = JSON.stringify(val);
        }

        function remove(key) {
            key = keyNS + key;
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        }

        function isKeyExist(key) {
            const hasOwnProperty = Object.prototype.hasOwnProperty;
            // do not depend on value cause of ""和0
            return hasOwnProperty.call(localStorage, key) || hasOwnProperty.call(sessionStorage, key);
        }

        function setKeyNS(NS) {
            const isString = typeof NS === 'string';
            if (isString && NS !== '') {
                keyNS = NS;
            }
        }

        function onchange(callback) {
            callback = callback || $.noop;
            $(window).on('storage', (e) => {
                const event = e.originalEvent;
                if ($.isEmpty(event.key)) {
                    return;
                }
                const key = event.key.slice(keyNS.length);
                const value = get(key);
                callback(key, value);
            });
        }

        return {
            setKeyNS,
            get,
            set,
            remove,
            onchange,
        };
    }());

    function templateFormat(source, params) {
        let undef;
        if (arguments.length === 1) {
            return function () {
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
        const version = config.product.version;
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
            const option = {
                computed: {
                    locale() {
                        const localeInfo = locale[config.locale];
                        const name = kebabToCamel(options.name);
                        return $.extend(true, {}, localeInfo, localeInfo.components[name]);
                    },
                },
                methods: {
                    localeFormat: templateFormat,
                },
            };
            options.mixins.push(option);
            const component = $.extend({}, options, { template: html });
            resolve(component);
        }).fail((xhr, status, error) => {
            reject(error);
        });
    }

    function without(origin, out) {
        return origin.filter(item => out.indexOf(item) === -1);
    }

    function dateFormat(timestamp, options) {
        const lang = locale[config.locale].name;
        options = $.extend({
            alwaysShowTime: false,
            timeHour: 24, /* 24小时制 */
        }, options);

        if (dateFormat._init !== 'done') {
            updateLocale();
            dateFormat._init = 'done';
        }
        const now = moment();
        const date = moment(timestamp);
        let hourTime = options.timeHour === 24 ? 'H' : ' A h';
        hourTime = ' H:mm'.replace(/H/ig, hourTime);
        const time = options.alwaysShowTime ? date.format(hourTime) : '';
        // 39331 - 【设置】英文语言模式下，功能介绍及版本更新没有变成英文显示
        if (date.isSameOrBefore(now, 'month') && date.isSame(now, 'year')) {
            if (lang === 'English') {
                return date.format('MM-DD') + time;
            }
            return date.format('M月D日') + time;
        }
        if (lang === 'English') {
            return date.format('YYYY年M月D日') + time;
        }
        return date.format('YYYY-MM-DD') + time;
    }

    function updateLocale() {
        moment.updateLocale(moment.locale(), {
            week: {
                dow: 7,
            },
            // meridiem(hour, minute) {
            //     // TODO: window.RongIM.instance 肯定为空值，为啥没报错……
            //     const locale = window.RongIM.instance.locale;
            //     const hm = hour * 100 + minute;
            //     if (hm < 600) {
            //         return locale.time.morning;
            //     } if (hm < 1130) {
            //         return locale.time.forenoon;
            //     } if (hm < 1230) {
            //         return locale.time.noon;
            //     } if (hm < 1800) {
            //         return locale.time.afternoon;
            //     }
            //     return locale.time.evening;
            // },
        });
    }

    function tplEngine(tpl, data) {
        const reg = /<%([^%>]+)?%>/g;
        const regOut = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g;
        let code = 'var r=[];\n';
        let cursor = 0;
        let match;

        const add = function (line, js) {
            if (js) {
                code += line.match(regOut) ? `${line}\n` : `r.push(${line});\n`;
            } else {
                code += line !== '' ? `r.push("${line.replace(/"/g, '\\"')}");\n` : '';
            }
            return add;
        };
        // eslint-disable-next-line no-cond-assign
        while (match = reg.exec(tpl)) {
            add(tpl.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(tpl.substr(cursor, tpl.length - cursor));
        code += 'return r.join("");';
        // eslint-disable-next-line no-new-func
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
    }

    function render(id, data) {
        const el = document.getElementById(id);
        const html = el.innerHTML;
        return tplEngine(html, data);
    }

    function getBrowser() {
        const userAgent = navigator.userAgent;
        let version;
        let type;
        const condition = {
            IE: /rv:([\d.]+)\) like Gecko|MSIE ([\d.]+)/,
            Edge: /Edge\/([\d.]+)/,
            Firefox: /Firefox\/([\d.]+)/,
            Opera: /(?:OPERA|OPR).([\d.]+)/,
            QQBrowser: /QQBrowser\/([\d.]+)/,
            Chrome: /Chrome\/([\d.]+)/,
            Safari: /Version\/([\d.]+).*Safari/,
        };
        // eslint-disable-next-line no-restricted-syntax
        for (const key in condition) {
            if (Object.prototype.hasOwnProperty.call(condition, key)) {
                const browserContent = userAgent.match(condition[key]);
                if (browserContent) {
                    type = key;
                    version = browserContent[1] || browserContent[2];
                    break;
                }
            }
        }
        return {
            type: type || 'UnKonw',
            version: version || 'UnKonw',
        };
    }

    function getPlatform() {
        const platform = RongAppversion.browserWindow.platform;
        if (platform === 'darwin') {
            return 'OSX';
        } if (platform.indexOf('web') === 0) {
            return 'web';
        }
        return 'windows';
    }

    RongAppversion.utils = {
        without,
        cache,
        asyncComponent,
        dateFormat,
        tplEngine,
        render,
        getBrowser,
        getPlatform,
    };

    /*
    纵向滚动条解决透明问题
    update 数据变化时重新计算滚动条高度
    */
    Vue.directive('rong-scroll-bar-y', {
        inserted(el) {
            const browserType = getBrowser().type.toLowerCase();
            if (browserType !== 'chrome' && browserType !== 'safari') {
                return;
            }
            const $scrollContain = $(el);
            const $parent = $('<div></div>');
            $parent.css({
                height: '100%',
                position: 'relative',
            });
            $scrollContain.wrap($parent);
            const $scrollbar = $('<div class="rong-scroll-bar-y"><i></i></div>');
            if (browserType === 'safari') {
                $scrollbar.addClass('rong-scroll-bar-safari');
            }
            // $parent.append($scrollbar);
            $scrollContain.parent().append($scrollbar);
            $scrollContain.addClass('rong-scroll-content');
            let scrollContain = true;
            let timeoutContain;
            let scrollBar = true;
            let timeoutBar;

            const setupScrollHeight = function setupScrollHeight() {
                const $el = $(el).parent();
                $scrollbar.addClass('rong-scroll-bar-show');
                Vue.nextTick(() => {
                    $el.find('.rong-scroll-bar-y>i').css({
                        display: 'block',
                        height: el.scrollHeight,
                        width: '7px',
                    });
                    setTimeout(() => {
                        if (scrollBar && scrollContain) {
                            $scrollbar.removeClass('rong-scroll-bar-show');
                        }
                    }, 1500);
                });
            };
            const startScrollBar = function startScrollBar() {
                if (scrollBar) {
                    setupScrollHeight();
                    const top = $scrollbar.scrollTop();
                    $scrollContain.scrollTop(top);
                    scrollContain = false;
                    clearTimeout(timeoutContain);
                    timeoutContain = setTimeout(() => {
                        scrollContain = true;
                    }, 500);
                }
            };
            const startScrollContain = function startScrollContain() {
                if (scrollContain) {
                    setupScrollHeight();
                    const top = $scrollContain.scrollTop();
                    $scrollbar.scrollTop(top);
                    scrollBar = false;
                    clearTimeout(timeoutBar);
                    timeoutBar = setTimeout(() => {
                        scrollBar = true;
                    }, 500);
                }
            };

            $scrollbar.on('scroll', startScrollBar);
            $scrollContain.on('scroll', startScrollContain);
            // $scrollContain.hover(startScrollContain);
        },
        update(el) {
            const browserType = getBrowser().type.toLowerCase();
            if (browserType !== 'chrome' && browserType !== 'safari') {
                return;
            }
            const $el = $(el).parent();
            Vue.nextTick(() => {
                $el.find('.rong-scroll-bar-y>i').css({
                    display: 'block',
                    height: el.scrollHeight,
                    width: '7px',
                });
            });
        },
    });
}
