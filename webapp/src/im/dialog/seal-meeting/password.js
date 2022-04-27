import validate from '../../components/mixins/validate';

export default function () {
    const def = $.Deferred();
    const options = {
        name: 'meeting-password',
        template: 'templates/seal-meeting/password.html',
        data() {
            return {
                password: '',
                show: true,
            };
        },
        mixins: [
            validate(),
        ],
        methods: {
            submit() {
                const context = this;
                if (!context.valid()) {
                    return;
                }
                def.resolve(this.password);
                this.close();
            },
        },
    };

    window.RongIM.common.mountDialog(options);
    return def.promise();
}
