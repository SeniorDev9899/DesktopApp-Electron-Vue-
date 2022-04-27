import loadTemplate from './loadTemplate';
import config from '../config';
import kebabToCamel from './kebabToCamel';
import templateFormat from './templateFormat';

// 异步组件
export default function asyncComponent(options, resolve, reject) {
    const promise = loadTemplate(options.template);
    promise.then((html) => {
        // eslint-disable-next-line no-param-reassign
        options.mixins = options.mixins || [];
        const localeMix = {
            computed: {
                locale() {
                    const locale = config.currentLocale();
                    const name = kebabToCamel(options.name);
                    return $.extend(true, {}, locale, locale.components[name]);
                },
            },
            methods: {
                localeFormat: templateFormat,
            },
        };
        options.mixins.push(localeMix);
        const component = $.extend({}, options, {
            template: html,
        });
        resolve(component);
    }).fail((xhr, status, error) => {
        reject(error);
    });
}
