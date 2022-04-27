import asyncComponent from '../../utils/asyncComponent';
import config from '../../config';

function getStyleValue(prop) {
    // eslint-disable-next-line no-restricted-globals
    return isNaN(prop) ? prop : `${prop}px`;
}

function getChildComponent(options, resolve, reject) {
    const defaultOptions = {
        name: 'contextmenu',
        props: ['context'],
        mounted() {
            const self = this;
            const im = this.$im();
            im.$on('imclick', (event) => {
                const isOuter = $(event.target).closest('.rong-menu').length < 1;
                if (isOuter) {
                    self.$emit('close');
                }
            });
            im.$on('imRightClick', () => {
                self.$emit('close');
            });
        },
    };
    return asyncComponent($.extend(defaultOptions, options), resolve, reject);
}

// 通用右键菜单
export default function (options) {
    return {
        props: [
            'isMultiSelected',
        ],
        data() {
            return {
                context: null,
            };
        },
        components: {
            contextmenu(resolve, reject) {
                getChildComponent(options, resolve, reject);
            },
        },
        methods: {
            showContextmenu(event, context, fixOffset) {
                if (this.isMultiSelected) {
                    return;
                }
                const im = this.$im();
                im.$emit('imclick', event);
                // eslint-disable-next-line no-param-reassign
                fixOffset = $.extend({ left: 0, top: 0 }, fixOffset);
                const offset = $(this.$el).offset();
                let top = event.pageY - offset.top + fixOffset.top;
                let bottom = document.documentElement.offsetHeight - event.clientY;
                const throttle = context.menuCount * 26 || 80;
                if (bottom < throttle) {
                    top = 'auto';
                } else {
                    bottom = 'auto';
                }
                let left = event.pageX - offset.left + fixOffset.left;

                if (config.locale === 'en') {
                    const menuWidth = 108;
                    if (window.innerWidth - event.clientX < menuWidth) {
                        left = window.innerWidth - offset.left - menuWidth;
                    }
                }
                const style = {
                    left: getStyleValue(left),
                    top: getStyleValue(top),
                    bottom: getStyleValue(bottom),
                };
                this.context = $.extend({
                    style,
                }, context);
            },
            closeContextmenu() {
                this.context = null;
            },
        },
    };
}
