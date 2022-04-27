/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../avatar.vue';
import syncdata from '../../syncdata';
import isEmpty from '../../utils/isEmpty';
import console from '../../utils/console';
import slice from '../../utils/slice';
import getLocaleMixins from '../../utils/getLocaleMixins';
import searchName from '../../utils/searchName';
import GroupPermission from '../../utils/GroupPermission';
import groupTransfer from '../../dialog/conversation/group-transfer';
import userProfile from '../../dialog/contact/user';
import groupQRCode from '../../dialog/conversation/group-qrcode';
import groupRemoveMembers from '../../dialog/group/removemembers';
import groupBanned from '../../dialog/conversation/group-banned';
import createGroup from '../../dialog/group/create';
import system from '../../system';
import getBrowser from '../../utils/getBrowser';

const pageNum = config.groupSetting.pageNum;

/*
说明： 群设置包括成员增删，修改群名称，修改群昵称等
*/
export default {
    name: 'group-setting',
    mixins: [getLocaleMixins('group-setting')],
    props: ['group', 'members'],
    data() {
        const params = this.$im().$route.params;
        return {
            nameEditable: false,
            aliasEditable: false,
            alias: '',
            isSearch: false,
            searchName: null,
            groupNameField: '',
            aliasField: '',
            conversation: {
                conversationType: params.conversationType,
                targetId: params.targetId,
                group: {},
            },
            needJoinPermit: '',
            saveGroup: false,
            inviteMember: '',
            publishGroupNotice: '',
            pageNum,
            currentPage: 1,
        };
    },
    components: {
        avatar,
    },
    mounted() {
        const im = this.$im();
        const dataModel = im.dataModel;
        const api = {
            user: dataModel.User,
            group: dataModel.Group,
            conversation: dataModel.Conversation,
        };
        mounted(this, api, im);
    },
    watch: {
        aliasField(newVal) {
            const context = this;
            if (newVal.length > 10) {
                context.aliasField = context.aliasField.substring(0, 10);
            }
        },
    },
    beforeDestroy() {
        this.$im().$off('imclick', this.close);
    },
    computed: {
        // 双向绑定会话是否置顶
        isTop: {
            get() {
                return this.conversation.isTop;
            },
            set(checked) {
                const context = this;
                const common = this.RongIM.common;
                const conversationApi = this.$im().dataModel.Conversation;
                const action = checked ? 'top' : 'untop';
                const conversation = this.conversation;
                conversation.isTop = checked;
                setTimeout(() => {
                    conversationApi[action](conversation.conversationType, conversation.targetId, (errorCode) => {
                        if (errorCode) {
                            common.toastError(errorCode);
                            return;
                        }
                        context.$emit('set-property', 'isTop', checked);
                    });
                }, 400);
            },
        },
        // 双向绑定会话是否面打扰
        isMute: {
            get() {
                return this.conversation.notificationStatus;
            },
            set(checked) {
                const context = this;
                const conversationApi = this.$im().dataModel.Conversation;
                const common = this.RongIM.common;
                const action = checked ? 'mute' : 'unmute';
                const conversation = context.conversation;
                conversation.notificationStatus = checked;
                setTimeout(() => {
                    conversationApi[action](conversation.conversationType, conversation.targetId, (errorCode) => {
                        if (errorCode) {
                            common.toastError(errorCode);
                            return;
                        }
                        context.$emit('set-property', 'notificationStatus', checked);
                    });
                }, 400);
            },
        },
        // 双向绑定是否保存当前群组（保存到通讯录）
        isSaved: {
            get() {
                return this.saveGroup;
            },
            set(checked) {
                const context = this;
                const action = checked ? 'addToFav' : 'removeFromFav';
                const groupId = context.conversation.group.id;
                const groupApi = this.$im().dataModel.Group;
                const common = this.RongIM.common;
                groupApi[action]([groupId], (errorCode) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    context.saveGroup = checked;
                });
            },
        },
        // 双向绑定是否需要入群验证
        isAprrove: {
            get() {
                return this.needJoinPermit;
            },
            set(checked) {
                const context = this;
                const dataModel = this.$im().dataModel;
                const groupApi = dataModel.Group;
                const group = this.conversation.group;
                const needJoinPermit = checked ? 1 : 0;
                const params = {
                    need_join_permit: needJoinPermit,
                };
                context.needJoinPermit = needJoinPermit;
                // 设置成功后更新缓存信息
                setPermission(context, params, groupApi, (err) => {
                    if (err) {
                        return;
                    }
                    const cache = dataModel._Cache || {};
                    const groupCache = cache.group;
                    const groupLocale = groupCache[group.id] || {};
                    groupLocale.need_join_permit = needJoinPermit;
                });
            },
        },
        // 自建群
        isCustomGroup() {
            return this.group && this.group.type === 0;
        },
        // 1 部门 2 公司 4 全员
        // isEntGroup: function () {
        //     return this.group.type === 1 || this.group.type === 2;
        // },
        filterMembers() {
            const _list = getFilterMembers(this);
            let end = this.currentPage * this.pageNum;
            if (_list.length > end) {
                if (this.showAdd) {
                    end -= 1;
                }
                if (this.showRemove) {
                    end -= 1;
                }
            }
            return _list.slice(0, end);
        },
        // 部门公司全员群默认保存到通讯录，只有自建群需要展示保存按钮
        showSave() {
            return this.isCustomGroup;
        },
        // 只有自建群可以自行增加删除成员，部门公司全员群的成员和组织机构绑定。
        showAdd() {
            return !this.searchName && this.isCustomGroup && this.ownerManageCondition;
        },
        showRemove() {
            return !this.searchName && this.group.is_creator && this.isCustomGroup;
        },
        showQuit() {
            return this.isCustomGroup;
        },
        showEdit() {
            return this.group.is_creator && this.isCustomGroup && !this.isSpecialGroup;
        },
        isManager() {
            const im = this.$im();
            const auth = im.auth || {};
            const loginId = auth.id;
            return this.group.manager_id === loginId && !this.isSpecialGroup;
        },
        isSpecialGroup() {
            const group = this.conversation.group || {};
            const type = this.RongIM.common.getGroupType(group.type);
            return !!type;
        },
        // 仅群主可管理
        isOwnerManage: {
            get() {
                // var group = this.conversation.group;
                return this.inviteMember === GroupPermission.Owner && this.publishGroupNotice === GroupPermission.Owner;
            },
            set(checked) {
                const context = this;
                const dataModel = this.$im().dataModel;
                const groupApi = dataModel.Group;
                const group = this.conversation.group;
                const inviteMember = checked ? GroupPermission.Owner : GroupPermission.All;
                const publishGroupNotice = checked ? GroupPermission.Owner : GroupPermission.All;
                const params = {
                    invite_member: inviteMember,
                    publish_group_notice: publishGroupNotice,
                };
                context.inviteMember = inviteMember;
                context.publishGroupNotice = publishGroupNotice;

                // 设置成功后更新缓存信息
                const callback = function callback(err) {
                    if (err) {
                        return;
                    }
                    const cache = dataModel._Cache || {};
                    const groupCache = cache.group;
                    const groupLocale = groupCache[group.id] || {};
                    groupLocale.invite_member = inviteMember;
                    groupLocale.publish_group_notice = publishGroupNotice;
                };
                setPermission(context, params, groupApi, callback);
            },
        },
        ownerManageCondition() {
            return (this.isOwnerManage && this.group.is_creator) || !this.isOwnerManage;
        },
        showQRCode() {
            return this.isCustomGroup && this.ownerManageCondition;
        },
        isNotSupportScroll() {
            const browserType = getBrowser().type.toLowerCase();
            return browserType !== 'chrome' && browserType !== 'safari';
        },
    },
    directives: {
        focus: {
            inserted(el) {
                el.focus();
            },
        },
    },
    methods: {
        getGroupName() {
            return this.RongIM.common.getGroupName(this.group);
        },
        /*
            说明： 开始编辑群名称
            */
        setEditable() {
            this.groupNameField = this.getGroupName();
            this.nameEditable = true;
        },
        /*
            说明： 开始编辑自己的群昵称
            */
        setAliasEditable(editable) {
            this.aliasEditable = editable;
            this.aliasField = this.alias || '';
        },
        saveName() {
            saveName(this, this.$im().dataModel.Group, this.group);
        },
        removeEditable() {
            this.nameEditable = false;
        },
        // 开查找群成员
        setIsSearch() {
            this.isSearch = true;
        },
        clearSearch() {
            this.searchName = '';
            this.isSearch = false;
        },
        searchFocus() {
            const field = this.$refs.searchName;
            if (this.isSearch) field.focus();
        },
        delConversation() {
            const conversationApi = this.$im().dataModel.Conversation;
            delConversation(this, {
                id: this.group.id,
                type: RongIMLib.ConversationType.GROUP,
            }, conversationApi);
        },
        // 退出群组
        quitGroup(callback) {
            const groupId = this.group.id;
            const dataModel = this.$im().dataModel;
            dataModel.Group.quit(groupId, callback);
            /**
             * 38862 - 【群组】重新加入群组，置顶聊天设置自动生效
             * 当把删除并退出按钮时，call removeFromTop方法。
             */
            dataModel.Group.removeFromTop(groupId, callback);
        },
        // 解散群组
        dismissGroup() {
            const context = this;
            const RongIM = this.RongIM;
            const common = RongIM.common;
            const dataModel = this.$im().dataModel;
            const conversationApi = dataModel.Conversation;
            const locale = context.locale;
            common.messagebox({
                type: 'confirm',
                message: locale.dismissMemo,
                submitText: locale.tips.confirm,
                isAlignLeft: true,
                callback() {
                    dataModel.Group.dismiss(context.group.id, () => {
                        RongIM.system.appLogger('info', `解散群组成功 ${context.group.id}`);
                        delConversation(context, {
                            id: context.group.id,
                            type: RongIMLib.ConversationType.GROUP,
                        }, conversationApi);
                    });
                },
            });
        },
        delAndQuit() {
            const context = this;
            const locale = context.locale;
            this.RongIM.common.messagebox({
                type: 'confirm',
                message: locale.quitMemo,
                submitText: locale.tips.confirm,
                callback() {
                    delAndQuit(context, context.$im().$router);
                },
            });
        },
        // 打开添加群成员面板
        addMember() {
            createGroup(this.group, this.members);
        },
        // 打开删除群成员面板
        removeMembers() {
            groupRemoveMembers(this.group.id, this.members);
        },
        close(event) {
            this.$emit('hidepanel', event);
            // this.$im().$off('imclick', this.close);
        },
        userProfile,
        // 打开群禁言设置面板
        banned() {
            const group = this.group;
            groupBanned(group, this.members);
        },
        // 打开转让管理员面板
        transfer() {
            const group = this.group;
            groupTransfer(group, this.members);
        },
        modifyMemberAlias() {
            const im = this.$im();
            const dataModel = im.dataModel;
            modifyMemberAlias(this, dataModel.Group, im);
        },
        checkManage(user) {
            return this.group.admin_id === user.id;
        },
        openQRCode() {
            groupQRCode(this.group);
        },
        loadMore() {
            loadMore(this);
        },
    },
};

function mounted(context, api, im) {
    im.$on('imclick', (event) => {
        close(context, event);
    });
    // 获取群设置相关的信息
    const group = context.group;
    const common = context.RongIM.common;
    const groupApi = api.group;
    const conversationApi = api.conversation;
    conversationApi.getOne(context.conversation.conversationType, context.conversation.targetId, (errorCode, conversation) => {
        if (typeof conversation.notificationStatus === 'number') {
            conversation.notificationStatus = conversation.notificationStatus === 1;
        }
        context.conversation = conversation;
        groupApi.getList((error, groupList) => {
            if (error) {
                common.toastError(error);
                return;
            }
            const idList = groupList.map(item => item.id);
            context.saveGroup = idList.indexOf(group.id) >= 0;
            // Vue.set(context.conversation.group, 'saved', idList.indexOf(group.id) >= 0);
        });
    });
    groupApi.getOne(group.id, (errorCode, _group) => {
        if (errorCode) {
            common.toastError(errorCode);
            return;
        }
        context.needJoinPermit = _group.need_join_permit;
        context.inviteMember = _group.invite_member;
        context.publishGroupNotice = _group.publish_group_notice;
        const authId = im.auth.id;
        _group.groupMembers.forEach((member) => {
            if (member.id === authId) {
                context.alias = member.groupAlias;
            }
        });
    });
}

function loadMore(context) {
    const end = context.currentPage * context.pageNum;
    const list = getFilterMembers(context);
    if (list && list.length > end) {
        context.currentPage += 1;
    }
}

/*
说明： 删除会话并清除未读消息
*/
function delConversation(context, params, conversationApi) {
    const conversationType = params.type;
    const groupId = params.id;
    conversationApi.clearUnReadCount(conversationType, groupId);
    conversationApi.remove(conversationType, groupId);
}

/*
说明： 修改自己在当前群的昵称
*/
function modifyMemberAlias(context, groupApi, im) {
    const loginUser = im.loginUser || {};
    const userId = loginUser.id;
    const name = context.aliasField;
    const groupId = context.group.id;
    groupApi.modifyMemberAlias(groupId, userId, name, (errorCode) => {
        context.aliasEditable = false;
        if (errorCode) {
            context.aliasEditable = false;
            return;
        }
        syncdata.groupById([groupId], () => {
            context.alias = name;
            // 修改成员列表里群昵称
            const member = getMemberById(getFilterMembers(context), userId);
            member.htmlAlias = name || loginUser.name;
            member.alias = name;
        });
    });
}

function getMemberById(members, id) {
    let member;
    for (let i = 0; i < members.length; i += 1) {
        const item = members[i];
        if (item.id === id) {
            member = members[i];
            break;
        }
    }
    return member;
}

/*
说明： 根据关键字搜索群成员
*/
function getFilterMembers(context) {
    const keyword = context.searchName;
    const members = context.members.concat([]);
    members.reverse();
    if (isEmpty(keyword)) {
        for (let i = 0; i < members.length; i += 1) {
            const item = members[i];
            if (item.id === context.group.admin_id) {
                const memberTemp = members[i];
                members[i] = members[0];
                members[0] = memberTemp;
                break;
            }
        }
        return members;
    }
    return members.filter(member => searchName([member.name, member.alias], keyword));
}

/*
说明： 修改群名称
*/
function saveName(context, groupApi, group) {
    const MAX_LENGTH = 16;
    const common = context.RongIM.common;
    const newGroupName = slice(context.groupNameField, MAX_LENGTH);
    const changed = newGroupName !== context.group.name && !isEmpty(newGroupName);
    if (context.nameEditable && changed) {
        const oldName = group.name;
        group.name = newGroupName;
        groupApi.rename(group.id, newGroupName, (errorCode) => {
            if (errorCode) {
                group.name = oldName;
                common.toastError(errorCode);
            }
        });
    }
    context.removeEditable();
}

function close(context, event) {
    const $target = $(event.target);
    const wrap = '.rong-dialog, .rong-group-create, .rong-group-remove';
    const inBody = $target.closest('body').length > 0;
    const inWrap = $target.closest(wrap).length < 1;
    const isOuter = inBody && inWrap;
    if (isOuter) context.close(event);
}

/*
说明： 退出群组并退出当前会话
*/
function delAndQuit(context, router) {
    const common = context.RongIM.common;
    context.quitGroup((errorCode/* , result */) => {
        if (errorCode) {
            system.appLogger('error', `退出群组失败 ${JSON.stringify(errorCode)}`);
            common.toastError(errorCode);
            return;
        }
        context.delConversation();
        system.appLogger('info', `退出群组，群组 id： ${context.group.id}`);
        router.push({
            name: 'conversation',
            query: {
                force: 1,
            },
        });
        common.messageToast({
            message: common.getErrorMessage('contact-5'),
        });
        // 退出群后，清空本地数库内当前会话消息，以便用户在再次加入群后，能收到离开群时别人发的消息
        // 产品逻辑因公司而异，请适当打开此代码
        // context.$im().dataModel.Conversation.clearMessages(ConversationType.GROUP,context.group.id)
    });
}

function setPermission(context, params, groupApi, callback) {
    callback = callback || $.noop;
    groupApi.setPermission(context.group.id, params, (err) => {
        if (err) {
            console.log('set permission error: ', err);
        }
        callback(err);
    });
}
