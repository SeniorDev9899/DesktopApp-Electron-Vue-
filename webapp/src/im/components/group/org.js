/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import _ from 'lodash';
import config from '../../config';
import debounce from '../../utils/debounce';
import intersection from '../../utils/intersection';
import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmpty from '../../utils/isEmpty';
import searchAlias from '../../common/searchAlias';
import getPathName from '../../common/getPathName';
import getPathNameEllipsis from '../../common/getPathNameEllipsis';
import getPathNameSuffix from '../../common/getPathNameSuffix';
import highlight from '../../common/highlight';
import removeDuplicatesById from '../../common/removeDuplicatesById';
import getUsernameHighlight from '../../common/getUsernameHighlight';
import sortByMydeptAndMajorCompany from '../../common/sortByMydeptAndMajorCompany';
import filterMark from '../../common/filterMark';
import OrgType from '../../common/OrgType';
import without from '../../common/without';
import imageLoader from '../image-loader.vue';
import avatar from '../avatar.vue';
import customSelect from '../custom-select.vue';
import userProfile from '../../dialog/contact/user';
import Loading from '../../dialog/loading';

const pageNum = config.profile.pageNum;

/*
说明：  keywordChanged 搜索框值改变时执行搜索命令并将搜索结果赋值 context
步骤：  keyword 值为空重置为初始状态
        keyword 不为空正则匹配判断
            keyword 为手机号按手机搜索成员
            keyword 为邮箱按预想搜索成员
            否则按成员名称搜索
            只要 keyword 有值则搜索 职位（getDutyList）部门（getDeptList）
*/
const keywordChanged = debounce((context, keyword, api) => {
    if (isEmpty(keyword)) {
        getRoot(context, api.org);
        context.dutyList = [];
        context.searchOrg = {
            list: [],
            lastIndex: 0,
        };
        return;
    }
    const numReg = new RegExp(/^[0-9]*$/);
    const emailReg = new RegExp(/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/);
    const promiseList = [];
    let arr = [];
    const errorCallbak = function errorCallbak(errorCode) {
        context.searchResult = {
            members: [],
            depts: [],
            companies: [],
        };
        context.toastError(errorCode);
    };
    promiseList.push(api.org.search(keyword, (errorCode, members) => {
        if (errorCode) {
            errorCallbak(errorCode);
            return;
        }
        [].unshift.apply(arr, members);
        arr = arr.concat(members);
    }));
    if (keyword.length > 3 && numReg.test(keyword)) {
        promiseList.push(api.user.searchByMobile(keyword, (errorCode, members) => {
            if (errorCode) {
                errorCallbak(errorCode);
                return;
            }
            arr = arr.concat(members);
        }));
    }
    if (emailReg.test(keyword)) {
        promiseList.push(api.user.searchByEmail(keyword, (errorCode, members) => {
            if (errorCode) {
                errorCallbak(errorCode);
                return;
            }
            arr = arr.concat(members);
        }));
    }
    $.when.apply(null, promiseList).then(() => {
        arr = uniq(arr);
        searchAlias(arr, keyword, api.user);
        // common.sortUsers(_members);
        
        arr.forEach((item) => {
            item.pathName = getPathName(item, api.org);
            item.pathNameEllipsis = getPathNameEllipsis(item, api.org);
            item.pathNameSuffix = getPathNameSuffix(item, api.org);
            
            //39466 -【创建群组】我的好友已修改备注名，创建群组时企业通讯录搜索出的该好友显示的不是备注名
            if (item.id in context.aliasList) 
                item.alias = context.aliasList[item.id];

            delete item.orgs_info;
            delete item.name_keyword_initial;
            delete item.state;
            delete item.user_type;
            delete item.is_executive;
        });

        if (keyword === context.keyword) {
            context.searchResult = {
                members: arr,
                depts: [],
                companies: [],
            };
            context.allList = arr;
            context.lastIndex = arr.length > pageNum ? pageNum : arr.length;
        }
        context.busy.contacts = false;
    });
    getDutyList(context);
    getDeptList(context);
}, 800);

export default {
    name: 'org',
    mixins: [getLocaleMixins('org')],
    data() {
        return {
            busy: {
                contacts: false,
                duty: false,
                dept: false,
            },
            currentView: 'contacts',
            showDutyDetail: false,
            showDeptDetail: false,
            keyword: '',
            breadcrumb: {},
            searchResult: {
                id: '',
                deptName: '',
                members: [],
                depts: [],
                companies: [],
            },
            dutyList: [],
            searchOrg: {
                list: [],
                lastIndex: 0,
            },
            searchDutyDetail: {
                duty: {},
                list: [],
                lastIndex: 0,
            },
            loadingNextPage: false,
            lastIndex: 0,
            allList: [],
            crumbCacheList: {},
            executiveAndNotfriend: {
                list: [],
                deptCount: {},
                dutyCount: {},
            },
            aliasList:{},
        };
    },
    /* selected 已选择的成员， defaultSelected 默认选中的成员， canNotSelected 不可选不可见的成员（暂时 pin 屏蔽自己用到）， disableExecutive 禁用高管 */
    props: ['selected', 'defaultSelected', 'canNotSelected', 'disableExecutive', 'fixHeight', 'onlyStaff', 'maxCount', 'isPin'],
    directives: {
        autoUserlistHeight(el) {
            Vue.nextTick(() => {
                let allHeight = el.dataset.height;
                const onlyStaff = el.dataset.staff;
                if (onlyStaff) {
                    allHeight = +allHeight + 36;
                }
                let curmbHeight = 0;
                const crumbEl = $(el.dataset.crumbSelector)[0];
                if (crumbEl) {
                    curmbHeight = crumbEl.clientHeight;
                }
                $(el).css({ height: allHeight - curmbHeight });
            });
        },
        autoScrollright(el) {
            Vue.nextTick(() => {
                el.scrollLeft = el.scrollWidth;
            });
        },
    },
    computed: {
        searchHeight() {
            if (this.isPin) {
                return 229;
            }
            if (this.onlyStaff) {
                return 316;
            }
            return 280;
        },
        searching() {
            // 当数据列表为空且仍有至少一个接口在等待返回时，值为 true
            return this.allList.length === 0 && (this.busy.contacts || this.busy.duty || this.busy.dept);
        },
        // 根据职位名称判断是否选中
        checkedDuty: {
            set(newVal) {
                const context = this;
                const oldVal = this.checkedDuty;
                const addedNameList = newVal.filter(item => oldVal.indexOf(item) === -1);
                const removedNameList = oldVal.filter(item => newVal.indexOf(item) === -1);
                const deferList = [];
                addedNameList.forEach((item) => {
                    deferList.push(context.$im().dataModel.User.searchByDuty(item));
                });
                if (deferList.length !== 0) {
                    $.when.apply(null, deferList).done((...args) => {
                        let addedUserList = [];
                        $.each(args, (key, result) => {
                            addedUserList = addedUserList.concat(result.data || []);
                        });
                        recordExecutiveAndNotfriend(addedUserList, context);
                        addOrRemoveMember('added', addedUserList, context);
                    });
                }
                const removedUserList = context.selected.filter((item) => {
                    const dutyName = item.dutyName || item.duty_name;
                    return removedNameList.indexOf(dutyName) !== -1;
                });
                addOrRemoveMember('removed', removedUserList, context);
            },
            get() {
                const context = this;
                const count = {};
                context.selected.forEach((user) => {
                    const dutyName = user.duty_name || user.dutyName;
                    count[dutyName] = count[dutyName] || 0;
                    count[dutyName] += 1;
                });
                const dutyCount = context.executiveAndNotfriend.dutyCount;
                const selectedDuty = context.dutyList.filter(duty => count[duty.name] >= duty.count - (dutyCount[duty.name] || 0));
                return selectedDuty.map(item => item.name);
            },
        },
        /* 无效的部门成员数（需要排除 canNotSelected ），多公司。改为多公司后一个成员可在多个部门。要计算成员所在所有部门 */
        invalidDeptMemberCount() {
            const count = {};
            const context = this;
            (this.canNotSelected || []).forEach((item) => {
                let idList = item._pathIdList;
                if (!idList) {
                    idList = getPathList(item.orgsInfo, context);
                    item._pathIdList = idList;
                }
                idList.forEach((deptId) => {
                    count[deptId] = count[deptId] || 0;
                    count[deptId] += 1;
                });
            });
            return count;
        },
        selectedIdList() {
            return this.selected.map(item => item.id);
        },
        defaultIdList() {
            return (this.defaultSelected || []).map(item => item.id);
        },
        // TODO: 未使用到暂注释
        // defaultDeptIdList: function () {
        //     var deptIdList = [];
        //     (this.defaultSelected || []).forEach(function (dept) {
        //         if(!isEmpty(dept.path)) {
        //             deptIdList = dept.path.split(',').concat(deptIdList);
        //         }
        //     });
        //     return deptIdList;
        // },
        canNotSelectedIdList() {
            return (this.canNotSelected || []).map(item => item.id);
        },
        hasKeyword() {
            return this.keyword.length > 0;
        },
        /* 搜索结果是否有内容，依次判断 searchResult 的属性 members depts companies 的数组长度 */
        hasResult() {
            const searchResult = this.searchResult;
            const memberLen = searchResult.members.length;
            const deptLen = searchResult.depts.length;
            const companyLen = searchResult.companies.length;
            return memberLen > 0 || deptLen > 0 || companyLen > 0;
        },
        /* "全选" 按钮 绑定计算属性 */
        checkedAll: {
            get() {
                return getCheckedAll(this);
            },
            set(checked) {
                const orgApi = this.$im().dataModel.Organization;
                setCheckedAll(this, orgApi, checked);
            },
        },
        /* "职位全选" 按钮 绑定计算属性 */
        checkedAllDuty: {
            get() {
                const context = this;
                const selectedIdList = this.selected.map(item => item.id);
                let selectedAll = true;
                this.searchDutyDetail.list.filter(item => !context.limitCondition(item)).forEach((item) => {
                    if (selectedIdList.indexOf(item.id) === -1) {
                        selectedAll = false;
                    }
                });
                return selectedAll;
            },
            set(checked) {
                const context = this;
                const todoMembers = this.searchDutyDetail.list;
                const eventType = checked ? 'added' : 'removed';
                addOrRemoveMember(eventType, todoMembers, context);
            },
        },
        /* "全选" 按钮 半选状态绑定计算属性 */
        indeterminate() {
            if (this.isCardSelect) {
                return false;
            }
            return getIndeterminate(this);
        },
        indeterminateDuty() {
            const selectedIdList = this.selected.map(item => item.id);
            let indeterminate = false;
            let selectAll = true;
            const context = this;
            this.searchDutyDetail.list.filter(item => !context.limitCondition(item)).forEach((item) => {
                if (selectedIdList.indexOf(item.id) > -1) {
                    indeterminate = true;
                } else {
                    selectAll = false;
                }
            });
            if (selectAll) {
                indeterminate = false;
            }
            return indeterminate;
        },
        /* 成员选中状态计算属性绑定 */
        checkedMembers: {
            get() {
                return this.selected.map(item => item.id);
            },
            set(newMemberIds) {
                // 只有企业通讯录的选择器变化会触发
                const context = this;
                const oldMembers = context.checkedMembers.slice();
                const addedList = [];
                newMemberIds.forEach((id) => {
                    const index = oldMembers.indexOf(id);
                    if (index === -1) {
                        // 标记新加入的 id
                        addedList.push(id);
                    } else {
                        // 移除还存在的 id，剩余的即是被删除的 id
                        oldMembers.splice(index, 1);
                    }
                });
                if (oldMembers.length) {
                    this.onMemberChange('removed', oldMembers);
                }
                if (addedList.length) {
                    this.onMemberChange('added', addedList);
                }
            },
        },
        isCardSelect() {
            return this.$parent.$options.name === 'card';
        },
        pageList() {
            // let list = this.allList.slice(0, this.lastIndex);
            return this.allList.slice(0, this.lastIndex);
        },
        dutyDetailList() {
            return this.searchDutyDetail.list.slice(0, this.searchDutyDetail.lastIndex);
        },
        orgList() {
            return this.searchOrg.list.slice(0, this.searchOrg.lastIndex);
        },
    },
    components: {
        imageLoader,
        avatar,
        customSelect,
    },
    watch: {
        keyword(keyword) {
            this.showDutyDetail = false;
            this.showDeptDetail = false;
            if (keyword === '') {
                this.searchResult = {
                    id: '',
                    deptName: '',
                    members: [],
                    depts: [],
                    companies: [],
                };
            }
            this.resetSearch();
            const dataModel = this.$im().dataModel;
            const api = {
                org: dataModel.Organization,
                user: dataModel.User,
            };
            this.busy = {
                contacts: true,
                duty: true,
                dept: true,
            };
            keywordChanged(this, keyword, api);
        },
        currentView() {
            this.showDutyDetail = false;
            this.showDeptDetail = false;
        },
        selected() {
            calcDeptCheckState(this, this.searchResult.depts);
            calcDeptCheckState(this, this.searchResult.companies);
            calcDeptCheckState(this, this.searchOrg.list);
        },
        'searchResult.companies': function watchCompanies() {
            calcDeptCheckState(this, this.searchResult.companies);
        },
        'searchResult.depts': function watchDepts() {
            calcDeptCheckState(this, this.searchResult.depts);
        },
        'searchOrg.list': function watchOrgList() {
            calcDeptCheckState(this, this.searchOrg.list);
        },
    },
    created() {
        created(this, this.$im().dataModel);
    },
    methods: {
        resetSearch() {
            this.allList = [];
            this.searchOrg = {
                list: [],
                lastIndex: 0,
            };
            this.searchDutyDetail = {
                duty: {},
                list: [],
                lastIndex: 0,
            };
            this.dutyList = [];
        },
        toastError(errorCode) {
            let el = null;
            if (this.$parent) {
                el = this.$parent.$el.firstChild;
            }
            this.RongIM.common.toastError(errorCode, el);
        },
        toast(params) {
            params.el = this.$parent.$el.firstChild;
            this.RongIM.common.messageToast(params);
        },
        computeHeight(height) {
            const fixHeight = Number(this.fixHeight) || 0;
            return height + fixHeight;
        },
        userProfile(userId) {
            userProfile(userId, null, true);
        },
        clear() {
            this.keyword = '';
        },
        /* 页面绑定使用排除 searchResult.members 中 canNotSelected 用户不做显示 */
        unifyMembers(_members) {
            const context = this;
            const members = _members.filter(item => context.canNotSelectedIdList.indexOf(item.id) === -1);
            // common.sortUsers(members);
            return members;
        },
        getUsername(item) {
            const name = getUsernameHighlight(item);
            return filterMark(name);
        },
        highlight(item) {
            if (!item) {
                return '';
            }
            return highlight(item.name, item.range);
        },
        highlightDeptName(dept) {
            if (!dept) {
                return '';
            }
            return highlight(dept.name, dept.range);
        },
        isShowWhenHasAlias(item) {
            return item.alias;
        },
        /* 成员的禁用状态，是否可选择、取消。 1.默认选中成员 2.高管成员3.不可选中成员 */
        isDisabled(item) {
            const canNotSelected = this.canNotSelectedIdList.indexOf(item.id) > -1;
            return this.isDefault(item) || this.executiveLimit(item) || canNotSelected;
        },
        /* 判断是否有高管限制，如果对方是好友，或自己是高管，或高管已禁用（disableExecutive） 则返回 false 否则 返回对方 isExecutive 属性 */
        executiveLimit(item) {
            if (item.isFriend || this.$im().auth.isExecutive || this.disableExecutive) {
                return false;
            }
            const isExecutive = !!item.isExecutive;
            return isExecutive;
        },
        limitCondition(item) {
            const canNotSelected = this.canNotSelectedIdList.indexOf(item.id) > -1;
            if (canNotSelected) {
                return true;
            }
            return this.executiveLimit(item);
        },
        isDefault(item) {
            return this.defaultIdList.indexOf(item.id) >= 0;
        },
        hasMembers(dept) {
            const count = dept.member_count;
            return count > 0;
        },
        changeDept(org) {
            if (org) {
                const orgApi = this.$im().dataModel.Organization;
                changeDept(this, orgApi, org);
            }
        },
        scrollTop() {
            const $list = $(this.$refs.list);
            $list.scrollTop(0);
        },
        memberCount(dept) {
            const count = dept.member_count || dept.count || 0;
            return count;
        },
        getDutyDetail(duty) {
            const context = this;
            context.searchDutyDetail = {
                duty,
                list: [],
                lastIndex: pageNum,
            };
            const userApi = this.$im().dataModel.User;
            userApi.searchByDuty(duty.name, (errorCode, result) => {
                if (errorCode) {
                    context.toastError(errorCode);
                    return;
                }
                context.showDutyDetail = true;
                context.searchDutyDetail = {
                    duty,
                    list: result.data,
                    lastIndex: result.data.length > pageNum ? pageNum : result.data.length,
                };
                recordExecutiveAndNotfriend(result.data, context);
            });
        },
        getDeptDetail(dept) {
            if (!dept) {
                return;
            }
            this.showDeptDetail = true;
            const orgApi = this.$im().dataModel.Organization;
            changeDept(this, orgApi, { id: dept.id, type: OrgType.DEPT });
        },
        getCoDetail(co) {
            if (!co) {
                return;
            }
            this.showDeptDetail = true;
            const orgApi = this.$im().dataModel.Organization;
            changeDept(this, orgApi, { id: co.id, type: OrgType.COMPANY });
        },
        getPathName(item) {
            const orgApi = this.$im().dataModel.Organization;
            return getPathName(item, orgApi);
        },
        getPathNameEllipsis(item) {
            const orgApi = this.$im().dataModel.Organization;
            return getPathNameEllipsis(item, orgApi);
        },
        getPathNameSuffix(item) {
            const orgApi = this.$im().dataModel.Organization;
            return getPathNameSuffix(item, orgApi);
        },
        checkChange(event, item) {
            const checked = event.target.checked;
            Vue.set(item, 'checked', checked);
            if (checked) {
                Vue.set(item, 'indeterminate', false);
            }
            const orgApi = this.$im().dataModel.Organization;
            setCheckedDepts(this, orgApi, item, checked);
        },
        loadMore() {
            loadMore(this);
        },
        loadMoreDutyDetail() {
            loadMore(this, 'dutyDetail');
        },
        loadMoreOrg() {
            loadMore(this, 'org');
        },
        loadMoreDept() {
            loadMore(this, 'dept');
        },
        onMemberChange(type, ids) {
            // 42812 - 【个人名片】通过职位搜索的联系人，不能发送这个人的个人名片
            let mapById = {};
            let members = [];

            if (this.currentView === 'duty') {
                mapById = _.keyBy(this.dutyDetailList, 'id');
            }
            else {
                mapById = _.keyBy(this.pageList, 'id');
            }

            ids.forEach((id) => {
                members.push(mapById[id]);
            });
            this.$emit(type, members);
            // const context = this;
            // const userApi = this.$im().dataModel.User;
            // userApi.get(members, (err, list) => {
            //     if (err) {
            //         context.toastError(err);
            //         return;
            //     }
            //     context.$emit(type, list);
            // });
        },
    },
};
/**
 * 筛选记录高管非好友，用于计算全选状态
 * @param {Array<staff>} members 员工
 * @param {Object} context
 */
function recordExecutiveAndNotfriend(members, context) {
    const self = context.$im().auth || {};
    if (self.isExecutive) {
        return;
    }
    let addList = members.filter(item => item.isExecutive && !item.isFriend);
    const list = context.executiveAndNotfriend.list;
    addList = without(addList, list);
    [].push.apply(list, addList);
    const deptCount = context.executiveAndNotfriend.deptCount;
    const dutyCount = context.executiveAndNotfriend.dutyCount;
    addList.forEach((item) => {
        const dutyName = item.duty_name || item.dutyName;
        if (dutyName) {
            dutyCount[dutyName] = dutyCount[dutyName] || 0;
            dutyCount[dutyName] += 1;
        }
        const orgsInfo = item.orgsInfo || item.orgs_info;
        const idList = getPathList(orgsInfo, context);
        idList.forEach((deptId) => {
            deptCount[deptId] = deptCount[deptId] || 0;
            deptCount[deptId] += 1;
        });
    });
}

/**
 * 添加或删除人员
 * 排除已选中 和 高管非好友
 * @param {Array<staff>} members
 * @param {Object} context
 */
function addOrRemoveMember(type, members, context) {
    const list = members.filter(item => !context.limitCondition(item));
    without(list, context.selected);
    if (list.length > 0) {
        context.$emit(type, list);
    }
}

/*
说明：获取全选状态
步骤：1.获取当前成员如果 checkedMembers 选中的列表中没有返回 false
      2.获取当前部门和公司如果 checkedDepts 选中的列表中没有返回 false
      3.否则返回 true
*/
function getCheckedAll(context) {
    const searchResult = context.searchResult;
    let memberList = searchResult.members;
    memberList = memberList.filter((item) => {
        const canselected = context.canNotSelectedIdList.indexOf(item.id) === -1;
        return canselected && !context.executiveLimit(item);
    });
    for (let i = 0, memberLen = memberList.length; i < memberLen; i += 1) {
        const member = memberList[i];
        if (context.checkedMembers.indexOf(member.id) === -1) {
            return false;
        }
    }
    let deptList = searchResult.depts.concat(searchResult.companies);
    deptList = deptList.filter(item => item.member_count > 0);
    for (let j = 0, deptLen = deptList.length; j < deptLen; j += 1) {
        const dept = deptList[j];
        if (!dept.checked) {
            return false;
        }
    }
    return true;
}

function getCurrentSelectedCount(context) {
    const searchResult = context.searchResult;
    const currentDeptId = searchResult.id;
    let memberCount = 0;
    const isCompany = searchResult.id === '';
    const keyword = context.keyword;
    if (!isEmpty(keyword)) {
        // 场景：搜索关键词
        const selectedIdList = context.selected.map(item => item.id);
        const currentIdList = searchResult.members.map(item => item.id);
        return intersection(selectedIdList, currentIdList).length;
    }
    if (isCompany) {
        memberCount = context.selected.length;
    } else {
        // 场景：浏览某个部门
        memberCount = context.selected.filter((item) => {
            let idList = item._pathIdList;
            if (!idList) {
                const orgsInfo = item.orgsInfo || item.orgs_info;
                idList = getPathList(orgsInfo, context);
                item._pathIdList = idList;
            }
            return idList.indexOf(currentDeptId) >= 0;
            // return (item.path || '').indexOf(currentDeptId) >= 0;
        }).length;
    }
    return memberCount;
}

/*
说明：获取当前所有成员数 部门，公司使用累加属性 memberCount
*/
function getMemberCount(context) {
    let memberCount = 0;
    const executiveDeptCount = context.executiveAndNotfriend.deptCount;
    const searchResult = context.searchResult;
    memberCount += searchResult.members.length;
    memberCount += searchResult.depts.concat(searchResult.companies)
        .map(dept => dept.member_count - (executiveDeptCount[dept.id] || 0))
        .reduce((one, two) => one + two, 0);
    const canNotSelCount = context.canNotSelected ? context.canNotSelected.length : 0;
    return memberCount - canNotSelCount;
}

/*
说明：获取 "全选" 按钮的半选状态
*/
function getIndeterminate(context) {
    const selectedLength = getCurrentSelectedCount(context);
    const memberCount = getMemberCount(context);
    let result;
    if (selectedLength > 0 && !context.checkedAll) {
        result = selectedLength < memberCount;
    } else {
        result = false;
    }
    return result;
}

/*
说明：设置全选获取
步骤：1.获取所有部门 id
      2.获取部门下所有成员
      3.拼接 unifyMembers 当前可选成员
      4.多部门需要排除重复人员
*/
function setCheckedAll(context, orgApi, checked) {
    const searchResult = context.searchResult;
    const validList = searchResult.depts.concat(searchResult.companies).filter(item => item.member_count > 0);
    let deptIdList = validList.map(dept => dept.id);
    let _members = context.unifyMembers(searchResult.members);
    let totalCount = context.unifyMembers(_members).length;
    searchResult.depts.forEach((dept) => {
        totalCount += context.memberCount(dept);
    });
    searchResult.companies.forEach((company) => {
        totalCount += context.memberCount(company);
    });
    if (context.maxCount && totalCount > context.maxCount) {
        context.$emit('maxCountLimit');
        return;
    }
    if (!context.hasKeyword && searchResult.id) {
        deptIdList = [searchResult.id];
        _members = [];
    }
    Loading({
        parent: context.$parent,
    }, (loading) => {
        getMembers(orgApi, deptIdList, (errorCode, members) => {
            loading.close();
            if (errorCode) {
                context.toastError(errorCode);
                return;
            }
            let todoMembers = _members.concat(members);
            todoMembers = removeDuplicatesById(todoMembers);
            recordExecutiveAndNotfriend(todoMembers, context);
            const eventType = checked ? 'added' : 'removed';
            addOrRemoveMember(eventType, todoMembers, context);
        });
    });
}

function getPathList(orgInfoList, context) {
    const orgApi = context.$im().dataModel.Organization;

    orgInfoList = orgInfoList || [];
    let pathList = [];
    orgInfoList.forEach((orgInfo) => {
        // 判断如果是独立子公司则从独立子公司开始计算 path
        const path = [].concat(orgInfo.path || []);
        const org = path[1];
        const isAutocephaly = org && org.type === 2 && orgApi.isAutonomyCompany(org.id);
        if (isAutocephaly) {
            path.shift();
        }
        pathList = pathList.concat(path);
    });

    // 排除重复一个人不能在同一部门计算多次
    const pathIdList = [];
    pathList.forEach((item) => {
        const unexist = pathIdList.indexOf(item.id) === -1;
        if (unexist && item.id !== '') {
            pathIdList.push(item.id);
        }
    });
    return pathIdList;
}

let checkdeptDeferemit = {};
let uid = 0;
const getDeferemitUid = function getDeferemitUid() {
    const temp = uid;
    uid += 1;
    return temp;
};
function mapToArr(map) {
    const arr = [];
    Object.keys(map).forEach((key) => {
        arr.push(map[key]);
    });
    return arr;
}
// 延时通知修改等待所有请求结果返回一次性通知
function deferEmit(context) {
    const notLoading = Object.keys(checkdeptDeferemit).every(key => checkdeptDeferemit[key].result !== null);
    if (notLoading) {
        const addedMap = {};
        const removedMap = {};
        Object.keys(checkdeptDeferemit).forEach((key) => {
            const item = checkdeptDeferemit[key];
            let mergeMap = addedMap;
            let pushMap = removedMap;
            if (item.type === 'added') {
                mergeMap = removedMap;
                pushMap = addedMap;
            }
            const result = item.result;
            result.forEach((member) => {
                const memberId = member.id;
                if (mergeMap[memberId]) {
                    delete mergeMap[memberId];
                } else {
                    pushMap[memberId] = member;
                }
            });
        });
        const addedArr = mapToArr(addedMap);
        const removedArr = mapToArr(removedMap);
        addOrRemoveMember('added', addedArr, context);
        addOrRemoveMember('removed', removedArr, context);
        checkdeptDeferemit = {};
    }
}
function setCheckedDepts(context, orgApi, dept, checked) {
    const deferUid = getDeferemitUid();
    if (checked) {
        const handle = function handle() {
            checkdeptDeferemit[deferUid] = {
                type: 'added',
                result: null,
            };
            Loading({
                parent: context.$parent,
            }, (loading) => {
                getMembers(orgApi, [dept.id], (errorCode, members) => {
                    loading.close();
                    if (errorCode) {
                        context.toastError(errorCode);
                        return;
                    }
                    members = removeDuplicatesById(members);
                    recordExecutiveAndNotfriend(members, context);
                    checkdeptDeferemit[deferUid].result = members;
                    deferEmit(context);
                });
            });
        };
        if (context.maxCount) {
            let count = dept.member_count || dept.count;
            count += context.selected.length;
            if (count > context.maxCount) {
                context.$emit('maxCountLimit');
                return;
            }
            handle();
        } else {
            handle();
        }
        return;
    }
    checkdeptDeferemit[deferUid] = {
        type: 'removed',
        result: null,
    };
    getMembers(orgApi, [dept.id], (errorCode, members) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        recordExecutiveAndNotfriend(members, context);
        checkdeptDeferemit[deferUid].result = members;
        deferEmit(context);
    });
}

function getMembers(orgApi, deptIdList, callback) {
    if (deptIdList.length < 1) {
        callback(null, []);
        return;
    }

    const promiseList = [];
    if (deptIdList.length > 0) {
        deptIdList.forEach((deptId) => {
            const defer = $.Deferred();
            promiseList.push(defer.promise());
            orgApi.getMembers(deptId, (errorCode, members) => {
                if (errorCode) {
                    defer.reject(errorCode);
                    return;
                }
                /*
                选择总公司时排除下面独立子公司
                涉及多部门有一个不在独立子公司下则返回
                */
                if (members.length === 0) {
                    defer.resolve(members);
                    return;
                }

                let list = [];
                const isSelectMainCompany = deptId === members[0].orgsInfo[0].path[0].id;
                if (isSelectMainCompany) {
                    members.forEach((member) => {
                        let directly = false;
                        const orgsInfo = member.orgsInfo || member.orgs_info || [];
                        for (let i = 0; i < orgsInfo.length; i += 1) {
                            const orgInfo = orgsInfo[i];
                            const subcompany = orgInfo.path[1];
                            if (!subcompany || (subcompany && !orgApi.isAutonomyCompany(subcompany.id))) {
                                directly = true;
                            }
                        }
                        if (directly) {
                            list.push(member);
                        }
                    });
                } else {
                    list = members;
                }
                defer.resolve(list);
            });
        });
        $.when.apply(null, promiseList).then((...args) => {
            const members = args.reduce((one, two) => one.concat(two));
            callback(null, members);
        }).fail(callback);
    }
}

function created(context, api) {
    getRoot(context, api);
}

function getRoot(context, api) {
    const orgApi = api.Organization
    /*
    多公司数据结构改变：需要取总公司下独立子公司
    独立子公司只存在第二级
    */
    if (context.crumbCacheList.root) {
        context.searchResult = {
            id: '',
            members: [],
            depts: [],
            companies: [].concat(context.crumbCacheList.root.companies),
        };
        context.allList = context.searchResult.companies;
        context.lastIndex = context.allList.length > pageNum ? pageNum : context.allList.length;
        return;
    }
    orgApi.getAutocephalyCompanyWithMydept((error, companyList) => {
        const allCompany = JSON.parse(JSON.stringify(companyList));
        allCompany.forEach((item) => {
            item.type = OrgType.COMPANY;
        });
        sortByMydeptAndMajorCompany(allCompany, context.$im().auth.companyId);
        context.crumbCacheList.root = {
            id: '',
            members: [],
            depts: [],
            companies: [].concat(allCompany),
        };
        context.searchResult = {
            id: '',
            members: [],
            depts: [],
            companies: allCompany,
        };
        context.allList = allCompany;
        context.lastIndex = context.allList.length > pageNum ? pageNum : context.allList.length;
    });

    context.aliasList = api.User.getAlias();
}

/*
说明：根据 org 获取直属部门下成员，部门，公司 org => {id: '组织机构 id', type: '组织结构 type'}
    设置 searchResult 属性  {
            id: '',
            deptName: '',
            members: [],
            depts: [],
            companies: []
        }
    org 的 id 为空字符时返回跟节点
*/
function changeDept(context, orgApi, org) {
    if (org.id === '') {
        getRoot(context, orgApi);
        return;
    }
    const onDone = function onDone() {
        const obj = context.crumbCacheList[org.id];
        recordExecutiveAndNotfriend(obj.members, context);
        context.searchResult = {
            id: org.id,
            isPart: obj.isPart,
            deptName: obj.deptName,
            memberCount: obj.memberCount,
            members: [].concat(obj.members),
            depts: [].concat(obj.depts),
            companies: [].concat(obj.companies),
        };
        // 获取所有list的总和
        const members = context.unifyMembers(context.searchResult.members);
        /*
        获取部门 path 和公司信息 如果有 独立子部门直接显示独立子部门
        */
        context.allList = members.concat(context.searchResult.depts).concat(context.searchResult.companies);
        context.lastIndex = context.allList.length > pageNum ? pageNum : context.allList.length;
        const orgTree = orgApi.getLocalDept(org.id);
        const pathList = orgTree.pathList || [];
        const autonomy = pathList[1];
        const selfIsAutonomyCompany = orgApi.isAutonomyCompany(org.id);
        const isAutonomyBranch = autonomy && orgApi.isAutonomyCompany(autonomy.id);
        if (isAutonomyBranch || selfIsAutonomyCompany) {
            pathList.shift();
        }
        context.breadcrumb = pathList;
        context.scrollTop();
    };
    const cache = context.crumbCacheList[org.id];
    if (cache && !cache.isPart) {
        onDone();
        return;
    }
    Loading({
        parent: context,
    }, (loading) => {
        orgApi.getBranch(org.id, (errorCode, result) => {
            loading.close();
            if (errorCode && errorCode !== 'part') {
                context.toastError(errorCode);
                return;
            }
            // 排除独立子公司
            const companies = result.companies.filter(co => !orgApi.isAutonomyCompany(co.id));
            const isPart = errorCode === 'part';
            context.crumbCacheList[org.id] = {
                id: org.id,
                isPart,
                deptName: '',
                memberCount: 0,
                members: result.staffs,
                depts: result.depts,
                companies,
            };
            if (org.type === OrgType.COMPANY) {
                orgApi.getCompanyById(org.id, (error, company) => {
                    context.crumbCacheList[org.id].deptName = company.name;
                    context.crumbCacheList[org.id].memberCount = company.member_count;
                    onDone();
                });
            } else if (org.type === OrgType.DEPT) {
                orgApi.getDept(org.id, (error, data) => {
                    context.crumbCacheList[org.id].deptName = data.deptName;
                    context.crumbCacheList[org.id].memberCount = data.member_count;
                    onDone();
                }, true);
            }
        });
    });
}

function getDutyList(context) {
    const orgApi = context.$im().dataModel.Organization;
    const keyword = context.keyword;
    context.busy.duty = true;
    context.dutyList = [];
    orgApi.searchDuty(keyword, (errorCode, result) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.dutyList = result;
        context.busy.duty = false;
    });
}

function getDeptList(context) {
    const orgApi = context.$im().dataModel.Organization;
    const keyword = context.keyword;
    context.busy.dept = true;
    orgApi.searchCompanies(keyword, (errorCode, companies) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        const coList = companies.map((co) => {
            if (co.level === 1) {
                co.count = context.$im().dataModel._Cache.rootCompanyMemberCount;
            }
            return co;
        }).filter(co => co.count > 0);
        orgApi.searchOrgs(keyword, (error, result) => {
            if (error) {
                context.toastError(error);
                return;
            }
            const deptList = result.filter((dept) => {
                dept.type = 1;
                return dept.count > 0;
            });
            const _list = deptList.concat(coList);
            context.searchOrg = {
                list: _list,
                lastIndex: _list.length > pageNum ? pageNum : _list.length,
            };
            context.busy.dept = false;
        });
    });
}
// 计算部门选中状态：全选，半选
function calcDeptCheckState(context, depts) {
    const count = {};
    context.selected.forEach((item) => {
        let idList = item._pathIdList;
        if (!idList) {
            const orgsInfo = item.orgsInfo || item.orgs_info;
            idList = getPathList(orgsInfo, context);
            item._pathIdList = idList;
        }
        idList.forEach((deptId) => {
            count[deptId] = count[deptId] || 0;
            count[deptId] += 1;
        });
    });
    depts.forEach((dept) => {
        const invalidDeptMemberCount = (context.invalidDeptMemberCount[dept.id] || 0);
        const executiveCount = context.executiveAndNotfriend.deptCount[dept.id] || 0;
        dept.member_count = dept.member_count || dept.count;
        const memberCount = dept.member_count - invalidDeptMemberCount - executiveCount;
        const selectedCount = count[dept.id];
        let checked;
        let indeterminate;
        if (selectedCount >= memberCount) {
            checked = true;
            indeterminate = false;
        } else if (selectedCount > 0) {
            checked = false;
            indeterminate = true;
        } else {
            checked = false;
            indeterminate = false;
        }
        Vue.set(dept, 'checked', checked);
        Vue.set(dept, 'indeterminate', indeterminate);
    });
}

function loadMore(context, type) {
    if (context.loadingNextPage === true) {
        return;
    }
    context.loadingNextPage = true;
    let totalNum = context.allList.length;
    let end = context.lastIndex + pageNum;
    let lastIndex = context.lastIndex;
    if (type === 'dutyDetail') {
        totalNum = context.searchDutyDetail.list.length;
        end = (context.searchDutyDetail.lastIndex || 0) + pageNum;
        lastIndex = context.searchDutyDetail.lastIndex;
    } else if (type === 'org') {
        totalNum = context.searchOrg.list.length;
        end = (context.searchOrg.lastIndex || 0) + pageNum;
        lastIndex = context.searchOrg.lastIndex;
    }
    const adjust = function adjust(index) {
        return index > totalNum ? totalNum : index;
    };
    end = adjust(end);
    if (end === lastIndex) {
        context.loadingNextPage = false;
        return;
    }
    setTimeout(() => {
        if (type === 'dutyDetail') {
            context.searchDutyDetail.lastIndex = end;
        } else if (type === 'org') {
            context.searchOrg.lastIndex = end;
        } else {
            context.lastIndex = end;
        }
        context.loadingNextPage = false;
    }, 500);
}

function uniq(array) {
    const map = {};
    return array.filter((item) => {
        const id = item.id;
        if (map[id]) {
            return false;
        }
        map[id] = id;
        return true;
    });
}
