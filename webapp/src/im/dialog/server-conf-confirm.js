export default function () {
    const def = $.Deferred();
    const options = {
        name: 'server-conf-comfirm',
        template: 'templates/server-conf-confirm.html',
        data() {
            return {
                show: true,
                title: '',
                message: '',
                cancelText: '',
                reloadText: '',
            };
        },
        created() {
            const contextLocale = this.locale;
            this.title = contextLocale.components.serverConf.tipsText; // title
            this.message = contextLocale.components.serverConf.serverGetFailedText; // 失败提示
            this.reloadText = contextLocale.components.serverConf.reloadText; // 重新加载
            const useServerConfFlag = window.RongIM.config.useServerConfFlag;
            if (useServerConfFlag) {
                // 开启服务配置时， -> 服务设置 / 重新加载
                this.cancelText = contextLocale.components.serverConf.setServerText; // 服务设置
            } else {
                // 没有开启服务配置时 -> 取消 / 重新加载
                this.cancelText = contextLocale.components.serverConf.cancelText; // 取消
            }
        },
        methods: {
            close() { // 取消
                def.resolve();
                this.show = false;
                this.$destroy();
                $(this.$el).remove();
            },
            submit() { // 重新加载
                def.reject();
                this.show = false;
            },
        },
    };
    window.RongIM.common.mountDialog(options);
    return def.promise();
}
