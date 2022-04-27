export default function () {
    const options = {
        name: 'device',
        template: 'templates/device-locking.html',
        data() {
            return {
                show: true,
            };
        },
        mounted() {
            const context = this;
            const im = this.$im();
            const messageApi = this.RongIM.dataModel.Message;
            context.messageWatch = function messageWatch(message) {
                if (message.messageType === 'MultiClientMessage') {
                    if (+message.content.action === 2) {
                        // 解锁
                        context.show = false;
                        im.isLock = false;
                    } else if (+message.content.action === 1) {
                        // 42810 - 【多端登录】移动端和pc端登录同一账号，移动端操作锁定电脑端，第一次操作电脑端同步被锁定，解锁后移动端再次操作锁定电脑端，电脑端收不到提示
                        context.show = true;
                        im.isLock = true;
                    }
                }
            };
            messageApi.watch(context.messageWatch);
        },
        methods: {
            unlock() {
                const common = this.RongIM.common;
                this.RongIM.dataModel.Device.unlock((errorCode) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                    }
                });
            },
        },
        destroyed() {
            const context = this;
            this.RongIM.dataModel.Message.unwatch(context.messageWatch);
        },
    };
    window.RongIM.common.mountDialog(options);
}
