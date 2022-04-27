/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const EventNameWheel = ('onwheel' in document.createElement('div')) ? 'wheel' : 'mousewheel';

export default {
    bind(el, binding) {
        if (typeof binding.value !== 'function') {
            return;
        }
        const handle = binding.value;
        let locked = false;// 防止重复调用
        el._scrolltobottom = function _scrolltobottom(event) {
            const down = event.deltaY > 0;
            // 滑动到底部时有时会差零点几像素导致无法正确加载下一页
            const fill = 1;
            const bottom = el.scrollTop + el.clientHeight + fill >= el.scrollHeight;
            if (down && bottom && !locked) {
                handle();
                locked = true;
                setTimeout(() => {
                    locked = false;
                }, 500);
            }
        };
        el.addEventListener(EventNameWheel, el._scrolltobottom);
    },
    unbind(el) {
        el.addEventListener(EventNameWheel, el._scrolltobottom);
        el._scrolltobottom = null;
    },
};
