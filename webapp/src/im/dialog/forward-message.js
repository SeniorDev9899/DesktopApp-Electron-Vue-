export default function () {
    const options = {
        name: 'forward-message',
        template: 'templates/forward-message.html',
        data() {
            return {
                show: true,
                title: '',
                message: '',
                submitText: '',
            };
        },
        created() {
            const contextLocale = this.locale;
            this.submitText = contextLocale.tips.msgboxSubmitText;
            this.message = contextLocale.tips.forwardMessage;
        },
        methods: {
            close() {
                this.show = false;
                this.$destroy();
                $(this.$el).remove();
            },
            approve() {
                this.$im().$emit('approve-forward-message');
                this.close();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
