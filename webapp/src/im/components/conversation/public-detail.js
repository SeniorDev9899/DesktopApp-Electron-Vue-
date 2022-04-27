import avatar from '../avatar.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';

const name = 'public-detail';

/*
说明： 获取公众号信息组件
*/
export default {
    name,
    props: ['user'],
    mixins: [getLocaleMixins(name)],
    data() {
        const params = this.$im().$route.params;
        return {
            conversation: {
                conversationType: params.conversationType,
                targetId: params.targetId,
            },
            publicName: '',
            publicDescription: '',
            isShow: false,
        };
    },
    components: {
        avatar,
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const conversationApi = im.dataModel.Conversation;
        const publicApi = im.dataModel.Public;
        const conversation = context.conversation;
        im.$on('imclick', context.close);
        conversationApi.getOne(conversation.conversationType, conversation.targetId, (errorCode, newConversation) => {
            context.conversation = newConversation;
            // 获取公众号相关信息（名称、描述）
            publicApi.getPublicInfo(conversation.targetId, (result) => {
                context.publicName = result.name;
                context.publicDescription = result.description;
                context.isShow = true;
            });
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
                const conversationApi = this.$im().dataModel.Conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId);
            },
        },
        // // 禁言按钮值绑定
        isMute: {
            get() {
                return this.conversation.notificationStatus;
            },
            set(checked) {
                this.conversation.notificationStatus = checked;

                const action = checked ? 'mute' : 'unmute';
                const conversation = this.conversation;
                const conversationApi = this.$im().dataModel.Conversation;
                conversationApi[action](conversation.conversationType, conversation.targetId);
            },
        },
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        close(event) {
            this.$emit('hidepanel', event);
            // this.$im().$off('imclick', this.close);
        },
        enterPublic(event) {
            const im = this.$im();
            this.$emit('hidepanel', event);
            // im.$off('imclick', this.close);
            im.openWork({
                conversationType: this.conversation.conversationType,
                targetId: this.conversation.targetId,
            });
        },
    },
};
