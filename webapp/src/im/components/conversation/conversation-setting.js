import avatar from '../avatar.vue';
import userProfile from '../../dialog/contact/user';
import showCreateGroup from '../../dialog/group/create';
import getLocaleMixins from '../../utils/getLocaleMixins';
import { getServerConfigByChainedKey } from '../../cache/helper';

/*
说明： 会话设置
*/
export default {
    name: 'conversation-setting',
    props: ['user'],
    mixins: [getLocaleMixins('conversation-setting')],
    data() {
        const params = this.$im().$route.params;
        return {
            conversation: {
                conversationType: params.conversationType,
                targetId: params.targetId,
            },
        };
    },
    components: {
        avatar,
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const conversationApi = im.dataModel.Conversation;
        const conversation = context.conversation;
        im.$on('imclick', context.close);
        conversationApi.getOne(conversation.conversationType, conversation.targetId, (errorCode, newConversation) => {
            if (typeof newConversation.notificationStatus === 'number') {
                // eslint-disable-next-line no-param-reassign
                newConversation.notificationStatus = newConversation.notificationStatus === 1;
            }
            context.conversation = newConversation;
        });
    },
    beforeDestroy() {
        this.$im().$off('imclick', this.close);
    },
    computed: {
        // 置顶按钮值绑定
        isTop: {
            get() {
                return this.conversation.isTop;
            },
            set(checked) {
                this.conversation.isTop = checked;
                const action = checked ? 'top' : 'untop';
                const conversation = this.conversation;
                const im = this.$im();
                const conversationApi = im.dataModel.Conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId);
            },
        },
        // 禁言按钮值绑定
        isMute: {
            get() {
                return this.conversation.notificationStatus;
            },
            set(checked) {
                this.conversation.notificationStatus = checked;

                const action = checked ? 'mute' : 'unmute';
                const conversation = this.conversation;
                const im = this.$im();
                const conversationApi = im.dataModel.Conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId);
            },
        },
        // 是否文件助手
        isFileHelper() {
            const user = this.user;
            const isFileHelper = user.id === getServerConfigByChainedKey('file.file_transfer_robot_id');
            return isFileHelper || user.isRobot;
        },
        fileHelperLocale() {
            const locale = this.locale;
            const getFileHelper = (locale.components || {}).getFileHelper;
            return getFileHelper;
        },
    },
    filters: {
        slice(name) {
            // 如果没有头像，中文下显示最后一个汉字，英文下显示第一个英文字母
            if (!name) {
                return name;
            }
            const isChinese = /^[^\x20-\xff]+$/.test(name);
            return isChinese ? name.slice(-1) : name[0].toUpperCase();
        },
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        // 对方高管则不可邀请加入群组
        executiveLimit(item) {
            if (item.isFriend || this.$im().auth.isExecutive) {
                return false;
            }
            const isExecutive = !!item.isExecutive;
            return isExecutive;
        },
        addMembers() {
            const members = [this.$im().loginUser, this.user];
            showCreateGroup(null, members);
        },
        close(event) {
            this.$emit('hidepanel', event);
            // this.$im().$off('imclick', this.close);
        },
        getThemeIndex(id) {
            // 根据id返回固定数字，用于显示头像背景色，共6种颜色
            const LENGTH = 6;
            return id ? (id.slice(-1).charCodeAt(0) % LENGTH) : 0;
        },
        userProfile,
    },
};
