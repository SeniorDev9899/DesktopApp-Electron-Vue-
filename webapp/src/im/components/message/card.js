import getLocaleMixins from '../../utils/getLocaleMixins';
import avatar from '../avatar.vue';
import dialog from '../../dialog';

const name = 'card-message';
/*
说明：名片消息
功能：
    1. 消息列表中的名片消息
    2. 历史消息中的名片消息
*/
export default {
    name,
    props: ['message', 'isMultiSelected'],
    computed: {
        user() {
            return this.message.user;
        },
        content() {
            const content = this.message.content;
            content.id = content.userId;
            content.avatar = content.portraitUri || content.avatar;
            return content;
        },
    },
    components: {
        avatar,
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        userProfile(userId) {
            if (this.isMultiSelected) {
                return;
            }
            this.RongIM.dataModel.Friend.getFileHelper((error, helper) => {
                if (userId === helper.id) {
                    dialog.getFileHelper(helper);
                } else {
                    dialog.user(userId);
                }
            });
        },
    },
    mixins: [getLocaleMixins(name)],
};
