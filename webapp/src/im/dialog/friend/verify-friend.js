import KEYCODE from '../../utils/KeyCode';
import avatar from '../../components/avatar.vue';

function inviteFriend(context, friendApi, user) {
    const content = context.applyContent;
    friendApi.invite(user.id, content, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.close();
    });
}

export default function (user) {
    const options = {
        name: 'verify-friend',
        template: 'templates/friend/verify-friend.html',
        data() {
            return {
                show: true,
                applyContent: '',
            };
        },
        components: {
            avatar,
        },
        mounted() {
            this.applyContent = `${this.locale.iam} ${this.$im().loginUser.name}`;
        },
        methods: {
            toastError(errorCode) {
                this.RongIM.common.toastError(errorCode, this.$el.firstChild);
            },
            close() {
                this.show = false;
            },
            inviteFriend() {
                inviteFriend(this, this.RongIM.dataModel.Friend, user);
            },
            keydown(event) {
                const isEnter = (event.keyCode === KEYCODE.enter);
                if (isEnter) {
                    inviteFriend(this, this.RongIM.dataModel.Friend, user);
                }
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
