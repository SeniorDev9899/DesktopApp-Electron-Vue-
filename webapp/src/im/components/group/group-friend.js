/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import searchStrRange from '../../utils/searchStrRange';
import without from '../../common/without';
import sortUsers from '../../common/sortUsers';
import avatar from '../avatar.vue';

export default {
    name: 'friend',
    mixins: [getLocaleMixins('friend')],
    data() {
        return {
            keyword: '',
            searchResult: [],
            members: [],
        };
    },
    props: ['selected', 'defaultSelected', 'canNotSelected', 'hasFileHelper'],
    computed: {
        defaultIdList() {
            return (this.defaultSelected || []).map(item => item.id);
        },
        canNotSelectedIdList() {
            return (this.canNotSelected || []).map(item => item.id);
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
            return (typeof this.checkedAll) !== 'boolean';
        },
        checked: {
            get() {
                const context = this;
                return context.selected.filter(item => !context.isGroup(item)).map(item => item.id);
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
        created(this, this.$im().dataModel.Friend);
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
            // const name = getUsernameHighlight(item);
            // return filterMark(name);
            /**
             * 38528 -【备注名】我的好友添加备注名，创建群时我的好友列表没有显示备注名
             * Get Alias name
             */
            const RongIM = this.RongIM;
            const common = RongIM.common;
            /* eslint no-underscore-dangle: 0 */
            return item ? (RongIM.dataModel._Cache.alias[item.id] || common.getUsername(item)) : '';
        },
        isDefault(item) {
            return this.defaultIdList.indexOf(item.id) >= 0;
        },
        showNotSelect(item) {
            const canNotSelected = this.canNotSelectedIdList.indexOf(item.id) > -1;
            return canNotSelected;
        },
        isDisabled(item) {
            const canNotSelected = this.canNotSelectedIdList.indexOf(item.id) > -1;
            return this.isDefault(item) || canNotSelected;
        },
        clear() {
            this.keyword = '';
            // 42813 - 【个人名片】星标联系人和我的好友搜索后清空输入栏，点击搜索搜索结果没有重置
            this.searchResult = this.members;
        },
        isGroup(item) {
            // return item.conversationType === 3;
            return item.id.startsWith('group_');
        },
    },
};

function getCheckedAll(context) {
    const starChecked = [];
    const checkedIdList = context.checked;
    const validMember = context.searchResult.filter(item => context.canNotSelectedIdList.indexOf(item.id) === -1);
    validMember.forEach((item) => {
        const existed = checkedIdList.indexOf(item.id) >= 0;
        if (existed) starChecked.push(item);
    });
    const length = starChecked.length;
    let result;
    if (length > 0) {
        const isAll = length === validMember.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, value) {
    const validMember = context.searchResult.filter(item => context.canNotSelectedIdList.indexOf(item.id) === -1);
    const memberIds = validMember.map(item => item.id);
    if (value) {
        context.checked = [].concat(memberIds, context.checked);
    } else {
        context.checked = context.checked.filter(id => memberIds.indexOf(id) < 0);
    }
}

function keywordChanged(context, keyword) {
    if (keyword.length === 0) {
        if (context.searchResult.length === 0) {
            context.searchResult = context.members;
        }
        // context.searchResult = context.members;
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

function created(context, friendApi) {
    friendApi.getList((errorCode, list) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        sortUsers(list);
        context.members = [].concat(list);
        context.searchResult = list;
        if (context.hasFileHelper) {
            friendApi.getFileHelper((error, helper) => {
                context.members.push(helper);
                context.searchResult = context.members;
            });
        }
    });
}
