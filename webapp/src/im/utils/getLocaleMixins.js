import templateFormat from './templateFormat';
import config from '../config';
import kebabToCamel from './kebabToCamel';

/**
 * @param {String} name
 */
export default name => ({
    computed: {
        locale() {
            const locale = config.currentLocale();
            return $.extend(true, {}, locale, locale.components[kebabToCamel(name)]);
        },
    },
    methods: {
        localeFormat: templateFormat,
    },
});
