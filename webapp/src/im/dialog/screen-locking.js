export default function () {
    const cache = window.RongIM.utils.cache;
    const options = {
        name: 'screen',
        template: 'templates/screen-locking.html',
        data() {
            return {
                show: true,
                unlockPwd: '',
                error: false,
            };
        },
        mounted() {
            const context = this;
            const im = this.$im();
            const messageApi = this.RongIM.dataModel.Message;
            context.messageWatch = function messageWatch(message) {
                if (message.messageType === 'MultiClientMessage') {
                    if (+message.content.action === 1) {
                        // 设备锁定，关闭屏幕锁定
                        context.show = false;
                        im.isScreenLock = false;
                    }
                }
            };
            messageApi.watch(context.messageWatch);
        },
        methods: {
            input() {
                this.error = false;
            },
            unlock() {
                const cacheLockPwd = cache.get(`screen-lock-pwd-${this.$im().auth.id}`);
                if (this.unlockPwd === cacheLockPwd.unlockPwd) {
                    this.show = false;
                    this.$im().isScreenLock = false;
                    return;
                }
                this.error = true;
            },
        },
        destroyed() {
            const context = this;
            this.RongIM.dataModel.Message.unwatch(context.messageWatch);
        },
    };
    window.RongIM.common.mountDialog(options);
}
