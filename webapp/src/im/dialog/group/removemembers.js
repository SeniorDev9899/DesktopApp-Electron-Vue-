/* eslint-disable no-param-reassign */
import config from '../../config';
import isEmpty from '../../utils/isEmpty';
import searchName from '../../utils/searchName';
import avatar from '../../components/avatar.vue';
import without from '../../common/without';

const pageNum = config.profile.pageNum;

/*
说明：已经存在的群，群设置中移除群组成员
参数：
    @param {sring} groupId 群组 ID
*/
export default function (groupId, members) {
    const options = {
        name: 'group-removemembers',
        template: 'templates/group/removemembers.html',
        data() {
            const authId = this.$im().auth.id;
            const copyMembers = members.filter(item => item.id !== authId);
            return {
                show: true,
                members: copyMembers,
                showList: copyMembers,
                keyword: '',
                selected: [],
                pageNum,
                currentPage: 1,
                currentRemovePage: 1,
                loadingNextPage: false,
                loadingRemoveNextPage: false,
            };
        },
        components: {
            avatar,
        },
        // mounted() {
        //     this.getGroupMembers();
        // },
        computed: {
            filterList() {
                const context = this;
                const end = context.currentPage * context.pageNum;
                return context.showList.slice(0, end);
            },
            selectedList() {
                const context = this;
                const end = context.currentRemovePage * context.pageNum;
                return this.selected.slice(0, end);
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
                return (typeof this.checkedAll) !== 'boolean';
            },
        },
        watch: {
            keyword() {
                this.showList = getFilterList(this);
                $(this.$refs.list).scrollTop(0);
                this.currentPage = 1;
            },
        },
        methods: {
            toastError(errorCode) {
                let el = null;
                if (this.$el) {
                    el = this.$el.firstChild;
                }
                this.RongIM.common.toastError(errorCode, el);
            },
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            // getGroupMembers() {
            //     const im = this.$im();
            //     const params = {
            //         groupId,
            //         authId: im.auth.id,
            //     };
            //     getGroupMembers(this, im.dataModel.Group, params);
            // },
            remove(index) {
                this.selected.splice(index, 1);
            },
            clear() {
                this.keyword = null;
            },
            removeMembers() {
                removeMembers(this, this.$im().dataModel.Group, groupId);
            },
            close() {
                this.show = false;
            },
            loadMoreOrigin() {
                loadMore(this);
            },
            loadMoreSelected() {
                loadMore(this, 'remove');
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

/*
功能： 根据搜索关键词以及群组成员，获取需要展示到面板上的成员列表
说明： 如果搜索关键词为空，则直接返回群组所有成员列表，如果搜索关键词不为空，则筛选并返回满足条件的群组成员
*/
function getFilterList(context) {
    const keyword = context.keyword;
    let filterList;
    if (isEmpty(keyword)) {
        filterList = context.members;
    } else {
        filterList = context.members.filter((item) => {
            const list = [item.name, item.alias];
            return searchName(list, keyword);
        });
    }
    return filterList;
}

/*
说明：获取是否 全选 群成员
*/
function getCheckedAll(context) {
    const selected = [];
    const selectedIdList = context.selected.map(item => item.id);
    context.filterList.forEach((item) => {
        const existed = selectedIdList.indexOf(item.id) >= 0;
        if (existed) selected.push(item);
    });
    const length = selected.length;
    let result;
    if (length > 0) {
        const isAll = length === context.filterList.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

/*
说明：将全部群成员选中
参数：
    @param {boolean}      value       是否全选
*/
function setCheckedAll(context, value) {
    const list = context.showList;
    if (value) {
        context.selected = [].concat(list, context.selected);
    } else {
        context.selected = without(context.selected, list);
    }
}

function loadMore(context, type) {
    let isLoading;
    let current;
    let list;
    if (type === 'remove') {
        isLoading = context.loadingRemoveNextPage;
        current = context.currentRemovePage;
        list = context.selected;
    } else {
        isLoading = context.loadingNextPage;
        current = context.currentPage;
        list = context.showList;
    }
    if (!isLoading) {
        const end = current * context.pageNum;
        if (list && list.length > end) {
            if (type === 'remove') {
                context.loadingRemoveNextPage = true;
                setTimeout(() => {
                    context.currentRemovePage += 1;
                    context.loadingRemoveNextPage = false;
                }, 200);
            } else {
                context.loadingNextPage = true;
                setTimeout(() => {
                    context.currentPage += 1;
                    context.loadingNextPage = false;
                }, 200);
            }
        }
    }
}

/*
说明：获取 群组成员的数组列表
参数：
    @param {object}      params     (groupId、 authId) 群组 ID、 用户 ID
*/
// function getGroupMembers(context, groupApi, params) {
//     groupApi.getAllMembers(params.groupId, (errorCode, members) => {
//         if (errorCode) {
//             context.toastError(errorCode);
//             return;
//         }
//         context.members = members.filter(item => item.id !== params.authId);
//         context.showList = context.members;
//     });
// }

// function selectAll(val, context) {
//     var arrSelect = [];
//     var arrMembers = $.extend(true, [], context.members);
//     arrMembers.forEach(function (member, index, arr) {
//         if(val){
//             arrSelect.push(member.id);
//         }
//     });
//     context.selected = arrSelect;
//     context.members = arrMembers;
//     context.isSelectAll = val;
// }

/*
说明：确定移除群组中已选择的成员
参数：
    @param {string}      groupId       群组 ID
*/
function removeMembers(context, groupApi, groupId) {
    if (context.selected.length < 1) {
        context.RongIM.common.messagebox({
            message: context.locale.selectNone,
        });
        return;
    }
    const memberIdList = context.selected.map(item => item.id);
    groupApi.removeMembers(groupId, memberIdList, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.close();
    });
}
