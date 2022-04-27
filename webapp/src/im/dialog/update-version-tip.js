export default function (versionInfo) {
    const def = $.Deferred();
    const options = {
        name: 'update-version-tip',
        template: 'templates/update-version-tip.html',
        data() {
            return {
                force_upgrade: versionInfo.force_upgrade,
                show: true,
                title: '',
                message: '',
                submitText: '',
                selectedNote: [],
            };
        },
        created() {
            this.force_upgrade = false;
            const contextLocale = this.locale;
            this.title = contextLocale.tips.msgboxTitle;
            this.submitText = this.force_upgrade ? contextLocale.tips.msgboxSubmitText : contextLocale.tips.downloadAndExit;
            this.message = this.force_upgrade ? contextLocale.tips.tipForceUpdate : contextLocale.tips.tipUpdateVersion;
            // release_note = '当前版本的描述\n当前版本的描述\n当前版本的描述\n当前版本的描述\n当前版本的描述\n';
            if (window.RongIM.config.dataModel.server.indexOf('rongcloud.net') > -1) {
                this.selectedNote = versionInfo.release_note.split('\n').filter(item => item);
            }
        },
        methods: {
            close() {
                if (this.force_upgrade) {
                    def.resolve();
                } else {
                    def.reject();
                }
                this.show = false;
                this.$destroy();
                $(this.$el).remove();
            },
            submit() {
                def.resolve();
                this.show = false;
            },
        },
    };
    window.RongIM.common.mountDialog(options);
    return def.promise();
}
