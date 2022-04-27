/* eslint-disable no-param-reassign */
import cache from '../utils/cache';
import isEmpty from '../utils/isEmpty';
import getLength from '../utils/getLength';
import slice from '../utils/slice';
import searchStrRange from '../utils/searchStrRange';
import encodeHtmlStr from '../utils/encodeHtmlStr';
import debounce from '../utils/debounce';
import toJSON from '../utils/toJSON';
import searchAlias from '../common/searchAlias';
import sortUsers from '../common/sortUsers';
import sortByDraft from '../common/sortByDraft';
import highlight from '../common/highlight';
import OrgType from '../common/OrgType';
import getGroupName from '../common/getGroupName';
import getPathName from '../common/getPathName';
import getHighlight from '../common/getHighlight';
import getPathNameEllipsis from '../common/getPathNameEllipsis';
import getPathNameSuffix from '../common/getPathNameSuffix';
import sameConversaton from '../common/sameConversaton';
import getUsernameHighlight from '../common/getUsernameHighlight';
import filterMark from '../common/filterMark';
import userProfile from '../dialog/contact/user';
import addFriend from '../dialog/friend/add-friend';
import config from '../config';
import avatar from './avatar.vue';
import getLocaleMixins from '../utils/getLocaleMixins';
import Loading from '../dialog/loading';
import { getServerConfig } from '../cache/helper';

let selectIndex = 0;
const pageNum = config.search.pageNum;

// 搜索消息时，高亮消息关键字
const messageSearch = {
    TextMessage(message, keyword) {
        const str = message.content.content;
        return getSubstrHighlight(str, keyword);
    },
    FileMessage(message, keyword) {
        const str = message.content.name;
        // 7 - 页面最多可容纳字符长度
        return getSubstrHighlight(str, keyword, 7);
    },
    RichContentMessage(message, keyword) {
        const str = message.content.title;
        return getSubstrHighlight(str, keyword, 7);
    },
    GroupNoticeNotifyMessage(message, keyword) {
        const str = message.content.content;
        return getSubstrHighlight(str, keyword);
    },
};

const keywordChanged = debounce((context, value) => {
    context.currentView = '';
    context.showHistoryDetail = false;
    context.showDutysDetail = false;
    context.showOrgsDetail = false;
    if (isEmpty(value)) {
        context.clear();
        return;
    }
    if (context.isStaff) {
        context.getDutys();
        context.getOrgs();
        context.getPubs();
    }
    context.getContacts();
    context.getHistory();
    context.searchGroup();
}, 1000);

function loadMore(context) {
    const end = context.currentPage * context.pageNum;
    let list;
    if (context.showHistoryDetail) {
        list = context.searchHistoryDetail.list;
    } else if (context.showDutysDetail) {
        list = context.dutysDetail.list;
    } else if (context.showOrgsDetail) {
        list = context.orgsDetail.list;
    } else {
        list = context[context.currentView];
    }
    if (list && list.length > end) {
        context.loadBusy = true;
        setTimeout(() => {
            context.loadBusy = false;
            context.currentPage += 1;
        }, 200);
    }
}

function initSearch(context) {
    selectIndex = 0;
    context.curItem = null;
    context.busy.contacts = true;
    if (context.auth && context.auth.isStaff) {
        context.busy.dutys = true;
        context.busy.orgs = true;
    }
    context.busy.groups = true;
    context.busy.history = true;
    context.busy.pubs = true;
    context.currentPage = 1;
}

function gotoMessage(context, message, im) {
    const conversationApi = im.dataModel.Conversation;
    const conversationType = message.conversationType;
    const targetId = message.targetId;
    const router = context.$router;
    context.currentView = '';
    checkConUnread(conversationType, targetId, conversationApi, im);
    router.push({
        name: 'conversation',
        params: {
            conversationType: message.conversationType,
            targetId: message.targetId,
            focus: true,
        },
        query: {
            timestamp: (new Date()).getTime(),
            messageUId: message.messageUId,
        },
    });
}

function getSubstrHighlight(str, keyword, maxLength) {
    maxLength = maxLength || 10;
    str = str.replace(/\r\n/g, '');
    str = str.replace(/\n/g, '');
    const keyLength = getLength(keyword);
    const startStr = str.substring(0, str.indexOf(keyword));
    const startLength = getLength(startStr);
    let result = '';
    if (startLength + keyLength > maxLength) {
        const i = (maxLength - keyLength) / 2;
        const move = i > 0 ? i : 0;
        const start = slice(str, startLength - move).length;
        result = `...${str.substring(start)}`;
    } else {
        result = str;
    }
    result = encodeHtmlStr(result);
    result = result.replace(keyword, `<em>${keyword}</em>`);
    return result;
}

const numReg = new RegExp(/^[0-9]*$/);
const emailReg = new RegExp(/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/);
function getContacts(context, orgApi, userApi, friendApi) {
    const common = context.RongIM.common;
    const busy = context.busy;
    const keyword = context.keyword;
    busy.contacts = true;
    context.totalStaff = 0;
    // User.getFriendList 获取的数据已缓存在本地无需请求网络 保证在无网状态下可以搜索好友
    userApi.getFriendList((error, friendList) => {
        const promiseList = [];
        let staffList = [];
        if (context.isStaff) {
            // 按名称搜索
            // promiseList.push(orgApi.search(keyword, (errorCode, result) => {
            //     if (errorCode) {
            //         common.toastError(errorCode);
            //         return;
            //     }
            //     [].unshift.apply(staffList, result);
            // }));
            promiseList.push($.ajax({
                url: `${context.RongIM.config.dataModel.server}/staffs/search`,
                method: 'post',
                data: JSON.stringify({
                    keywords: [keyword],
                    type: 0,
                }),
                dataType: 'json',
                contentType: 'application/json;charset=UTF-8',
                success: (response) => {
                    // 兼容 1.6.9 server，1.6.9 server 无 extra 字段
                    context.totalStaff = response.extra ? response.extra.total_count : response.result.length;
                    [].unshift.apply(staffList, response.result);
                },
            }));
            // 按邮箱搜索
            if (emailReg.test(keyword)) {
                promiseList.push(userApi.searchByEmail(keyword, (errorCode, result) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    staffList = staffList.concat(result);
                }));
            }
            // 按手机号搜索
            if (keyword.length > 3 && numReg.test(keyword)) {
                promiseList.push(userApi.searchByMobile(keyword, (errorCode, result) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    staffList = staffList.concat(result);
                }));
            }
        }
        const searchFriendList = [];
        friendList.forEach((item) => {
            const nameRange = searchStrRange(item.name, keyword);
            if (nameRange) {
                searchFriendList.push($.extend({ range: nameRange }, item));
                return;
            }
            const aliasRange = searchStrRange(item.alias, keyword);
            if (aliasRange) {
                searchFriendList.push($.extend({ range: aliasRange }, item));
            }
        });
        sortUsers(searchFriendList);
        const success = () => {
            // 39234 - 【草稿排序】有草稿时会话窗口显示在顶部
            const conversationApi = context.RongIM.dataModel.Conversation;
            let contacts = searchFriendList.concat(staffList);
            contacts = uniq(contacts);
            searchAlias(contacts, keyword, userApi);
            // context.contacts = friendList.concat(staffList);
            // 优化：删除无用属性减少 Vue 的属性变更监听
            contacts.forEach((item) => {
                item.pathName = getPathName(item, orgApi);
                item.pathNameEllipsis = getPathNameEllipsis(item, orgApi);
                item.pathNameSuffix = getPathNameSuffix(item, orgApi);
                item.isExecutive = item.is_executive;
                item.avatar = item.portrait_url;
                item.draft = conversationApi.getDraft(1, item.id);
                delete item.orgs_info;
                delete item.name_keyword_initial;
                delete item.state;
                delete item.user_type;
                delete item.is_executive;
            });
            contacts = sortByDraft(contacts);
            context.contacts = contacts;
            searchFileHelper(context, friendApi);
            busy.contacts = false;
        };
        // server 网络接口失败时当做成功处理 仅返回搜索好友结果
        $.when.apply(null, promiseList).then(success, success);
    });
}

function getPubs(context, pubApi) {
    const busy = context.busy;
    busy.pubs = true;
    const common = context.RongIM.common;
    pubApi.search(context.keyword, (errorCode, list) => {
        busy.pubs = false;
        if (errorCode) {
            //common.toastError(errorCode);
            return;
        }
        context.pubs = list;
    });
}

function searchFileHelper(context, friendApi) {
    const locale = context.locale;
    const keyword = context.keyword;
    const fileHelper = {};
    const range = searchStrRange(locale.components.getFileHelper.title, keyword);
    fileHelper.range = range;
    if (range) {
        const common = context.RongIM.common;
        friendApi.getFileHelper((errorCode, helper) => {
            if (errorCode) {
                common.toastError(errorCode);
                return;
            }
            helper.name = locale.components.getFileHelper.title;
            $.extend(fileHelper, helper);
            context.contacts.push(fileHelper);
        });
    }
}

function getDutys(context, orgApi) {
    const busy = context.busy;
    const common = context.RongIM.common;
    busy.dutys = true;
    orgApi.searchDuty(context.keyword, (errorCode, list) => {
        busy.dutys = false;
        if (errorCode) {
            /**
             * 35733 - 【搜索】搜索链接时，报了错误码，已显示搜索结果
             * 不应报错误码 10527
             */
            if (errorCode === 10527) {
                return;
            }
            common.toastError(errorCode);
            return;
        }
        context.dutys = list;
    });
}

function getOrgs(context, orgApi) {
    const busy = context.busy;
    const RongIM = context.RongIM;
    const common = RongIM.common;
    busy.orgs = true;
    orgApi.searchCompanies(context.keyword, (errorCode, companies) => {
        if (errorCode) {
            common.toastError(errorCode);
            return;
        }
        context.coList = companies.map((co) => {
            if (co.level === 1) {
                // eslint-disable-next-line no-underscore-dangle
                co.count = RongIM.dataModel._Cache.rootCompanyMemberCount;
            }
            return co;
        });
        orgApi.searchOrgs(context.keyword, (error, result) => {
            busy.orgs = false;
            if (error) {
                common.toastError(error);
                return;
            }
            context.orgs = [...companies, ...result].sort((a, b) => {
                // web 端不存在 name_pinyin_full 字段
                const aName = a.name_pinyin_full || a.name;
                const bName = b.name_pinyin_full || b.name;
                return aName.localeCompare(bName);
            });
            context.orgs.forEach((item) => {
                imgLoaded(item.logo_url, () => {
                    item.logo_url = '';
                });
            });
        });
    });
}

function imgLoaded(src, onerror) {
    if (!src) {
        return;
    }
    const img = new Image();
    // img.onload = () => {};
    img.onerror = () => {
        if (typeof onerror === 'function') {
            onerror();
        }
    };
    img.src = src;
}
function searchGroup(context, groupApi) {
    // 39234 - 【草稿排序】有草稿时会话窗口显示在顶部
    const conversationApi = context.RongIM.dataModel.Conversation;
    const busy = context.busy;
    busy.groups = true;
    let tmpGroups = [];
    groupApi.search(context.keyword, (errorCode, groups) => {
        busy.groups = false;
        if (errorCode) {
            return;
        }
        context.groups = [];
        groups.forEach((group) => {
            const rangeName = searchStrRange(context.getGroupName(group), context.keyword);
            const isSearched = group.user_list.length > 0;
            if (rangeName || isSearched) {
                group = $.extend({ range: rangeName }, group);
                group.draft = conversationApi.getDraft(3, group.id);
                tmpGroups.push(group);
            }
        });
        // 38996 - 【搜索】搜索群组排序使用 server 返回排序，三端一致
        // 只使用服务器的返回值. 还有检查移动的代码关于这个问题
        // sortGroups(tmpGroups);
        tmpGroups = sortByDraft(tmpGroups);
        context.groups = tmpGroups;
    });
}
function getGroups(context, groupApi, conversationApi) {
    const groupDefer = $.Deferred();
    const common = context.RongIM.common;
    const busy = context.busy;
    busy.groups = true;
    groupApi.getList((errorCode, groups) => {
        if (errorCode) {
            groupDefer.reject(errorCode);
            return;
        }
        groupDefer.resolve(groups);
    });

    $.when(groupDefer.promise())
        .then((favGroups) => {
            let conversationList = conversationApi.getLocalList();
            conversationList = conversationList.filter(item => item.conversationType === RongIMLib.ConversationType.GROUP);
            const list = [].concat(favGroups);
            const groupIds = list.map(item => item.id);
            conversationList.forEach((conversation) => {
                const existed = groupIds.indexOf(conversation.targetId) >= 0;
                if (!existed) {
                    const group = toJSON(conversation.group);
                    group.id = conversation.targetId;
                    list.push(group);
                }
            });
            context.groups = [];
            list.forEach((group) => {
                const rangeName = searchStrRange(context.getGroupName(group), context.keyword);
                const matchMembers = common.getMatchedMembers(context.keyword, group).length > 0;
                if (rangeName || matchMembers) {
                    group = $.extend({ range: rangeName }, group);
                    context.groups.push(group);
                }
            });
        }).fail((errorCode) => {
            common.toastError(errorCode);
        }).always(() => {
            busy.groups = false;
        });
}

// 获取搜索历史
function getRecord(context) {
    const recordList = cache.get('record') ? (cache.get('record')[context.auth.id] || []) : [];
    context.recordList = recordList;
}

// 设置搜索历史
function setRecord(context) {
    const keyword = context.keyword.replace(/\s+/g, '');
    if (!keyword) {
        return;
    }
    let recordList = context.recordList;
    recordList = recordList.filter(item => item !== keyword);
    recordList.unshift(keyword);
    recordList = recordList.slice(0, 5);
    context.recordList = recordList;

    const recordObject = cache.get('record') || {};
    recordObject[context.auth.id] = recordList;
    cache.set('record', recordObject);
}

function getVisibleResultLength(context) {
    let length = {
        contacts: Math.min(context.contacts.length, 3),
        dutys: Math.min(context.dutys.length, 3),
        orgs: Math.min(context.orgs.length, 3),
        groups: Math.min(context.groups.length, 3),
        pubs: Math.min(context.pubs.length, 3),
        history: Math.min(context.history.length, 3),
    };

    if (length[context.currentView]) {
        length = {
            contacts: 0,
            dutys: 0,
            orgs: 0,
            groups: 0,
            pubs: 0,
            history: 0,
        };
        length[context.currentView] = context[context.currentView].length;
    }

    length.all = length.contacts + length.dutys + length.orgs + length.groups + length.pubs + length.history;
    return length;
}

// 获取当前选中的是搜索结果中的哪一个
function getItem(context, index) {
    const lenObj = getVisibleResultLength(context);
    let item = {};
    let thisIndex = index;
    if (index < lenObj.contacts) {
        item = { type: 1, item: context.contacts[thisIndex] };
    } else if (index < lenObj.contacts + lenObj.dutys) {
        thisIndex -= lenObj.contacts;
        item = { type: 2, item: context.dutys[thisIndex] };
    } else if (index < lenObj.contacts + lenObj.dutys + lenObj.orgs) {
        thisIndex = thisIndex - lenObj.contacts - lenObj.dutys;
        item = { type: 3, item: context.orgs[thisIndex] };
    } else if (index < lenObj.contacts + lenObj.dutys + lenObj.orgs + lenObj.groups) {
        thisIndex = thisIndex - lenObj.contacts - lenObj.dutys - lenObj.orgs;
        item = { type: 4, item: context.groups[thisIndex] };
    } else if (index < lenObj.contacts + lenObj.dutys + lenObj.orgs + lenObj.groups + lenObj.pubs) {
        thisIndex = thisIndex - lenObj.contacts - lenObj.dutys - lenObj.orgs - lenObj.groups;
        item = { type: 5, item: context.pubs[thisIndex] };
    } else {
        thisIndex = thisIndex - lenObj.contacts - lenObj.dutys - lenObj.orgs - lenObj.groups - lenObj.pubs;
        item = { type: 6, item: context.history[thisIndex] };
    }
    return item;
}

function checkConUnread(conversationType, targetId, conversationApi, im) {
    const common = im.RongIM.common;
    conversationApi.getOne(conversationType, targetId, (errorCode, conversation) => {
        if (errorCode) {
            common.toastError(errorCode);
            return;
        }
        if (conversation.unreadMessageCount > 0) {
            conversationApi.clearUnReadCount(conversationType, targetId);
            im.$emit('conversationchange', conversation);
        }
    });
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

const elementName = 'search';

export default {
    name: elementName,
    mixins: [getLocaleMixins(elementName)],
    data() {
        const im = this.$im();
        const serverConfig = getServerConfig();
        // 好友
        const enabledFriend = serverConfig.friend.enable;
        // pin
        const enabledPIN = serverConfig.pin.enable;
        return {
            auth: im.auth,
            enabledFriend,
            enabledPIN,
            isShowMenu: false,
            currentView: '', /* 'contacts' or 'groups' or `history` or 'pubs' */
            keyword: '',
            contacts: [],
            dutys: [],
            dutysDetail: {},
            orgs: [],
            orgsDetail: {
                isPart: false,
            },
            groups: [],
            history: [],
            pubs: [],
            showSearchRecord: false,
            inputIsFocus: false,
            recordList: [],
            searchHistoryDetail: {
                list: [],
                count: 0,
            },
            totalStaff: 0,
            showHistoryDetail: false,
            showDutysDetail: false,
            showOrgsDetail: false,
            curItem: null,
            busy: {
                contacts: false,
                groups: false,
                dutys: false,
                orgs: false,
                history: false,
                pubs: false,
            },
            isStaff: im.auth.isStaff,
            loadBusy: false,
            currentPage: 1,
            pageNum,
        };
    },
    computed: {
        isEmpty() {
            const matchCount = this.contacts.length + this.groups.length
                + this.history.length + this.dutys.length + this.orgs.length + this.pubs.length;
            const noMatch = matchCount === 0;
            const hasInputValue = this.keyword.length > 0;
            return hasInputValue && noMatch;
        },
        showContacts() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.contacts.length > 0 && !showDeatil;
            }
            return this.currentView === 'contacts';
        },
        showPubs() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.pubs.length > 0 && !showDeatil;
            }
            return this.currentView === 'pubs';
        },
        showDutys() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.dutys.length > 0 && !showDeatil;
            }
            return this.currentView === 'dutys' && this.showDutysDetail === false;
        },
        showOrgs() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.orgs.length > 0 && !showDeatil;
            }
            return this.currentView === 'orgs' && this.showOrgsDetail === false;
        },
        showGroups() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.groups.length > 0 && !showDeatil;
            }
            return this.currentView === 'groups';
        },
        showHistory() {
            if (isEmpty(this.currentView)) {
                const showDeatil = this.showHistoryDetail || this.showDutysDetail || this.showOrgsDetail;
                return this.history.length > 0 && !showDeatil;
            }
            return this.currentView === 'history' && this.showHistoryDetail === false;
        },
        isBusy() {
            const busy = this.busy;
            const isLoading = busy.contacts || busy.dutys || busy.orgs || busy.groups || busy.history || busy.pubs;
            return isLoading;
        },
        contactsList() {
            if (this.currentView === 'contacts') {
                const end = this.currentPage * this.pageNum;
                return this.contacts.slice(0, end);
            }
            return this.contacts.slice(0, 3);
        },
        dutysList() {
            if (this.currentView === 'dutys') {
                const end = this.currentPage * this.pageNum;
                return this.dutys.slice(0, end);
            }
            return this.dutys.slice(0, 3);
        },
        orgsList() {
            if (this.currentView === 'orgs') {
                const end = this.currentPage * this.pageNum;
                return this.orgs.slice(0, end);
            }
            return this.orgs.slice(0, 3);
        },
        groupsList() {
            if (this.currentView === 'groups') {
                const end = this.currentPage * this.pageNum;
                return this.groups.slice(0, end);
            }
            return this.groups.slice(0, 3);
        },
        pubsList() {
            if (this.currentView === 'pubs') {
                return this.pubs;
            }
            return this.pubs.slice(0, 3);
        },
        historyList() {
            if (this.currentView === 'history') {
                const end = this.currentPage * this.pageNum;
                return this.history.slice(0, end);
            }
            return this.history.slice(0, 3);
        },
        dutyDetailList() {
            const end = this.currentPage * this.pageNum;
            return this.dutysDetail.list.slice(0, end);
        },
        orgDetailList() {
            const end = this.currentPage * this.pageNum;
            return this.orgsDetail.list.slice(0, end);
        },
        historyDetailList() {
            const end = this.currentPage * this.pageNum;
            // 42432 - 【搜索】搜索出的相关聊天记录信息和实际相关聊天记录信息不一致
            let searchHistory = [];
            this.searchHistoryDetail.list.forEach((item) => {
                if (item.messageType === "TextMessage" ||  item.messageType === "FileMessage" || item.messageType === "LocalFileMessage") {
                    searchHistory.push(item);
                }
            });
            return searchHistory;
        },
    },
    components: {
        avatar,
    },
    directives: {
        scrollTop(el) {
            Vue.nextTick(() => {
                $(el).scrollTop(0);
            });
        },
    },
    created() {
        const context = this;
        const im = this.$im();
        im.$on('searchBlur', () => {
            context.showSearchRecord = false;
            context.searchBoxBlur();
        });
        if (isEmpty(this.keyword)) {
            return;
        }
        if (this.isStaff) {
            this.getDutys();
            this.getOrgs();
            this.getPubs();
        }
        this.getContacts();
        this.searchGroup();
        this.getHistory();
    },
    watch: {
        $route() {
            this.clear();
        },
        keyword(newValue, oldVal) {
            // 删除空格
            newValue = newValue.replace(/\s+/g, '');
            oldVal = oldVal.replace(/\s+/g, '');
            // 如果新的keyword和旧keyword相同，则不搜索
            if (newValue && newValue === oldVal) {
                return;
            }
            initSearch(this);
            if (newValue) {
                this.showSearchRecord = false;
            } else if (this.inputIsFocus) {
                this.showSearchRecord = true;
            }
            keywordChanged(this, newValue);
        },
        currentView() {
            initSearch(this);
        },
    },
    methods: {
        isCompany(org) {
            return +org.type === OrgType.COMPANY;
        },
        isStaffs(org) {
            return +org.type === OrgType.STAFF;
        },
        isDept(org) {
            return +org.type === OrgType.DEPT;
        },
        searchBoxBlur() {
            if (this.$refs.searchBox) this.$refs.searchBox.blur();
        },
        getGroupType(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
        memberCount(duty) {
            const count = duty.count || duty.member_count || 0;
            return count;
        },
        showGroupType(group) {
            return group && group.type > 0;
        },
        showMenu() {
            this.isShowMenu = true;
            this.$im().$on('imclick', this.hideMenu);
        },
        hideMenu() {
            this.isShowMenu = false;
            this.$im().$off('imclick', this.hideMenu);
        },
        focus() {
            if (this.$refs.searchBox) {
                this.$refs.searchBox.focus();
            }
        },
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        getGroupName(group) {
            return getGroupName(group);
        },
        createGroup() {
            const im = this.$im();
            const userId = im.auth.id;
            im.dataModel.User.getBatch([userId], (errorCode, list) => {
                // TODO: 拆解替换 window.RongIM
                window.RongIM.dialog.createGroup(null, list);
            });
        },
        addFriend() {
            addFriend();
        },
        addPin() {
            // TODO: 拆解替换 window.RongIM
            window.RongIM.dialog.addPin();
        },
        clear() {
            this.keyword = '';
            this.contacts = [];
            this.dutys = [];
            this.orgs = [];
            this.groups = [];
            this.history = [];
            this.pubs = [];
        },
        getContacts() {
            const dataModel = this.RongIM.dataModel;
            const { Organization: orgApi, Friend: friendApi, User: userApi } = dataModel;
            getContacts(this, orgApi, userApi, friendApi);
        },
        getDutys() {
            const dataModel = this.RongIM.dataModel;
            const { Organization: orgApi } = dataModel;
            getDutys(this, orgApi);
        },
        getOrgs() {
            const dataModel = this.RongIM.dataModel;
            const { Organization: orgApi } = dataModel;
            getOrgs(this, orgApi);
        },
        getGroups() {
            const dataModel = this.RongIM.dataModel;
            getGroups(this, dataModel.Group, dataModel.Conversation);
        },
        searchGroup() {
            const dataModel = this.RongIM.dataModel;
            searchGroup(this, dataModel.Group);
        },
        getPubs() {
            const dataModel = this.RongIM.dataModel;
            const { Public: pubApi } = dataModel;
            getPubs(this, pubApi);
        },
        getHighlightUsername(user) {
            const name = getUsernameHighlight(user);
            return filterMark(name);
        },
        getHighlight(duty) {
            return getHighlight(duty);
        },
        getHighlightGroupName(group) {
            const name = highlight(getGroupName(group), group.range);
            return filterMark(name);
        },
        getMatchedMembers(group) {
            const common = this.RongIM.common;
            /*  搜索群组信息，群组内有包含此关键词的用户，当可以匹配到名字时显示匹配结果，匹配不到时，显示服务端返回的 user_list
                    前端匹配名字拿的群组前九个人
                    时间：2019-3-30
                    修改人：刘雨奇
                */
            const matchMembers = common.getMatchedMembers(this.keyword, group).length > 0;
            if (matchMembers) {
                return common.getMatchedMembers(this.keyword, group);
            }
            const members = [];
            const memberNames = group.user_list;
            memberNames.forEach((item) => {
                members.push(highlight(item.name, item.range));
            });

            if (members.length > 0) {
                return members.join('，');
            }
            return '';
        },
        highlight(name) {
            return highlight(name, this.keyword);
        },
        nextAction(conversationType, targetId, target) {
            if (targetId === this.$im().auth.id) {
                userProfile(targetId);
                return;
            }
            this.showConversation(conversationType, targetId, target);
        },
        showConversation(conversationType, targetId, target) {
            const im = this.$im();
            const dataModel = im.dataModel;
            const userApi = dataModel.User;
            const common = this.RongIM.common;
            const conversationApi = dataModel.Conversation;
            const isPrivate = conversationType === RongIMLib.ConversationType.PRIVATE;
            if (isPrivate && userApi.executiveLimit(target)) {
                userProfile(target.id);
                return;
            }
            const params = {
                conversationType,
                targetId,
            };
            this.currentView = '';

            checkConUnread(conversationType, targetId, conversationApi, im);
            this.$router.push({
                name: 'conversation',
                params,
            });
            im.$emit('messageinputfocus');
            conversationApi.add(params);
            this.setRecord();
            this.clear();

            const scrollToView = function scrollToView(item) {
                if (item) {
                    const parentHeight = item.parentNode.offsetHeight;
                    const offsetTop = item.offsetTop;
                    const alginWithTop = offsetTop > parentHeight;
                    // item.scrollIntoView(alginWithTop);
                    // 解决bug：搜索联系人返回会话抖动问题，国产化样式变形，蓝条消失
                    if (alginWithTop) {
                        item.parentNode.scrollTop = offsetTop;
                    }
                }
            };

            const conversationItems = ['conversation', conversationType, targetId];
            const itemId = conversationItems.join('-');
            let conItem = document.getElementById(itemId);
            const onTimeout = function onTimeout() {
                conItem = document.getElementById(itemId);
                scrollToView(conItem);
            };

            scrollToView(conItem);

            if (!conItem) {
                conversationApi.getNativeList((errorCode, list) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    for (let i = 0, len = list.length; i < len; i += 1) {
                        const hasConversation = +list[i].conversationType === +conversationType && list[i].targetId === targetId;
                        if (hasConversation) {
                            // 滚动到会话位置
                            im.$emit('loadSearch', i);
                            setTimeout(onTimeout, 0);
                            break;
                        }
                    }
                });
            }
        },
        getHistory() {
            const context = this;
            const dataModel = this.RongIM.dataModel;
            if (context.keyword !== '') {
                const busy = context.busy;
                busy.history = true;
                dataModel.Conversation.search(context.keyword, (errorCode, list) => {
                    busy.history = false;
                    list.sort((one, another) => another.sentTime - one.sentTime);
                    context.history = list;
                });
            }
        },
        setRecord() {
            setRecord(this);
        },
        searchRecord(record) {
            this.keyword = record;
            this.showSearchRecord = false;
        },
        viewDutysDetail(duty) {
            if (!duty) {
                return;
            }
            const context = this;
            const common = this.RongIM.common;
            const userApi = this.RongIM.dataModel.User;
            initSearch(context);
            context.showDutysDetail = true;
            context.dutysDetail = {
                name: duty.name,
                list: [],
                count: duty.count,
            };
            userApi.searchByDuty(duty.name, (errorCode, result) => {
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                context.dutysDetail.list = result.data;
            });
        },
        viewOrgsDetail(org) {
            if (!org) {
                return;
            }
            const context = this;
            const dataModel = this.RongIM.dataModel;
            const orgApi = dataModel.Organization;
            const common = this.RongIM.common;
            initSearch(context);
            context.showOrgsDetail = true;
            context.orgsDetail = {
                isPart: false,
                name: org.name || org.deptName,
                list: [],
                count: org.count || org.member_count,
            };
            Loading({
                elParent: context.$refs.list,
            }, (loading) => {
                orgApi.getBranch(org.id, null, (errorCode, dept) => {
                    loading.close();
                    const isPart = errorCode === 'part';
                    if (errorCode && !isPart) {
                        common.toastError(errorCode);
                        return;
                    }
                    context.orgsDetail.isPart = isPart;
                    context.orgsDetail.list = [].concat(dept.staffs, dept.depts, dept.companies);
                });
            });
        },
        showDeatil(item) {
            if (!item) {
                return;
            }
            const context = this;
            if (item.matchCount === 1) {
                gotoMessage(context, item.latestMessage, this.$im());
                return;
            }
            initSearch(context);
            context.searchHistoryDetail = {
                user: item.user,
                group: item.group,
                list: [],
                count: item.matchCount,
            };
            const params = {
                conversationType: item.conversationType,
                targetId: item.targetId,
                timestamp: 0,
                keyword: context.keyword,
                count: 0,
            };
            const dataModel = context.RongIM.dataModel;
            const common = context.RongIM.common;
            dataModel.Message.search(params, (errorCode, searchList) => {
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                dataModel.Message.addSendUserInfo(searchList, (error, list) => {
                    context.searchHistoryDetail.list = list;
                    context.showHistoryDetail = true;
                });
            });
        },
        getUserPath(user) {
            let str = '';
            const path = user.org_path.concat([]);
            if (path.length === 1) {
                str = path[0].name;
            } else if (path.length === 2) {
                str = `${path[0].name}>${path[1].name}`;
            } else if (path.length > 2) {
                str = `${path[0].name}>...>${path[path.length - 1].name}`;
            }
            return str;
        },
        gotoMessage(message) {
            gotoMessage(this, message, this.$im());
        },
        matchHighlight(message) {
            const locale = this.locale;
            const prefix = locale.message.prefix[message.messageType] || '';
            const template = messageSearch[message.messageType];
            return prefix + (template ? template(message, this.keyword) : message.content);
        },
        enter() {
            // 对应类型搜索enter键的事件
            const selectItem = this.curItem || getItem(this, selectIndex);
            switch (selectItem.type) {
            case 1:
            case 5:
                this.nextAction(1, selectItem.item.id, selectItem.item);
                break;
            case 4:
                this.showConversation(3, selectItem.item.id);
                break;
            case 6:
                this.showDeatil(selectItem.item);
                break;
            default:
                break;
            }
            this.showSearchRecord = false;
        },
        inputFocus() {
            getRecord(this);
            this.showSearchRecord = true;
            this.inputIsFocus = true;
            const context = this;
            function hide($event) {
                if (
                    $($event.target).is('.rong-search-item')
                    || $($event.target).is('.rong-field-search')
                    || $($event.target).is('.rong-record-icon')
                    || $($event.target).is('.rong-record-name')
                ) {
                    return;
                }
                context.showSearchRecord = false;
                $(document).off('mousedown', hide);
            }
            $('body').on('mousedown', hide);
        },
        inputBlur() {
            this.inputIsFocus = false;
            this.setRecord();
        },
        isEqual(item, type) {
            type = +type;
            const selectItem = this.curItem || getItem(this, selectIndex);
            if (!selectItem) {
                return false;
            }
            const selected = selectItem.item;
            if (selectItem.type !== type) {
                return false;
            }
            let equal = false;
            switch (selectItem.type) {
            case 2:
                equal = selected.name === item.name;
                break;
            case 1:
            case 3:
            case 4:
            case 5:
                equal = selected.id === item.id;
                break;
            case 6:
                equal = sameConversaton(item, selected);
                break;
            default:
                break;
            }
            return equal;
        },
        checkPath(item) {
            if (item.pathName || item.path || item.org_path || (item.orgs_info && item.orgs_info.length > 0)) {
                return true;
            }
            return false;
        },
        getPathName(item) {
            return getPathName(item, this.RongIM.dataModel.Organization);
        },
        getPathNameEllipsis(item) {
            return getPathNameEllipsis(item, this.RongIM.dataModel.Organization);
        },
        getPathNameSuffix(item) {
            return getPathNameSuffix(item, this.RongIM.dataModel.Organization);
        },
        loadMore() {
            loadMore(this);
        },
    },
};
