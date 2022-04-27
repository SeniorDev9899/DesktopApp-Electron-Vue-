/* eslint-disable no-param-reassign */
import config from '../../config';
import GroupPermission from '../../utils/GroupPermission';
import isEmpty from '../../utils/isEmpty';
import toThousands from '../../utils/toThousands';
import avatar from '../../components/avatar.vue';
import groupComponents from '../../components/group';

import without from '../../common/without';
import { getServerConfigByChainedKey } from '../../cache/helper';

const { getOrg, getFriend, getStar } = groupComponents;
const pageNum = config.profile.pageNum;

/*
说明：选择sealrtc的邀请人员
功能：通过企业通讯录、星标联系人、我的好友选择联系人邀请人员rtc
参数：
    @param {string}           groupId       群组Id
    @param {array<object>}    members
*/
export default function (groupInfo, members) {
    const groupPermission = GroupPermission;
    const def = $.Deferred();
    const options = {
        name: 'rtc-add-receiver',
        template: 'templates/seal-meeting/add-receiver.html',
        data() {
            const enabledFriend = getServerConfigByChainedKey('friend.enable');
            // 星标联系人
            const enabledStar = config.modules.star;
            members = members.map(item => this.RongIM.common.unifyUser(item));
            const im = this.$im();
            const maxCount = getServerConfigByChainedKey('pin.max_receiver_count')
                || config.maxGroupMemberNum;
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
                return (
                    group.invite_member === groupPermission.Owner
                    && group.publish_group_notice === groupPermission.Owner
                );
            },
            selectedPageList() {
                const end = this.selectedPage * this.pageNum;
                return this.selected.slice(0, end);
            },
            canNotSelected() {
                const loginUser = this.$im().loginUser || { id: '' };
                return [loginUser];
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
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            submit() {
                // const memberIdList = context.selected.map(item => item.id);
                def.resolve(this.selected);
                this.close();
            },
            addMembers() {
                const dataModel = this.$im().dataModel;
                addMembers(this, dataModel.Group, this.groupId);
            },
            maxCountLimit() {
                let count = this.maxCount;
                if (config.locale !== 'zh') {
                    count = toThousands(count);
                }
                const hintMessage = this.localeFormat(this.locale.components.meetingSchedule.mostReceive, count);
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
    return def.promise();
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
    const selectedIdList = context.selected.map(item => item.id);
    const addedList = members.filter(
        item => selectedIdList.indexOf(item.id) < 0,
    );
    const totalCount = selectedIdList.length + addedList.length;
    context.selected = context.selected.concat(addedList);

    // PIN 最大人数由服务端下发
    const hintMessage = context.localeFormat(context.locale.components.meetingSchedule.mostReceive, context.maxCount);
    if (totalCount > context.maxCount) {
        context.toast({
            type: 'error',
            message: hintMessage,
        });
        removed(context, members);
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
    context.selected = context.selected.filter(
        item => idList.indexOf(item.id) < 0,
    );
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
    const memberIdList = without(context.selected, context.defaultSelected).map(
        item => item.id,
    );
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
    const toast = isSuccess
        ? context.locale.addMemberSuccess
        : context.locale.addMemberPermit;
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
        common.messagebox({
            message: locale,
            type: 'confirm',
            closeCallback,
            callback,
        });
    }
}

function getGroupDetail(groupId, dataModel) {
    // eslint-disable-next-line no-underscore-dangle
    const cache = dataModel._Cache;
    const group = cache.group;
    return group[groupId];
}
