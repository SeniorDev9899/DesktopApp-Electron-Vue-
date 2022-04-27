import getLocaleMixins from '../utils/getLocaleMixins';
import sleep from '../utils/sleep';

const name = 'syncdata-loading';

export default {
    name,
    props: ['per', 'state'],
    data() {
        return {
            count: null,
            btnRefresh: '刷新',
            successOpacity: 1,
            showFail: false,
            pieSuccess: false,
        };
    },
    watch: {
        state(newVal, oldVal) {
            if (newVal === oldVal) {
                return;
            }
            this.showFail = false;
            this.successOpacity = 1;
            if (newVal === 'success') {
                this.success();
            }
            if (newVal === 'failed') {
                this.showFail = true;
            }
        },
    },
    computed: {
        getProcess() {
            return `${Number((this.per * 100).toFixed(2))}%`;
        },
        showTips() {
            const context = this;
            if (context.showFail) {
                return context.locale.failed;
            }
            let tips = context.locale.process;
            if (context.per === 1) {
                tips = context.locale.completed;
            }
            return tips;
        },
        pathRight() {
            let percent = this.per;
            if (percent === 1) {
                percent = 0.9999;
            }
            const r = 91;
            const degrees = percent * 360;
            const rad = degrees * (Math.PI / 180);
            const x = (Math.sin(rad) * r).toFixed(2);
            const y = -(Math.cos(rad) * r).toFixed(2);
            const lenghty = window.Number(degrees > 180);
            let path = ['M', 0, -r, 'A', r, r, 0, 0, 1, x, y];
            if (lenghty) {
                path = ['M', 0, -r, 'A', r, r, 0, 0, 1, 0, r];
            }
            path = path.join(' ');
            return path;
        },
        pathLeft() {
            let percent = this.per;
            if (percent === 1) {
                percent = 0.9999;
            }
            const r = 91;
            const degrees = percent * 360;
            const rad = degrees * (Math.PI / 180);
            const x = (Math.sin(rad) * r).toFixed(2);
            const y = -(Math.cos(rad) * r).toFixed(2);
            const lenghty = window.Number(degrees > 180);
            let path = ['M', 0, r, 'A', r, r, 0, 0, 1, x, y];
            if (!lenghty) {
                path = ['M', 0, r, 'A', r, r, 0, 0, 1, 0, r];
            }
            path = path.join(' ');
            return path;
        },
        touch() {
            let percent = this.per;
            if (percent === 1) {
                percent = 0.9999;
            }
            const r = 90;
            const degrees = percent * 360;
            const rad = degrees * (Math.PI / 180);
            const x = (Math.sin(rad) * r).toFixed(2);
            const y = -(Math.cos(rad) * r).toFixed(2);
            return {
                x,
                y,
            };
        },
    },
    mounted() {
        if (this.state === 'success') {
            this.success();
        }
    },
    methods: {
        async success() {
            const context = this;
            await sleep(500);
            const interval = setInterval(() => {
                context.successOpacity -= 0.1;
                if (context.successOpacity <= 0) {
                    clearInterval(interval);
                    context.$emit('finished');
                }
            }, 100);
        },
        retryHandle() {
            this.$emit('retry');
        },
    },
    mixins: [getLocaleMixins(name)],
};
