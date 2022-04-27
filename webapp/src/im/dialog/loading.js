export default function (config, callback) {
    let conf = config;
    let cb = callback;
    if (typeof config === 'function') {
        cb = config;
        conf = {};
    }
    const options = {
        delay: 400,
        template: '#rong-template-loading',
        data() {
            return {
                createTime: 0,
            };
        },
        parent: conf.parent,
        elParent: conf.elParent,
        mounted() {
            this.createTime = Date.now();
        },
        methods: {
            close() {
                const span = Date.now() - this.createTime;
                const leastTime = 1200;
                const delayCloseTime = options.delay + leastTime - span;
                const mustShowLoading = span > options.delay && delayCloseTime > 0;
                if (mustShowLoading) {
                    setTimeout(() => {
                        this.destroy();
                    }, delayCloseTime);
                } else {
                    this.destroy();
                }
            },
            destroy() {
                this.$destroy();
                $(this.$el).remove();
            },
        },
    };
    window.RongIM.common.mountDialog(options, cb);
}
