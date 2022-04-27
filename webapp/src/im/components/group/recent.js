/* eslint-disable no-param-reassign */
// var im = RongIM.instance;
// var dataModel = im.dataModel;
// var conversationApi = dataModel.Conversation;
// var contactApi = im.dataModel.Contact;
import getLocaleMixins from '../../utils/getLocaleMixins';
import searchStrRange from '../../utils/searchStrRange';
import without from '../../common/without';
import isSysUser from '../../common/isSysUser';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import filterMark from '../../common/filterMark';
import avatar from '../avatar.vue';

/*
说明：转发时选择最近聊天
功能：消息转发时，选择 最近聊天 模块
*/
export default {
    name: 'recent',
    mixins: [getLocaleMixins('recent')],
    data() {
        return {
            keyword: '',
            searchResult: [],
            members: [],
        };
    },
    props: ['selected', 'defaultSelected', 'disableExecutive'],
    computed: {
        defaultIdList() {
            return (this.defaultSelected || []).map((item) => item.id);
        },
        checkedAll: {
            get() {
                return getCheckedAll(this);
            },
            set(value) {
                setCheckedAll(this, value);
            },
        },
        indeterminate() {
            if (this.isCardSelect) {
                return false;
            }
            return typeof this.checkedAll !== 'boolean';
        },
        checked: {
            get() {
                return this.selected.map((item) => item.id);
            },
            set(newMemberIds) {
                const context = this;
                const contactApi = this.$im().dataModel.Contact;
                contactApi.get(newMemberIds, (errorCode, newMembers) => {
                    newMembers = [].concat(newMembers);
                    if (errorCode) {
                        context.toastError(errorCode);
                        return;
                    }
                    contactApi.get(
                        context.checked,
                        (UerrorCode, oldMembers) => {
                            oldMembers = [].concat(oldMembers);
                            if (UerrorCode) {
                                context.toastError(UerrorCode);
                                return;
                            }
                            const addedList = without(newMembers, oldMembers);
                            if (addedList.length > 0)
                                context.$emit('added', addedList);

                            const removedList = without(oldMembers, newMembers);
                            const listLen = removedList.length;
                            if (listLen > 0)
                                context.$emit('removed', removedList);
                        }
                    );
                });
                if (context.keyword) context.clear();
            },
        },
        isCardSelect() {
            return this.$parent.$options.name === 'card';
        },
    },
    components: {
        avatar,
    },
    watch: {
        keyword(keyword) {
            keywordChanged(this, keyword);
        },
    },
    created() {
        created(this, this.$im().dataModel.Conversation);
    },
    methods: {
        toastError(errorCode) {
            let el = null;
            if (this.$parent) {
                el = this.$parent.$el.firstChild;
            }
            this.RongIM.common.toastError(errorCode, el);
        },
        getUsername(item) {
            const name = getUsernameHighlight(item);
            return filterMark(name);
        },
        executiveLimit(item) {
            if (
                item.isFriend ||
                this.$im().auth.isExecutive ||
                this.disableExecutive
            ) {
                return false;
            }
            const isExecutive = !!item.isExecutive;
            return isExecutive;
        },
        isDefault(item) {
            return this.defaultIdList.indexOf(item.id) >= 0;
        },
        isbanned(item) {
            if (this.isGroup(item)) {
                const group = item.group;
                if (group) {
                    if (group.manager_id === this.$im().auth.id) {
                        return false;
                    }
                    const members = group.groupMembers || [];
                    const theMember =
                        members.filter(
                            (member) => member.id === this.$im().auth.id
                        )[0] || {};
                    if (group.is_all_mute && theMember.mute_status !== 2) {
                        return true;
                    }
                    if (theMember.mute_status === 1) {
                        return true;
                    }
                }
            }
            return false;
        },
        isValidGroup(item) {
            if (this.isGroup(item)) {
                return checkGroupValid(item, this.$im().auth.id);
            }
            return true;
        },
        isDisabled(item) {
            return (
                this.isDefault(item) ||
                this.executiveLimit(item) ||
                this.isbanned(item) ||
                !this.isValidGroup(item)
            );
        },
        isGroup(item) {
            // return item.conversationType === 3;
            return item.id && item.id.startsWith('group_');
        },
        clear() {
            this.keyword = '';
        },
        showGroupType(group) {
            return group && group.type > 0;
        },
        getGroupType(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
    },
};

function checkGroupValid(conversation, authId) {
    const group = conversation.group || {};
    const members = group.member_id_list || [];
    let inGroup = true;
    if (members.length > 0) {
        inGroup = members.indexOf(authId) >= 0;
    }
    const isDismiss = group.group_status === 2;
    return inGroup && !isDismiss;
}

function getCheckedAll(context) {
    const starChecked = [];
    const checkedIdList = context.checked;
    context.searchResult.forEach((item) => {
        const existed = checkedIdList.indexOf(item.id) >= 0;
        if (existed) starChecked.push(item);
    });
    const length = starChecked.length;
    let result;
    if (length > 0) {
        const allMember = context.searchResult.filter(
            (item) =>
                !context.executiveLimit(item) && context.isValidGroup(item)
        );
        const isAll = length === allMember.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, value) {
    const members = context.searchResult;
    const memberIds = members
        .filter(
            (item) =>
                !context.executiveLimit(item) &&
                !context.isbanned(item) &&
                context.isValidGroup(item)
        )
        .map((item) => item.id);
    if (value) {
        context.checked = [].concat(memberIds, context.checked);
    } else {
        context.checked = context.checked.filter(
            (id) => memberIds.indexOf(id) < 0
        );
    }
}

/*
说明：转发消息，最近聊天搜索框 内容变化时，获取满足条件的群组列表
参数：
    @param {object}     context         我的群组信息
    @param {string}     keyword         搜索框关键字
*/
function keywordChanged(context, keyword) {
    if (keyword.length === 0) {
        context.searchResult = context.members;
    } else {
        context.searchResult = [];
        const searchResult = [];
        context.members.forEach((item) => {
            const nameRange = searchStrRange(item.name, context.keyword);
            const aliasRange = searchStrRange(item.alias, context.keyword);
            if (nameRange || aliasRange) {
                const result = $.extend(
                    {
                        range: nameRange,
                        aliasRange,
                    },
                    item
                );
                searchResult.push(result);
            }
        });
        // common.sortUsers(searchResult);
        context.searchResult = searchResult;
    }
}

/*
说明：转发消息时，获取 最近聊天 列表
参数：
    @param {object}     context
    @param {object}     groupApi
*/
function created(context, conversationApi) {
    conversationApi.getList(null, (errorCode, list) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        const result = [];

        // 42498 -【转发】转发窗口里的会话列表与实际的会话列表顺序不一致
        list = sortRecentList(list);

        list.forEach((conversation) => {
            const isGroup = conversation.conversationType === 3;
            const isPublic = conversation.conversationType === 7;
            let target = {};
            if (isGroup) {
                target = conversation.group;
            } else if (isPublic) {
                target = conversation.latestMessage.user;
            } else {
                target = conversation.user;
            }
            const bool = conversation.user && isSysUser(conversation.user);
            if (conversation.conversationType !== 6 && !bool) {
                result.push(formateContact(target, isGroup));
            }
        });
        context.members = result;
        context.searchResult = result;
    });
}

function formateContact(item, isGroup) {
    const obj = {
        id: isGroup ? `group_${item.id}` : item.id,
        name: item.name,
        avatar: item.avatar,
        firstNine: isGroup ? item.firstNine : [],
        member_id_list: isGroup ? item.member_id_list : [],
        isFriend: isGroup ? true : item.isFriend,
        type: item.type,
    };
    if (isGroup) {
        obj.group = item;
    }
    return obj;
}

function sortRecentList(messageList) {
    // 置顶草稿列表
    const draftTopList = messageList
        .filter((item) => item.isTop && item.draft && item.draft.editTime)
        .sort((messageItem1, messageItem2) => {
            const draft1 = messageItem1.draft;
            const draft2 = messageItem2.draft;
            return draft2.editTime - draft1.editTime;
        });
    // 置顶列表
    const topList = messageList
        .filter(
            (item) => item.isTop && (!item.draft || item.draft.content === '')
        )
        .sort((messageItem1, messageItem2) => {
            let sentTime1 = 0;
            let sentTime2 = 0;
            if (messageItem1.latestMessage) {
                sentTime1 = messageItem1.latestMessage.sentTime;
            }
            if (messageItem2.latestMessage) {
                sentTime2 = messageItem2.latestMessage.sentTime;
            }
            return sentTime2 - sentTime1;
        });
    // 草稿列表
    const draftList = messageList
        .filter((item) => item.draft && item.draft.editTime && !item.isTop)
        .sort((messageItem1, messageItem2) => {
            const draft1 = messageItem1.draft;
            const draft2 = messageItem2.draft;
            return draft2.editTime - draft1.editTime;
        });
    // 发送草稿后，会话应按时间排序
    // 普通列表
    const sortedList = messageList
        .filter(
            (item) => (!item.draft || item.draft.content === '') && !item.isTop
        )
        .sort((messageItem1, messageItem2) => {
            let sentTime1 = 0;
            let sentTime2 = 0;
            if (messageItem1.latestMessage) {
                sentTime1 = messageItem1.latestMessage.sentTime;
            }
            if (messageItem2.latestMessage) {
                sentTime2 = messageItem2.latestMessage.sentTime;
            }
            return sentTime2 - sentTime1;
        });
    // 有置顶的消息时，草稿应在置顶消息下面显示
    return [...draftTopList, ...topList, ...draftList, ...sortedList];
}
