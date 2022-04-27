import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmpty from '../../utils/isEmpty';
import config from '../../config';

/*
说明： 显示撤回消息
       自己撤回的消息显示 "你撤回了一条消息"
       其他人撤回消息显示 "xxx 撤回了一条消息"
*/
function getRecallCommand(message, auth, context) {
    const locale = context.locale;
    const name = context.RongIM.common.getGroupUsername(message.user, context.groupId);
    let result = context.localeFormat(locale.message.recallOther, name);
    if (message.content && message.content.isAdmin) {
        return locale.message.recallAdmin;
    }
    const isMe = message.senderUserId === auth.id;
    if (isMe) {
        result = locale.message.recallSelf;
    }
    return result;
}

const name = 'recall-command-message';

export default {
    name,
    props: ['message', 'groupId', 'isBanned'],
    mixins: [getLocaleMixins(name)],
    data() {
        return {
            canEdit: false,
            timer: 0,
        };
    },
    mounted() {
        const context = this;
        const value = this.RongIM.dataModel.Message.getRecallContent(context.message.messageId);
        if (isEmpty(value)) {
            return;
        }
        const timeout = config.recallEditTimeout - (Date.now() - value.recallTime);
        if (timeout > 0) {
            context.canEdit = true;
            context.timer = setTimeout(() => {
                context.canEdit = false;
            }, timeout);
        }
    },
    destroyed() {
        clearTimeout(this.timer);
    },
    methods: {
        getRecallCommand() {
            return getRecallCommand(this.message, this.$im().auth, this);
        },
        showRecallEdit(item) {
            const value = this.RongIM.dataModel.Message.getRecallContent(item.messageId);
            if (isEmpty(value)) {
                return false;
            }
            return value.recallTime > Date.now() - config.recallEditTimeout;
        },
        recallEdit(item) {
            const im = this.$im();
            const value = im.dataModel.Message.getRecallContent(item.messageId);
            im.$emit('editrecalled', value);
        },
    },
};
