/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import filterMark from '../../common/filterMark';
import searchStrRange from '../../utils/searchStrRange';

const pageNum = config.profile.pageNum;

// 禁言类型 0 正常状态 1 禁言黑名单 2 禁言白名单（全员禁言时可发言）
const BannedType = {
    NONE: 0,
    BANNED: 1,
    UNBANNED: 2,
};

/*
说明： 群组禁言
*/
export default function (group, _members) {
    // 群组成员禁言排除自己（自己为群组的管理者）
    group = $.extend(true, {}, group);
    const options = {
        name: 'group-banned',
        template: 'templates/conversation/group-banned.html',
        data() {
            const im = this.$im();
            const members = _members.filter((member) => {
                member._muteStatus = member.mute_status;
                return member.id !== im.auth.id;
            });
            // 获取禁言黑名单和白名单列表。
            const statusList = getSpearkersAndSilenters(group, members);
            return {
                keyword: '',
                show: true,
                members,
                bannedList: [],
                // 禁言黑名单
                silenters: statusList.silenters,
                // 禁言白名单
                speakers: statusList.speakers,
                editList: [],
                group,
                defaultGroup: $.extend(true, {}, group),
                searchResult: members,
                isBannedAll: group.is_all_mute,
                busy: false,
                pageNum,
                currentPage: 1,
                loadingNextPage: false,
            };
        },
        components: {
            avatar,
        },
        computed: {
            bannedAll: {
                get() {
                    return this.isBannedAll;
                },
                set(isBan) {
                    this.isBannedAll = isBan;
                },
            },
            /* 绑定成员列表的选中状态 */
            checked: {
                get() {
                    return getChecked(this);
                },
                set(memberIds) {
                    let isAdd = true;
                    let id;
                    const oldIds = this.checked;
                    if (memberIds.length < oldIds.length) {
                        isAdd = false;
                        id = without(oldIds, memberIds)[0];
                    } else {
                        id = without(memberIds, oldIds)[0];
                    }
                    setChecked(this, id, isAdd);
                },
            },
            // 显示禁言黑名单列表
            showBannedList() {
                return !this.isBannedAll;
            },
            pageList() {
                const context = this;
                const end = context.currentPage * context.pageNum;
                return this.searchResult.slice(0, end);
            },
        },
        watch: {
            keyword(keyword) {
                keywordChanged(this, keyword, this.members);
                $(this.$refs.list).scrollTop(0);
                this.currentPage = 1;
            },
        },
        mounted() {
            const im = this.$im();
            mounted(this, im.dataModel, im);
        },
        destroyed() {
            const im = this.$im();
            im.dataModel.Group.unwatch(this.groupChangeInBanned);
        },
        methods: {
            toastError(errorCode) {
                let el = null;
                if (this.$el) {
                    el = this.$el.firstChild;
                }
                this.RongIM.common.toastError(errorCode, el);
            },
            close() {
                this.show = false;
            },
            clear() {
                this.keyword = '';
            },
            getUsername(item) {
                const name = getUsernameHighlight(item);
                return filterMark(name);
            },
            getMemberBanned(member) {
                const isMuteAll = this.isBannedAll;
                const muteStatus = member._muteStatus;
                const isBanned = muteStatus === BannedType.BANNED;
                const isNone = muteStatus === BannedType.NONE;
                const isMute = isMuteAll && isNone;
                return isMute || isBanned;
            },
            /*
            说明： 从 speakers （禁言白名单）中移除
            */
            clearSpeakMember(member) {
                clearMember(this, {
                    member,
                    members: this.speakers,
                    status: BannedType.NONE,
                });
            },
            /*
            说明： 从 silenters （禁言黑名单）中移除
            */
            clearSilentMember(member) {
                clearMember(this, {
                    member,
                    members: this.silenters,
                    status: BannedType.NONE,
                });
                if (this.searchResult.indexOf(member) === -1) {
                    for (let i = this.searchResult.length - 1; i >= 0; i -= 1) {
                        const tempMember = this.searchResult[i];
                        if (tempMember.id === member.id) {
                            tempMember._muteStatus = BannedType.NONE;
                        }
                    }
                }
            },
            submit() {
                const context = this;
                const dataModel = context.$im().dataModel;
                // 比对群组全员禁言状态与之前一致则不做修改，只修改成员的状态。
                const isBannedAll = this.isBannedAll;
                const isSelectBannedAll = isBannedAll !== this.defaultGroup.is_all_mute;
                const close = context.close;
                if (context.busy === true) {
                    close();
                    return;
                }
                context.busy = true;
                if (!isSelectBannedAll) {
                    context.banMember();
                } else {
                    setBannedAll(context, isBannedAll, dataModel, () => {
                        context.banMember();
                    });
                }
            },
            /* 说明： 更新群成员的禁言状态 */
            banMember() {
                const context = this;
                const dataModel = context.$im().dataModel;
                const common = this.RongIM.common;
                const members = context.editList;
                const close = context.close;
                if (members.length === 0) {
                    context.busy = false;
                    close();
                    return;
                }
                const arr = members.map(member => ({ memberId: member.id, status: member._muteStatus }));
                const groupId = context.group.id;
                const params = {
                    id: groupId,
                    members: arr,
                };
                dataModel.Group.banned(params, (errorCode) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    context.busy = false;
                    close();
                    members.forEach((item) => {
                        item.mute_status = item._muteStatus;
                    });
                });
            },
            loadMore() {
                loadMore(this);
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function without(members, others) {
    return members.filter(item => others.indexOf(item) < 0);
}

function mounted(context, dataModel, im) {
    const common = context.RongIM.common;
    const groupApi = dataModel.Group;
    const auth = im.auth || {};
    const authId = auth.id;
    // 群的管理员被转让时自己已非管理员提示并关闭编辑窗口
    context.groupChangeInBanned = function groupChangeInBanned(group) {
        const isSelected = group.id === context.group.id;
        const hasGroup = group && group.admin_id;
        const isAdmin = hasGroup && group.admin_id === authId;
        const message = context.locale.components.forward.success;
        if (!isAdmin && isSelected) {
            groupApi.unwatch(context.groupChangeInBanned);
            if (context.show) {
                common.messagebox({
                    message,
                    callback() {
                        im.$emit('messageboxHide');
                        context.show = false;
                    },
                });
            }
        }
    };
    groupApi.watch(context.groupChangeInBanned);
}

/*
说明： 成员选择状态绑定 - 获取选择状态
*/
function getChecked(context) {
    const dataType = context.showBannedList ? 'silenters' : 'speakers';
    return context[dataType].map(member => member.id);
}

/*
说明： 成员选择状态绑定 - 改变选择状态
*/
function setChecked(context, memberId, isAdd) {
    const showBannedList = context.showBannedList;
    const dataType = showBannedList ? 'silenters' : 'speakers';
    const status = showBannedList ? BannedType.BANNED : BannedType.UNBANNED;

    const members = context.members;
    const member = members.filter(item => item.id === memberId)[0];

    const addFunction = {
        silenters() {
            context.silenters.push(member);
            if (context.speakers.indexOf(member) > -1) {
                const index = context.speakers.indexOf(member);
                context.speakers.splice(index, 1);
            }
        },
        speakers() {
            context.speakers.push(member);
            if (context.silenters.indexOf(member) > -1) {
                const index = context.silenters.indexOf(member);
                context.silenters.splice(index, 1);
            }
        },
    };
    const removeFuntion = {
        silenters() {
            context.silenters = context.silenters.filter(item => item.id !== memberId);
        },
        speakers() {
            context.speakers = context.speakers.filter(item => item.id !== memberId);
        },
    };

    if (isAdd) {
        member._muteStatus = status;
        addFunction[dataType]();
    } else {
        member._muteStatus = BannedType.NONE;
        removeFuntion[dataType]();
    }
    pushEditList(context, member);
}

/*
说明： 成员禁言状态已改变加入到 editList 中确定时提交服务器
*/
function pushEditList(context, theMember) {
    const isSameMember = function isSameMember(_member) {
        return _member.id === theMember.id;
    };
    const editList = context.editList;
    const isExist = editList.some(member => isSameMember(member));
    if (isExist) {
        editList.forEach((member, index) => {
            if (isSameMember(member)) {
                editList.splice(index, 1);
            }
        });
    }
    editList.push(theMember);
}

/*
说明： 设置全员禁言状态
*/
function setBannedAll(context, isBan, dataModel, callback) {
    const group = context.group;
    group.is_all_mute = isBan;
    const groupId = context.group.id;
    const status = Number(context.bannedAll);
    const params = {
        id: groupId,
        status,
    };
    dataModel.Group.bannedAll(params, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        callback();
    });
}

function loadMore(context) {
    if (!context.loadingNextPage) {
        const end = context.currentPage * context.pageNum;
        const list = context.searchResult;
        if (list && list.length > end) {
            context.loadingNextPage = true;
            setTimeout(() => {
                context.currentPage += 1;
                context.loadingNextPage = false;
            }, 200);
        }
    }
}

/*
说明： 从禁言黑名单白名单移除成员时 更新 editList
*/
function clearMember(context, params) {
    const member = params.member;
    const members = params.members;
    const status = params.status;
    member._muteStatus = status;
    const index = members.indexOf(member);
    members.splice(index, 1);
    pushEditList(context, member);
}

/*
说明： 根据关键字查找成员
*/
function keywordChanged(context, keyword, members) {
    if (keyword.length === 0) {
        context.searchResult = members;
    } else {
        const searchResult = [];
        members.forEach((item) => {
            const nameRange = searchStrRange(item.name, context.keyword);
            const aliasRange = searchStrRange(item.alias, context.keyword);
            if (nameRange || aliasRange) {
                const result = $.extend({
                    range: nameRange,
                    aliasRange,
                }, item);
                searchResult.push(result);
            }
        });
        // common.sortUsers(searchResult);
        context.searchResult = searchResult;
    }
}

/*
说明： 获取禁言黑名单和白名单列表。
*/
function getSpearkersAndSilenters(group, members) {
    const speakers = [];
    const silenters = [];
    members.forEach((member) => {
        const status = member._muteStatus;
        if (status === BannedType.BANNED) {
            silenters.push(member);
        }
        if (status === BannedType.UNBANNED) {
            speakers.push(member);
        }
    });
    return {
        silenters,
        speakers,
    };
}
