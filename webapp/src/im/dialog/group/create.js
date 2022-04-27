/* eslint-disable no-param-reassign */
import config from '../../config';
import system from '../../system';
import GroupPermission from '../../utils/GroupPermission';
import isEmpty from '../../utils/isEmpty';
import toThousands from '../../utils/toThousands';
import avatar from '../../components/avatar.vue';
import groupComponents from '../../components/group';
import getGroupNameHandle from '../../common/getGroupName';
import without from '../../common/without';
import { getServerConfigByChainedKey } from '../../cache/helper';

const { getOrg, getFriend, getStar } = groupComponents;
const pageNum = config.profile.pageNum;

/*
说明：创建群组
功能：通过企业通讯录、星标联系人、我的好友选择联系人创建群组
参数：
    @param {string}           groupId       群组Id
    @param {array<object>}    members
*/
export default function (groupInfo, members) {
    const groupPermission = GroupPermission;

    const options = {
        name: 'group-create',
        template: 'templates/group/create.html',
        data() {
            const enabledFriend = getServerConfigByChainedKey('friend.enable');
            // 星标联系人
            const enabledStar = config.modules.star;
            members = members.map(item => this.RongIM.common.unifyUser(item));
            const im = this.$im();
            const maxCount = getServerConfigByChainedKey('group.max_member_count') || config.maxGroupMemberNum;
            return {
                maxCount,
                enabledFriend,
                enabledStar,
                group: groupInfo,
                groupId: groupInfo ? groupInfo.id : null,
                show: true,
                groupName: '',
                // 'star' or 'org'
                tab: 'org',
                defaultSelected: $.extend(true, [], members),
                busy: false,
                selected: [],
                selectedPage: 1,
                pageNum,
                loadBusy: false,
                isStaff: im.auth.isStaff,
                disableExecutive: false,
            };
        },
        components: {
            avatar,
            star: getStar,
            org: getOrg,
            friend: getFriend,
        },
        computed: {
            groupIdExisted() {
                return !isEmpty(this.groupId);
            },
            isOwnerManage() {
                const group = this.group || {};
                return group.invite_member === groupPermission.Owner && group.publish_group_notice === groupPermission.Owner;
            },
            selectedPageList() {
                const end = this.selectedPage * this.pageNum;
                return this.selected.slice(0, end);
            },
        },
        created() {
            this.selected = [].concat(this.defaultSelected);
            if (!this.isStaff) {
                this.tab = 'star';
            }
        },
        watch: {
            selected() {
                this.selectedPage = 1;
            },
        },
        methods: {
            reset() {
                this.selected.push({});
                this.selected.pop();
            },
            toastError(errorCode) {
                this.RongIM.common.toastError(errorCode, this.$el.firstChild);
            },
            toast(params) {
                params.el = this.$el.firstChild;
                this.RongIM.common.messageToast(params);
            },
            close() {
                this.show = false;
            },
            setTab(tab) {
                this.tab = tab;
            },
            isDefault(item) {
                const idList = this.defaultSelected.map(temp => temp.id);
                return idList.indexOf(item.id) >= 0;
            },
            removeMembers(memberList) {
                removeMembers(this, memberList);
            },
            added(memberList) {
                added(this, memberList);
            },
            removed(memberList) {
                removed(this, memberList);
            },
            getGroupName() {
                return getGroupName(this);
            },
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            createGroup() {
                const dataModel = this.$im().dataModel;
                const api = {
                    group: dataModel.Group,
                    conversation: dataModel.Conversation,
                };
                createGroup(this, api);
            },
            addMembers() {
                const dataModel = this.$im().dataModel;
                addMembers(this, dataModel.Group, this.groupId);
            },
            maxCountLimit() {
                const im = this.$im();
                const mostReceiveFormat = im.locale.errorCode['10645'];
                let count = this.maxCount;
                if (config.locale !== 'zh') {
                    count = toThousands(count);
                }
                const hintMessage = this.localeFormat(mostReceiveFormat, count);
                this.toast({
                    type: 'error',
                    message: hintMessage,
                });
                this.reset();
            },
            loadMore() {
                loadMore(this);
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function loadMore(context) {
    const end = context.selectedPage * context.pageNum;
    const list = context.selected;
    if (list && list.length > end) {
        context.loadBusy = true;
        setTimeout(() => {
            context.loadBusy = false;
            context.selectedPage += 1;
        }, 200);
    }
}

/*
说明：创建群组时，勾选要加入群组的成员
参数：
    @param {object}           context       群组信息
    @param {object}           members       勾选的成员信息
*/
function added(context, members) {
    const im = context.$im();
    const selectedIdList = context.selected.map(item => item.id);
    const addedList = members.filter(item => selectedIdList.indexOf(item.id) < 0);
    const totalCount = selectedIdList.length + addedList.length;
    context.selected = context.selected.concat(addedList);
    if (totalCount > context.maxCount) {
        const mostReceiveFormat = im.locale.errorCode['10645'];
        let count = context.maxCount;
        if (config.locale !== 'zh') {
            count = toThousands(count);
        }
        const hintMessage = context.localeFormat(mostReceiveFormat, count);
        context.toast({
            type: 'error',
            message: hintMessage,
        });
        context.removed(members);
    }
}

/*
说明：创建群组时，取消已勾选的成员
参数：
    @param {object}           context       群组信息
    @param {object}           members       已勾选的成员信息
*/
function removed(context, members) {
    const idList = members.map(item => item.id);
    const reservedIdList = context.defaultSelected.map(item => item.id);
    context.selected = context.selected.filter((item) => {
        const reserved = reservedIdList.indexOf(item.id) >= 0;
        return reserved || idList.indexOf(item.id) < 0;
    });
}

/*
说明：创建群组时，右侧移除已选择的成员
参数：
    @param {object}           context       群组信息
    @param {object}           members       移除的成员信息
*/
function removeMembers(context, members) {
    members = [].concat(members);
    const idList = members.map(item => item.id);
    context.selected = context.selected.filter(item => idList.indexOf(item.id) < 0);
}

/*
说明：获取群组名称
参数：
    @param {object}           context       群组信息
*/
function getGroupName(context) {
    let groupName;
    if (context.groupName) {
        groupName = context.groupName;
    } else {
        const MAX_LENGTH = 16;
        let memberNames = context.selected;
        memberNames = memberNames.slice(0, MAX_LENGTH)
            .map(item => item.name);
        const group = {
            member_names: memberNames,
        };
        groupName = getGroupNameHandle(group);
    }
    return groupName;
}

/*
说明：创建群组
参数：
    @param {object}           context
    @param {object}           api       ·
*/
function createGroup(context, api) {
    const im = context.$im();
    const groupApi = api.group;
    const conversationApi = api.conversation;
    if (context.busy) {
        return;
    }

    const memberIdList = context.selected
        .map(item => item.id);

    if (memberIdList.length === 2) {
        const targetId = memberIdList[1];
        const conversationType = RongIMLib.ConversationType.PRIVATE;
        const params = {
            targetId,
            conversationType,
        };
        im.$router.push({
            name: 'conversation',
            params,
        });
        conversationApi.add(params);
        context.close();
        return;
    }

    const RongIM = context.RongIM;
    const common = RongIM.common;
    const groupNameLength = context.groupName.length;
    if (groupNameLength > 0 && groupNameLength < 2) {
        common.messageToast({
            type: 'error',
            message: context.locale.groupNameErr,
        });
        return;
    }

    const group = {
        // 0: 自建群, 1: 官方群
        type: 0,
        name: context.getGroupName(),
        member_ids: memberIdList,
    };

    context.busy = true;
    groupApi.create(group, (errorCode, result) => {
        context.busy = false;
        if (errorCode) {
            system.appLogger('error', `创建群组失败 ${JSON.stringify(errorCode)}`);
            context.toastError(errorCode);
            return;
        }
        context.show = false;
        const path = {
            name: 'conversation',
            params: {
                targetId: result.id,
                conversationType: RongIMLib.ConversationType.GROUP,
            },
        };
        system.appLogger('info', `创建群组成功 ${result.id}`);
        im.$router.push(path);
        common.messageToast({
            message: context.locale.createSuccess,
        });
    });
}

/*
说明：已经存在的群，群设置中添加新的群组成员
参数：
    @param {object}           context       群组信息
    @param {object}           groupApi      群组 API 接口
    @param {sring}            groupId       群组 ID
*/
function addMembers(context, groupApi, groupId) {
    if (context.busy) {
        return;
    }
    if (context.isOwnerManage && !context.group.is_creator) {
        context.toast({
            message: context.locale.onlyOwnerManageTips,
            type: 'error',
        });
        return;
    }
    const memberIdList = without(context.selected, context.defaultSelected)
        .map(item => item.id);
    if (memberIdList.length < 1) {
        context.close();
        return;
    }
    context.busy = true;
    const auth = context.$im().auth || {};
    const group = getGroupDetail(groupId, context.$im().dataModel);
    const loginId = auth.id;
    const adminId = group.admin_id;
    const needJoinPermit = group.need_join_permit;
    const isAdmin = adminId === loginId;
    const isSuccess = isAdmin || !needJoinPermit;
    const toast = isSuccess ? context.locale.addMemberSuccess : context.locale.addMemberPermit;
    const locale = context.locale.createNotice;

    const common = context.RongIM.common;
    const callback = function callback() {
        groupApi.addMembers(groupId, memberIdList, (errorCode) => {
            context.busy = false;
            if (errorCode) {
                common.toastError(errorCode);
                return;
            }
            common.messageToast({
                message: toast,
                type: 'success',
            });
        });
        context.close();
    };
    const closeCallback = function closeCallback() {
        context.busy = false;
    };
    if (isSuccess) {
        callback();
    } else {
        common.messagebox(({
            message: locale,
            type: 'confirm',
            closeCallback,
            callback,
        }));
    }
}

function getGroupDetail(groupId, dataModel) {
    // eslint-disable-next-line no-underscore-dangle
    const cache = dataModel._Cache;
    const group = cache.group;
    return group[groupId];
}
