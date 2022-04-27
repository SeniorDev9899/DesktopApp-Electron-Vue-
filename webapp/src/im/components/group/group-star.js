/* eslint-disable no-param-reassign */
import config from '../../config';
import getLocaleMixins from '../../utils/getLocaleMixins';
import searchStrRange from '../../utils/searchStrRange';
import without from '../../common/without';
import sortUsers from '../../common/sortUsers';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import filterMark from '../../common/filterMark';
import avatar from '../avatar.vue';

const pageNum = config.profile.pageNum;

/*
说明： 选择星标联系人通用组件
    props
        selected            选中的用户
        defaultSelected     默认选中的用户
        canNotSelected      不可选择的用户
        disableExecutive    禁用高管模式
    data
        keywork             搜索关键字
        searchResult        页面绑定搜索结果
        members             所有的星标联系人
*/
export default {
    name: 'star',
    mixins: [getLocaleMixins('star')],
    data() {
        return {
            keyword: '',
            searchResult: [],
            members: [],
            pageNum,
            currentPage: 1,
        };
    },
    props: ['selected', 'defaultSelected', 'canNotSelected', 'disableExecutive'],
    computed: {
        defaultIdList() {
            return (this.defaultSelected || []).map(item => item.id);
        },
        pageList() {
            const end = this.currentPage * this.pageNum;
            return this.searchResult.slice(0, end).filter(item => !!item);
        },
        canNotSelectedIdList() {
            return (this.canNotSelected || []).map(item => item.id);
        },
        /* 页面绑定 "全选按钮" */
        checkedAll: {
            get() {
                return getCheckedAll(this);
            },
            set(value) {
                setCheckedAll(this, value);
            },
        },
        /* "全选按钮" 的半选状态 */
        indeterminate() {
            if (this.isCardSelect) {
                return false;
            }
            return (typeof this.checkedAll) !== 'boolean';
        },
        /* 用户的选中状态 */
        checked: {
            get() {
                return this.selected.map(item => item.id);
            },
            set(newMemberIds) {
                const context = this;
                const userApi = this.$im().dataModel.User;
                userApi.get(newMemberIds, (errorCode, newMembers) => {
                    newMembers = [].concat(newMembers);
                    if (errorCode) {
                        context.toastError(errorCode);
                        return;
                    }
                    userApi.get(context.checked, (UerrorCode, oldMembers) => {
                        oldMembers = [].concat(oldMembers);
                        if (UerrorCode) {
                            context.toastError(UerrorCode);
                            return;
                        }
                        const addedList = without(newMembers, oldMembers);
                        if (addedList.length > 0) context.$emit('added', addedList);

                        const removedList = without(oldMembers, newMembers);
                        const listLen = removedList.length;
                        if (listLen > 0) context.$emit('removed', removedList);
                    });
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
        created(this, this.$im().dataModel.Star);
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
            if ((item && item.isFriend) || this.$im().auth.isExecutive || this.disableExecutive) {
                return false;
            }
            const isExecutive = item && !!item.isExecutive;
            return isExecutive;
        },
        isDefault(item) {
            return this.defaultIdList.indexOf(item.id) >= 0;
        },
        showNotSelect(item) {
            const canNotSelected = item && this.canNotSelectedIdList.indexOf(item.id) > -1;
            return this.executiveLimit(item) || canNotSelected;
        },
        isDisabled(item) {
            const canNotSelected = this.canNotSelectedIdList.indexOf(item.id) > -1;
            return this.isDefault(item) || this.executiveLimit(item) || canNotSelected;
        },
        clear() {
            this.keyword = '';
            // 42813 - 【个人名片】星标联系人和我的好友搜索后清空输入栏，点击搜索搜索结果没有重置
            this.searchResult = this.members;
        },
        loadMore() {
            loadMore(this);
        },
    },
};

/*
说明： 判断 "全选按钮" 的全选状态
*/
function getCheckedAll(context) {
    // 当前搜索结果中选中的用户的列表
    const starChecked = [];
    const checkedIdList = context.checked;
    context.searchResult.forEach((item) => {
        const existed = item && checkedIdList.indexOf(item.id) >= 0;
        if (existed) starChecked.push(item);
    });
    const length = starChecked.length;
    let result;
    if (length > 0) {
        // 有效的用户 排除高管和不可选中的用户
        const validMemberList = context.searchResult.filter((item) => {
            const nothaveExecutivelimit = !context.executiveLimit(item);
            const canSelected = context.canNotSelectedIdList.indexOf(item.id) === -1;
            return nothaveExecutivelimit && canSelected;
        });
        const isAll = length === validMemberList.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

/*
说明： 全选当前搜索展示的用户
*/
function setCheckedAll(context, value) {
    const members = context.searchResult;
    // 有效的用户 id 排除高管和不可选中的用户
    const validMemberIdList = members.filter((item) => {
        const nothaveExecutivelimit = !context.executiveLimit(item);
        const canSelected = context.canNotSelectedIdList.indexOf(item.id) === -1;
        return nothaveExecutivelimit && canSelected;
    }).map(item => item.id);
    if (value) {
        context.checked = [].concat(validMemberIdList, context.checked);
    } else {
        context.checked = context.checked.filter(id => validMemberIdList.indexOf(id) < 0);
    }
}

function keywordChanged(context, keyword) {
    if (keyword.length === 0) {
        if (context.searchResult.length === 0) {
            context.searchResult = context.members;
        }
    } else {
        context.searchResult = [];
        const searchResult = [];
        context.members.forEach((item) => {
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
        sortUsers(searchResult);
        context.searchResult = searchResult;
    }
}

function created(context, starApi) {
    starApi.getList((errorCode, list) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        sortUsers(list);
        context.members = list;
        context.searchResult = list;
    });
}

function loadMore(context) {
    const end = context.currentPage * context.pageNum;
    const list = context.searchResult;
    if (list && list.length > end) {
        context.currentPage += 1;
    }
}
