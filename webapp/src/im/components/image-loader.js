
export default {
    name: 'portrait-loader',
    props: ['url'],
    data() {
        return {
            success: false,
        };
    },
    watch: {
        url: {
            handler(newVal) {
                const context = this;
                if (!newVal) {
                    context.success = false;
                    return;
                }
                const img = new Image();
                img.onload = function onload() {
                    context.success = true;
                };
                img.onerror = function onerror() {
                    context.success = false;
                };
                img.src = context.url;
            },
            immediate: true,
        },
    },
};
