import getBrowser from '../utils/getBrowser';

let bindingValue;
export default {
    bind(el, binding) {
        bindingValue = binding.value;
    },
    inserted(el) {
        const browserType = getBrowser().type.toLowerCase();
        if (browserType !== 'chrome' && browserType !== 'safari') {
            return;
        }
        const $scrollContain = $(el);
        const $parent = $('<div class="rong-scroll-container"></div>');
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
        let timeoutShowScrollBar;

        const setupScrollHeight = function setupScrollHeight() {
            const $el = $(el).parent();
            Vue.nextTick(() => {
                $el.find('.rong-scroll-bar-y>i').css({
                    display: 'block',
                    height: el.scrollHeight - 5,
                    width: '7px',
                });
            });
        };
        const startScrollBar = function startScrollBar(event) {
            if (scrollBar) {
                setupScrollHeight();
                const top = $scrollbar.scrollTop();
                $scrollContain.scrollTop(top);
                if (bindingValue) {
                    bindingValue(event);
                }
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
        const showScrollBar = function showScrollBar() {
            clearTimeout(timeoutShowScrollBar);
            $scrollbar.addClass('rong-scroll-bar-show');
        };
        const hideScrollBar = function hideScrollBar() {
            timeoutShowScrollBar = setTimeout(() => {
                $scrollbar.removeClass('rong-scroll-bar-show');
            }, 100);
        };

        $scrollbar.on('scroll', startScrollBar);
        $scrollContain.on('scroll', startScrollContain);
        $scrollbar.on('mouseenter', showScrollBar);
        $scrollContain.on('mouseenter', showScrollBar);
        $scrollbar.on('mouseleave', hideScrollBar);
        $scrollContain.on('mouseleave', hideScrollBar);
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
                height: el.scrollHeight - 5,
                width: '7px',
            });
        });
    },
};
