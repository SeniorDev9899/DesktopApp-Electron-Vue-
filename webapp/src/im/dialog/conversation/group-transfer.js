/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import searchStrRange from '../../utils/searchStrRange';
import templateFormat from '../../utils/templateFormat';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import filterMark from '../../common/filterMark';

const pageNum = config.profile.pageNum;

/*
说明： 群组管理员转让
参数： @param {object} group 需要转让管理员的群组
*/
export default function (group, _members) {
    const options = {
        name: 'group-transfer',
        template: 'templates/conversation/group-transfer.html',
        data() {
            // 成员列表排除自己，自己不可将管理员转让给自己
            group = $.extend(true, {}, group);
            const members = _members.filter((member) => {
                const isMemberRole = (member.id !== this.$im().auth.id);
                Vue.set(member, 'role', 0);
                return isMemberRole;
            });
            return {
                show: true,
                keyword: '',
                members,
                groupId: group.id,
                searchResult: members,
                pageNum,
                currentPage: 1,
                loadingNextPage: false,
            };
        },
        components: {
            avatar,
        },
        computed: {
            // 双向绑定成员选择状态
            groupOwner: {
                get() {
                    return getChecked(this.members);
                },
                set(memberIds) {
                    setChecked(this.members, memberIds);
                },
            },
            pageList() {
                const context = this;
                const end = context.currentPage * context.pageNum;
                return this.searchResult.slice(0, end);
            },
        },
        watch: {
            keyword(keyword) {
                this.searchResult = searchMember(keyword, this.members);
                $(this.$refs.list).scrollTop(0);
                this.currentPage = 1;
            },
        },
        mounted() {
            const im = this.$im();
            mounted(this, im.dataModel, im);
        },
        destroyed() {
            this.$im().dataModel.Group.unwatch(this.groupChangeInTransfer);
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
            /*
            说明： 转让群管理
            */
            transfer() {
                const context = this;
                const locale = context.locale;
                const groupId = context.groupId;
                const theMember = context.members.filter(member => member.role === 1)[0];
                const message = templateFormat(locale.message, theMember.name);
                const common = this.RongIM.common;
                const groupApi = this.$im().dataModel.Group;
                common.messagebox({
                    type: 'confirm',
                    message,
                    submitText: locale.tips.confirm,
                    isAlignLeft: true,
                    callback() {
                        const parmas = {
                            id: groupId,
                            manager: theMember.id,
                        };
                        groupApi.transfer(parmas, (errorCode) => {
                            if (errorCode) {
                                context.toastError(errorCode);
                                return;
                            }
                            context.show = false;
                            common.messagebox({
                                message: context.locale.components.forward.success,
                            });
                        });
                    },
                });
            },
            loadMore() {
                loadMore(this);
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function mounted(context, dataModel, im) {
    const groupApi = dataModel.Group;
    const auth = im.auth || {};
    const authId = auth.id;
    const common = context.RongIM.common;
    // 监听群组信息改变，自己不是管理员时关闭转让面板并提示
    context.groupChangeInTransfer = function groupChangeInTransfer(group) {
        const isSelected = group.id === context.groupId;
        const hasGroup = group && group.admin_id;
        const isAdmin = hasGroup && group.admin_id === authId;
        const message = context.locale.components.forward.success;
        if (!isAdmin && isSelected) {
            groupApi.unwatch(context.groupChangeInTransfer);
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
    groupApi.watch(context.groupChangeInTransfer);
}

// 获取成员选择状态
function getChecked(members) {
    return members.filter((member) => {
        const isOwner = (member.role === 1);
        return isOwner;
    }).map(member => member.id);
}

// 设置成员选择状态
function setChecked(members, memberIds) {
    members.forEach((member) => {
        const isOwner = (member.role === 1);
        member.role = 0;
        memberIds.forEach((memberId) => {
            const isSelected = (member.id === memberId);
            if (!isOwner && isSelected) {
                member.role = 1;
            }
        });
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
说明： 根据关键字查找群成员
参数：
    @param {string} keyword 搜索关键字
    @param {Array}  members 从改成员集合中查找
*/
function searchMember(keyword, members) {
    let searchResult = [];
    if (keyword.length === 0) {
        searchResult = members;
    } else {
        members.forEach((item) => {
            const nameRange = searchStrRange(item.name, keyword);
            const aliasRange = searchStrRange(item.alias, keyword);
            if (nameRange || aliasRange) {
                const result = $.extend({
                    range: nameRange,
                    aliasRange,
                }, item);
                searchResult.push(result);
            }
        });
        // common.sortUsers(searchResult);
    }
    return searchResult;
}
