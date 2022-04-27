/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
export default {
    bind(el, binding) {
        if (typeof binding.value !== 'function') {
            return;
        }
        const { modifiers } = binding;
        const handle = binding.value;
        let count = 4;
        const timesArg = parseInt(binding.arg);
        if (timesArg > 1) {
            count = timesArg;
        }
        let clickTimes = 0;
        let timeout = null;
        el._successionclick = function onClick(event) {
            if (modifiers.stop) {
                event.stopPropagation();
            }
            if (modifiers.prevent) {
                event.preventDefault();
            }
            clickTimes += 1;
            if (clickTimes >= count) {
                clickTimes = 0;
                handle(event);
            }
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                clickTimes = 0;
            }, 350);
        };
        el.addEventListener('click', el._successionclick);
    },
    unbind(el) {
        el.removeEventListener('click', el._successionclick);
        el._successionclick = null;
    },
};
