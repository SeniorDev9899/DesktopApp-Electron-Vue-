/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import getGroupName from '../../common/getGroupName';
import avatar from '../avatar.vue';

export default {
    name: 'contact-group',
    mixins: [getLocaleMixins('contact-group')],
    data() {
        return {
            isLoadDone: false,
            groups: [],
        };
    },
    computed: {
        showEmptyGroup() {
            return this.groups.length === 0;
        },
    },
    mounted() {
        initGroup(this, this.$im().dataModel.Group);
    },
    methods: {
        getGroupType(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
        getGroupName,
        startConversation(id) {
            startConversation(this, id, this.$im().dataModel.Conversation);
        },
        memberCount(group) {
            let format = this.locale.contact.person;
            if (group.member_count === 1) {
                format = this.locale.contact.personSingle;
            }
            return this.localeFormat(format, group.member_count);
        },
    },
    components: {
        avatar,
    },
};

function initGroup(context, groupApi) {
    groupApi.getList((errorCode, groups) => {
        if (errorCode) {
            context.groups = [];
            context.isLoadDone = true;
            context.RongIM.common.toastError(errorCode);
            return;
        }
        groups.forEach((item, index) => {
            item.wType = groups.length - index + item.type * groups.length;
        });

        groups.sort((a, b) => b.wType - a.wType);

        context.groups = groups;
        context.isLoadDone = true;
    });
}

function startConversation(context, id, conversationApi) {
    const params = {
        targetId: id,
        conversationType: RongIMLib.ConversationType.GROUP,
    };
    const path = {
        name: 'conversation',
        params,
    };
    context.$router.push(path);
    conversationApi.add(params);
    // 页面跳转完成后获取页面节点滚动会话列表
    setTimeout(() => {
        const itemId = ['conversation', params.conversationType, params.targetId].join('-');
        const item = document.getElementById(itemId);
        if (item) {
            const parentHeight = item.parentNode.offsetHeight;
            const offsetTop = item.offsetTop;
            const alginWithTop = offsetTop > parentHeight;
            item.scrollIntoView(alginWithTop);
        }
    }, 50);
}
