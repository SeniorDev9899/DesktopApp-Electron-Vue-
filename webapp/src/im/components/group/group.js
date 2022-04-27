/* eslint-disable no-param-reassign */
// var im = RongIM.instance;
// var dataModel = im.dataModel;
import getLocaleMixins from '../../utils/getLocaleMixins';
import searchStrRange from '../../utils/searchStrRange';
import without from '../../common/without';
import filterMark from '../../common/filterMark';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import avatar from '../avatar.vue';

/*
说明：转发时选择群组
功能：消息转发时，选择 我的群组 模块
*/
export default {
    name: 'friend',
    mixins: [getLocaleMixins('firend')],
    data() {
        return {
            keyword: '',
            searchResult: [],
            groups: [],
        };
    },
    props: ['selected', 'defaultSelected', 'hasFileHelper'],
    computed: {
        defaultIdList() {
            return (this.defaultSelected || []).map(item => item.id);
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
                return context.selected.filter(item => context.isGroup(item)).map(item => item.id);
            },
            set(newGroupIds) {
                const context = this;
                const groupApi = this.$im().dataModel.Group;
                newGroupIds = mapIds(newGroupIds);
                groupApi.getBatch(newGroupIds, (errorCode, newGroups) => {
                    newGroups = getGroups(newGroups);
                    if (errorCode) {
                        context.toastError(errorCode);
                        return;
                    }

                    const checkedIds = mapIds(context.checked);
                    groupApi.getBatch(checkedIds, (UerrorCode, oldGroups) => {
                        oldGroups = getGroups(oldGroups);
                        if (UerrorCode) {
                            context.toastError(UerrorCode);
                            return;
                        }
                        const addedList = without(newGroups, oldGroups);

                        if (addedList.length > 0) context.$emit('added', addedList);

                        const removedList = without(oldGroups, newGroups);
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
        created(this, this.$im().dataModel.Group);
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
        getGroupType(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
        isDefault(item) {
            return this.defaultIdList.indexOf(item.id) >= 0;
        },
        isbanned(item) {
            if (this.isGroup(item)) {
                const group = item.group;
                if (group) {
                    const members = group.groupMembers || [];
                    const theMember = members.filter(
                        member => member.id === this.$im().auth.id,
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
            return this.isDefault(item) || this.isbanned(item) || !this.isValidGroup(item);
        },
        clear() {
            this.keyword = '';
        },
        isGroup(item) {
            // return item.conversationType === 3;
            return item.id.startsWith('group_');
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
    const isDismiss = (group.group_status === 2);
    return inGroup && !isDismiss;
}

function mapIds(ids) {
    return ids.map(id => id.replace('group_', ''));
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
        const isAll = length === context.searchResult.length;
        result = isAll ? true : null;
    } else {
        result = false;
    }
    return result;
}

function setCheckedAll(context, value) {
    const memberIds = context.searchResult.filter(item => !context.isbanned(item) && context.isValidGroup(item)).map(item => item.id);
    if (value) {
        context.checked = [].concat(memberIds, context.checked);
    } else {
        const array = context.checked.filter(id => memberIds.indexOf(id) < 0);
        context.checked = array;
    }
}

/*
说明：转发消息，我的群组搜索框 内容变化时，获取满足条件的群组列表
参数：
    @param {object}     context         我的群组信息
    @param {string}     keyword         搜索框关键字
*/
function keywordChanged(context, keyword) {
    if (keyword.length === 0) {
        if (context.searchResult.length === 0) {
            context.searchResult = context.groups;
        }
        // context.searchResult = context.groups;
    } else {
        context.searchResult = [];
        const searchResult = [];
        context.groups.forEach((item) => {
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
说明：转发消息时，获取 我的群组 列表
参数：
    @param {object}     context
    @param {object}     groupApi
*/
function created(context, groupApi) {
    groupApi.getList((errorCode, list) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        // common.sortUsers(list);
        const groups = getGroups(list);

        groups.sort((a, b) => b.type - a.type);
        context.groups = groups;
        context.searchResult = groups;
    });
}

function getGroups(list) {
    const groups = [];
    list.forEach((group) => {
        groups.push({
            id: `group_${group.id}`,
            name: group.name,
            avatar: group.avatar,
            firstNine: group.firstNine,
            member_id_list: group.member_id_list,
            group_status: group.group_status,
            isFriend: true,
            type: group.type,
            group,
        });
    });
    return groups;
}
