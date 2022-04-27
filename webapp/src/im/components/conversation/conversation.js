/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import CallType from '../../common/CallType';
import UserType from '../../common/UserType';
import UserState from '../../common/UserState';
import buildMessage from '../../common/buildMessage';
import isSysUser from '../../common/isSysUser';
import createNotificationMessage from '../../common/createNotificationMessage';
import OrgType from '../../common/OrgType';
import browserWindow from '../../browserWindow';
import config from '../../config';
import screenshot from '../../screenshot';
import syncdata from '../../syncdata';
import isEmpty from '../../utils/isEmpty';
import getLocaleMixins from '../../utils/getLocaleMixins';
import statusView from '../status.vue';
import avatar from '../avatar.vue';
import MessageList from './message-list.vue';
import MessageInput from './message-input.vue';
import ConversationSetting from './conversation-setting.vue';
import History from './history.vue';
import GroupSetting from './group-setting.vue';
import GroupNotice from './group-notice.vue';
import PublicMenu from './public-menu.vue';
import PublicInfo from './public-detail.vue';
import showUserProfile from '../../dialog/contact/user';
import htmlLang from '../../utils/htmlLang';

const support = config.support;
/*
说明： 会话界面，包含消息列表，输入框，历史消息，会话设置，群设置等组件
    两种状态，1. 搜索消息跳转进入会话 query 参数携带 messageUId 2. 正常会话
*/
export default {
    name: 'conversation',
    mixins: [getLocaleMixins('conversation')],
    data() {
        return {
            busy: false,
            /*
      panel可选值：
      conversation-setting: 单聊设置
      group-setting: 群聊设置
      history: 历史消息
      */
            panel: null,
            conversation: {
                conversationType: this.conversationType,
                targetId: this.targetId,
            },
            newMessage: null,
            // 单聊显示用户在线状态
            userStatus: 'offline',
            // 输入框是否自动获取焦点
            autoFocus: true,
            // 群会话 - 自己是否在当前群组中
            inGroup: true,
            disableExecutive: false,
            // 群会话 - 是否被禁言
            isBanned: false,
            // 群会话 - 是否有效群组
            isInvalidGroup: true,
            // 群会话 - 群成员
            members: [],
            // 公众号 - 菜单
            menuEnabled: false,
            // 公众号 - 輸入框
            inputEnabled: true,
            // 公众号菜单信息
            menuInfo: {},
            // 引用消息
            quote: null,
            // 多选
            isMultiSelected: false,
            selectedMessages: [],
        };
    },
    computed: {
        isFileHelper() {
            const conversation = this.conversation || {};
            const user = conversation.user || {};
            return user.type === UserType.ROBOT;
        },
        isOtherApp() {
            const conversation = this.conversation || {};
            if (conversation.conversationType === RongIMLib.ConversationType.PRIVATE) {
                const user = conversation.user || {};
                return user.type === UserType.OTHERAPP;
            }
            return false;
        },
        // 判断是否为公众号
        isPublicMsg() {
            const conversation = this.conversation || {};
            return conversation.conversationType === 7;
        },
        status() {
            return this.$im().status;
        },
        isConversationView() {
            return !isEmpty(this.conversationType) && !isEmpty(this.targetId);
        },
        conversationType() {
            return +this.$route.params.conversationType;
        },
        targetId() {
            return this.$route.params.targetId;
        },
        isGroup() {
            return this.conversationType === RongIMLib.ConversationType.GROUP;
        },
        validGroup() {
            return checkGroupValid(this.conversation, this.$im().auth.id);
        },
        validUser() {
            if (!this.isPrivate) {
                if (this.isGroup && !this.validGroup) {
                    return false;
                }
                return true;
            }
            const user = this.conversation.user;
            if (!user) {
                return false;
            }
            // return true;
            // update: 同步需求 可以发送消息给被删除用户
            // update: 产品确认需求 见 bug 23899 备注
            return user.state !== UserState.DELETED;
        },
        // 系统用户（特殊用户，如审批助手）
        sysUser() {
            const user = this.conversation.user;
            if (!user) {
                return false;
            }
            return isSysUser(user);
        },
        isPrivate() {
            return this.conversationType === RongIMLib.ConversationType.PRIVATE;
        },
        disabled() {
            return !this.inGroup;
        },
        // 输入框拖拽，绑定会话显示大小
        style() {
            const node = this.$im().resizeNode.messageInput;
            const height = node.height;
            let style = null;
            if (height && !this.menuEnabled) {
                style = {
                    'padding-bottom': `${height}px`,
                };
            }
            return style;
        },
        inputHeight() {
            const node = this.$im().resizeNode.messageInput;
            return node.height || 120;
        },
        voipTip() {
            const voipTip = {};
            voipTip[CallType.MEDIA_VEDIO] = this.locale.voip.videoTip;
            voipTip[CallType.MEDIA_AUDIO] = this.locale.voip.audioTip;
            return voipTip;
        },
        disabledMessageInput() {
            const disabled = (!this.validGroup && !this.validUser) || this.isBanned;
            return disabled;
        },
    },
    components: {
        statusView,
        avatar,
        'message-list': MessageList,
        'message-input': MessageInput,
        history: History,
        'conversation-setting': ConversationSetting,
        'group-setting': GroupSetting,
        'group-notice': GroupNotice,
        'public-menu': PublicMenu,
        'public-detail': PublicInfo,
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const dataModel = im.dataModel;
        const api = {
            status: dataModel.Status,
            conversation: dataModel.Conversation,
            group: dataModel.Group,
            user: dataModel.User,
            message: dataModel.Message,
        };
        mounted(context, api, im);
        // 监听用户信息改变，如果是群组会话及时同步群成员信息
        context.userChanged = function onUserChanged(user) {
            const memberList = context.members || [];
            const member = memberList.find(item => item.id === user.id);
            if (member) {
                Object.assign(member, user);
            }
        };
        dataModel.User.watch(context.userChanged);
        // 监听用户状态改变
        userStatusChanged(dataModel.User, context.$route.params);
    },
    created() {
        const context = this;
        const im = this.$im();
        im.$on('conversationchange', (conversation) => {
            context.conversation = conversation;
        });

        // 支持截屏则添加截屏回调
        if (support.screenshot) {
            // 判断当前 APP 是否隐藏,如果隐藏,则不执行下述操作
            const isExcuteCallback = function isExcuteCallback() {
                // 快捷键触发
                const isVisible = browserWindow.isVisible();
                const isFocused = browserWindow.isFocused();
                const winShow = isVisible && isFocused;
                return winShow;
            };

            const callback = function callback(data) {
                // if (!isExcuteCallback()) {
                //     return;
                // }
                if (context.$refs.editor && data !== 'exit') {
                    context.$refs.editor.focus();
                    Vue.nextTick(() => {
                        document.execCommand('Paste');
                    });
                }
            };
            if (!screenshot.onComplet) {
                screenshot.onComplete = callback;
            }

            if (!screenshot.onCancel) {
                screenshot.onCancel = function onCancel() {
                    isExcuteCallback();
                };
            }
        }

        im.$on('messageinputfocus', () => {
            if (context.$refs.editor) {
                context.$refs.editor.focus();
            }
        });
    },
    destroyed() {
        const im = this.$im();
        const dataModel = im.dataModel;
        im.$off('messageinputfocus');
        im.$off('conversationchange');
        cleanup(dataModel.Group, this.groupChange);
        dataModel.User.unwatch(this.userChanged);
        if (support.screenshot) {
            screenshot.setComplete = null;
            screenshot.setCancel = null;
        }
    },
    watch: {
        $route(newValue, oldValue) {
            // 路由 query messageUId 不为空则为搜索消息跳转，输入框不自动获取焦点
            const context = this;
            const userApi = this.$im().dataModel.User;
            if (newValue.query.messageUId && !newValue.params.focus) {
                context.autoFocus = false;
            } else {
                context.autoFocus = true;
            }
            context.conversationChanged();
            if (context.isGroup) {
                context.inGroup = true;
            } else {
                context.isBanned = false;
            }
            userStatusChanged(userApi, newValue.params, oldValue.params);
        },
        inputEnabled(newValue) {
            if (newValue === false) {
                this.removeQuote();
            }
        },
    },
    // const dataModel = im.dataModel;
    // const common = im.RongIM.common;
    // const orgApi = dataModel.Organization;
    methods: {
        getGroupCompany(org) {
            if (isEmpty(org)) {
                return '';
            }
            const orgApi = this.$im().dataModel.Organization;
            let name = '';
            if (org.type === OrgType.DEPT) {
                for (let i = org.pathList.length - 1; i >= 0; i -= 1) {
                    const item = org.pathList[i];
                    if (item.type === OrgType.COMPANY) {
                        name = orgApi.getLocalCompany(item.id).fullName;
                        break;
                    }
                }
            } else if (org.type === OrgType.COMPANY) {
                name = org.fullName || org.name;
            }
            return name;
        },
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        getHtmlUsername(...args) {
            return this.RongIM.common.getHtmlUsername(...args);
        },
        getGroupName(...args) {
            return this.RongIM.common.getGroupName(...args);
        },
        getHtmlGroupName(group) {
            if (group) {
                return this.RongIM.common.getHtmlGroupName(group, 18);
            }
            return this.targetId;
        },
        getGroupType(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
        userProfile(user) {
            const isRobot = user.type === UserType.ROBOT;
            if (isRobot) {
                return;
            }
            const userId = user.id;
            showUserProfile(userId);
        },
        // 用户在线状态文字提示
        getStatusText() {
            const localeStatus = this.locale.components.onlineStatus;
            return localeStatus[this.userStatus];
        },
        reset() {
            this.conversation = {
                conversationType: this.conversationType,
                targetId: this.targetId,
            };
            this.messageList = [];
            this.panel = null;
        },
        conversationChanged() {
            if (isEmpty(this.conversationType) || isEmpty(this.targetId)) {
                return;
            }
            const im = this.$im();
            const dataModel = im.dataModel;
            const params = {
                conversationApi: dataModel.Conversation,
                groupApi: dataModel.Group,
                userApi: dataModel.User,
                publicApi: dataModel.Public,
                authId: im.auth.id,
                emit(method) {
                    im.$emit(method);
                },
            };
            conversationChanged(this, params);
        },
        setProperty(key, value) {
            // key可能是个路径，例如'group.save'
            let keys = key.split('.');
            const lastKey = keys.slice(-1)[0];
            keys = keys.slice(0, -1);
            let obj = this.conversation;
            keys.forEach((item) => {
                obj = obj[item];
            });
            this.$set(obj, lastKey, value);
        },
        clearUnReadCount() {
            this.$im().dataModel.Conversation.clearUnReadCount(this.conversationType, this.targetId);
        },
        // appendToMessageList: function (list) {
        //     this.messageList.unshift.apply(this.messageList, list);
        // },
        sendTextMessage(message) {
            const context = this;
            const dataModel = this.$im().dataModel;
            const params = {
                clearUnReadCount: this.clearUnReadCount,
                setInGroup(inGroup) {
                    context.inGroup = inGroup;
                },
                conversationType: this.conversationType,
                targetId: this.targetId,
                messageApi: dataModel.Message,
                conversationApi: dataModel.Conversation,
                quote: context.quote,
                message,
            };
            sendTextMessage(params, context);
            context.quote = null;
        },
        hidePanel(event) {
            if (event && event.target === this.$el) {
                return;
            }
            this.panel = null;
        },
        append(message) {
            this.newMessage = message;
        },
        // 发送复制的消息 复制消息直接发送原消息体
        sendCopyMessage(message) {
            const context = this;
            const dataModel = this.$im().dataModel;
            const conversationType = context.conversationType;
            const targetId = context.conversation.targetId;
            dataModel.Message.send({
                conversationType,
                targetId,
                content: message,
            });
        },
        // 发送消息前如果是由搜索消息跳转来，则先重置会话为正常会话
        prepareinput() {
            const context = this;
            const query = context.$route.query;
            if (query.messageUId) {
                context.$router.push({
                    name: 'conversation',
                    params: {
                        conversationType: context.conversationType,
                        targetId: context.targetId,
                    },
                });
            }
        },
        setInGroup(boolean) {
            this.inGroup = boolean;
        },
        sendVoip(isVideo) {
            const params = {
                conversation: this.conversation,
                type: isVideo ? CallType.MEDIA_VEDIO : CallType.MEDIA_AUDIO,
            };
            const im = this.$im();
            const userApi = im.dataModel.User;
            const friendApi = im.dataModel.Friend;
            const isPrivate = Number(this.conversation.conversationType) === 1;
            if (isPrivate) {
                const canNotChat = !userApi.validateCanChat(this.conversation.targetId);
                if (canNotChat) {
                    friendApi.insertRFVMsg(this.conversation.targetId);
                    return;
                }
            }
            const common = this.RongIM.common;
            const voipTip = this.voipTip;
            RCCall.start(params, (errorCode, data) => {
                if (errorCode) {
                    common.messageToast({
                        type: 'error',
                        message: voipTip[data.type],
                    });
                }
            });
        },
        memberCount(item) {
            let format = this.locale.contact.person;
            if (item.member_count === 1) {
                format = this.locale.contact.personSingle;
            }
            return this.localeFormat(format, item.member_count || 0);
        },
        inputMenuChanged(value) {
            // 公众号 键盘状态切换 输入框或菜单的显示/隐藏
            this.menuEnabled = value;
            this.inputEnabled = (!value);
            if (!value) {
                const messageList = this.$refs.list;
                messageList.scrollWhenInputResize();
            }
        },
        addQuote(message) {
            if (!this.inputEnabled && !this.menuEnabled) {
                return;
            }
            this.inputEnabled = true;
            this.menuEnabled = false;
            const objName = RongIMClient.getMessageObjectName(message.messageType);
            this.quote = {
                content: message.content,
                objName,
                userId: message.senderUserId,
                user: message.user,
                messageUId: message.messageUId,
            };
            this.$refs.editor.focus();
        },
        removeQuote() {
            this.quote = null;
        },
        getTextContent(content) {
            const common = this.RongIM.common;
            content = htmlLang.check(content);
            content = common.textMessageFormat(content);
            return content;
        },
        getGroupUsername(user) {
            const common = this.RongIM.common;
            const groupId = this.conversation.targetId;
            return common.getGroupUsername(user, groupId);
        },

        /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
        dropItem() {
            this.$im().$emit('clear-all-selection');
        },
        setMultiSelect(multiSelect) {
            this.isMultiSelected = multiSelect;
        },
        setselectedMessages(content) {
            this.selectedMessages = content;
        },
    },
};

/*
说明： 会话组件初始化时判断连接状态，连接成功获取会话信息，否则等待连接成功再获取
*/
function mounted(context, api, im) {
    if (context.status === RongIMLib.ConnectionStatus.CONNECTED) {
        context.conversationChanged();
    } else {
        const unwatch = context.$watch('status', (newValue) => {
            if (newValue === RongIMLib.ConnectionStatus.CONNECTED) {
                context.conversationChanged();
                unwatch();
            }
        });
    }

    api.conversation.watch(async () => {
        const params = context.$route.params;
        if (params.conversationType && params.targetId) {
            context.conversation.unreadMessageCount = await api.conversation.getUnreadCount(params);
        }
    });

    api.message.watch((message) => {
        if (message.content && message.messageType === 'RecallCommandMessage') {
            if (context.quote && context.quote.messageUId === message.content.messageUId) {
                // 引用消息已被撤回
                context.removeQuote();
            }
            /**
       * 38851 - 【文件】文件发送撤回了，仍然继续下载
       */
            if (im.RongIM.dataModel.File.downloadManage.get(message.content.messageUId)) {
                im.RongIM.dataModel.File.downloadManage.get(message.content.messageUId).abort();
            }
        }
    });

    // 监听群信息改变更新群信息
    context.groupChange = function groupChange(group) {
    /**
     * 路由设计不合理导致退出群时返回默认界面（/conversation?force=1）组件未销毁监听未取消
     * context.conversation 为之前缓存的值 context.targetId 为空后续代码执行报错
     */
        const currentGroup = context.conversation.group;
        if (currentGroup && group.id === context.targetId) {
            context.conversation.group = group;
            // 44248 - 【群头像】群组内添加群成员后，修改为默认头像不变更
            context.$im().$emit('groupAvatarChange', context.conversation.group);
            const params = {
                group: context.conversation.group,
                setIsBand(isBanned) {
                    context.isBanned = isBanned;
                },
                authId: im.auth.id,
            };

            checkGroupBanned(params);
            context.isInvalidGroup = !checkGroupValid(context.conversation, im.auth.id);
            getAllMembers(context, api.group, true);
        }
    };
    api.group.watch(context.groupChange);

    // 监听用户信息改变
    api.user.watch((user) => {
        const currentUser = context.conversation.user;
        if (currentUser && currentUser.id === user.id) {
            $.extend(context.conversation.user, user);
            context.userStatus = getUserOnlineStatus(context.conversation.user);
            // 37846 - 【备注名】会话窗口里点用户资料页添加备注名，会话列表显示备注名，会话窗口未显示
            context.$forceUpdate();
        }
    });

    // 监听网络状态改变
    api.status.watch((status) => {
        const connected = status === RongIMLib.ConnectionStatus.CONNECTED;
        if (connected) {
            // 38219 - 【在线状态】偶现-当前已登录，可以发消息，对方窗口显示状态为离线
            // 会话逻辑中， 是订阅1800秒， 对方用户状态
            // 所以重连成功后， 在此处增加代码， 订阅1800秒对方用户状态
            // 1800是抄自于会话逻辑
            const userId = api.conversation.active.targetId;
            if (!isEmpty(userId)) {
                const duration = 1800;
                api.user.subscribe(userId, duration);
            }
        }
    });

    const query = context.$route.query;
    if (!isEmpty(query.keyword)) {
        context.panel = 'history';
    }
}

// 获取群组全部成员
function getAllMembers(context, groupApi, isRefresh) {
    const groupId = context.targetId;
    const RongIM = context.RongIM;
    const common = RongIM.common;
    groupApi.getAllMembers(groupId, (errorCode, members) => {
        if (errorCode) {
            // 成员信息获取失败无法进行后续操作
            return;
        }
        const currentGroup = context.conversation.group;
        if (!currentGroup || currentGroup.id !== groupId) {
            return;
        }
        const cacheAlias = RongIM.dataModel._Cache.alias;
        const tmpMembers = members.map((item) => {
            const member = {
                id: item.id,
                // 备注名显示规则：我对其增加的备注名称 > 其自己添加的组内备注名称 > 名字
                alias: cacheAlias[item.id] || item.groupAlias,
                avatar: item.avatar,
                mute_status: item.mute_status,
                name: item.name,
                portrait_big_url: item.portrait_big_url,
                state: item.state,
                type: item.type,
            };
            const tmpName = member.alias || member.name;
            member.htmlAlias = common.getHtmlGroupUsername2(tmpName, 16);
            return member;
        });
        context.members = tmpMembers;
    }, isRefresh);
}

function sameConversaton(one, another) {
    const sameConversationType = one.conversationType === another.conversationType;
    const sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}

function cleanup(groupApi, groupChange) {
    /* 为什么要清空所有group监听? */
    // groupApi.unwatch();
    groupApi.unwatch(groupChange);
}

/*
说明： 获取用户状态字符串
    如果是移动端在线则展示 "手机在线"
    否则展示 "在线" "忙碌" "离线"
*/
function getUserOnlineStatus(user) {
    let time = 0;
    let status = 'offline';
    if (isEmpty(user.onlineStatus)) {
        return status;
    }
    Object.keys(user.onlineStatus).forEach((title) => {
        const item = user.onlineStatus[title];
        /* if (time < item.updateDt && item.value !== 'offline') {
            time = item.updateDt;
            const isMobile = (item.title === 'Login_Status_Mobile');
            status = isMobile ? 'mobile' : item.value;
        } */
        if (item.value !== 'offline') {
            time = item.updateDt;
            const isMobile = (item.title === 'Login_Status_Mobile');
            status = isMobile ? 'mobile' : item.value;
        }
    });
    return status;
}

/*
说明： 会话切换时注册和取消注册用户状态监听
*/
function userStatusChanged(userApi, newValue, oldValue) {
    const newUserId = getUserId(newValue);
    const oldUserId = getUserId(oldValue);
    watchUserStatus(newUserId, userApi);
    unwatchUserStatus(oldUserId, userApi);
}

function getUserId(params) {
    params = params || {};
    let userId = '';
    if (+params.conversationType === RongIMLib.ConversationType.PRIVATE) {
        userId = params.targetId;
    }
    return userId;
}

/*
说明：设置用户状态监听
*/
let userStatusInterval = null;
function watchUserStatus(userId, userApi) {
    clearInterval(userStatusInterval);
    if (isEmpty(userId)) {
        return;
    }
    const duration = 1800;
    userApi.subscribe(userId, duration);
    userStatusInterval = setInterval(() => {
        userApi.subscribe(userId, duration);
    }, duration * 1000);
}
/*
说明： 取消用户状态监听
*/
function unwatchUserStatus(userId, userApi) {
    if (isEmpty(userId)) {
        return;
    }
    userApi.unsubscribe(userId);
}

let delayUpdateGroupInfo = null;
let delayUpdateOfficalAccountInfo = null;
/*
说明： 会话聊天对象改变，初始化会话信息，获取会话历史消息
*/
function conversationChanged(context, params) {
    const im = context.$im();
    const common = context.RongIM.common;
    const conversationApi = params.conversationApi;
    const publicApi = params.publicApi;
    const groupApi = params.groupApi;
    const userApi = params.userApi;
    context.quote = null;
    const conversationType = context.conversationType;
    const targetId = context.targetId;
    if (context.$refs.list) {
        context.$refs.list.reset();
    }
    // 设置群成员为空
    context.members = [];

    // 如果 conversation 是应用公众号信息，则获取公众号菜单详情
    const isPublic = conversationType === RongIMLib.ConversationType.APP_PUBLIC_SERVICE;
    const cache = im.dataModel._Cache || {};
    const publicCache = cache.public;
    if (isPublic) {
        const publicLocale = publicCache[targetId];
        if (publicLocale) {
            showMenu(publicLocale, context);
            publicApi.getPublicMenu(targetId, (result) => {
                showMenu(result, context);
            });
        } else {
            publicApi.getPublicMenu(targetId, (result) => {
                showMenu(result, context);
            });
        }
    } else {
        context.menuEnabled = false;
        context.inputEnabled = true;
    }
    const currentConversation = {
        conversationType: context.conversationType,
        targetId: context.targetId,
    };

    conversationApi.setActive(currentConversation);
    // 获取会话信息
    conversationApi.getOne(conversationType, targetId, (errorCode, conversation) => {
        const isGroup = conversationType === RongIMLib.ConversationType.GROUP;
        if (errorCode && !isGroup) {
            common.toastError(errorCode);
            return;
        }
        context.reset();
        conversation = conversation || {
            conversationType,
            targetId,
        };
        if (!sameConversaton(conversation, currentConversation)) {
            return;
        }
        context.conversation = conversation;

        if (context.isPrivate) {
            context.userStatus = getUserOnlineStatus(context.conversation.user);
        }

        // 群会话 - 获取群成员信息
        context.isInvalidGroup = false;

        clearTimeout(delayUpdateGroupInfo);
        clearTimeout(delayUpdateOfficalAccountInfo);
        if (isGroup) {
            // 1.判断自己是否被禁言 2.群组是否有效群组（解散或被踢出）
            const checkGroupInfo = function checkGroupInfo() {
                const chkGroupParams = {
                    group: context.conversation.group,
                    setIsBand(isBanned) {
                        context.isBanned = isBanned;
                    },
                    authId: params.authId,
                };
                checkGroupBanned(chkGroupParams);
                context.isInvalidGroup = !checkGroupValid(context.conversation, params.authId);
            };
            checkGroupInfo();
            // 获取并设置群信息
            const getGroupInfo = function getGroupInfo() {
                syncdata.groupById(context.targetId, () => {
                    groupApi.getNewGroup(context.targetId, (error, group) => {
                        if (error || isEmpty(group) || context.targetId !== group.id) {
                            return;
                        }
                        context.conversation.group = group;
                        checkGroupInfo();
                        getAllMembers(context, groupApi, true);
                    });
                });
            };
            // 如果群组信息未获取到则立即重新获取
            if (!context.conversation.group || !context.conversation.group.member_id_list || context.conversation.group.member_id_list.length === 0) {
                getGroupInfo();
            } else {
                // 每次进入会话更新群组信息。增加延时获取防止频繁切换重复获取
                delayUpdateGroupInfo = setTimeout(() => {
                    getGroupInfo();
                }, config.syncDelayTime);
            }
            // 获取群成员信息
            getAllMembers(context, groupApi);
        } else {
            // 获取并设置用户信息
            const getUserInfo = function getUserInfo() {
                syncdata.userBatchById([context.targetId], () => {
                    userApi.getNewUser(context.targetId, (error, user) => {
                        if (error || isEmpty(user) || context.targetId !== user.id) {
                            return;
                        }
                        context.conversation.user = user;
                    });
                });
            };
            if ($.isEmptyObject(context.conversation.user)) {
                getUserInfo();
            } else {
                // 更新公众号（staff 表中数据）、外部联系人信息，无同步机制需每次进入会话同步
                const isOfficialAccount = conversationType === RongIMLib.ConversationType.APP_PUBLIC_SERVICE;
                const notStaff = context.conversation.user.type !== 0;
                if (isOfficialAccount || notStaff) {
                    delayUpdateOfficalAccountInfo = setTimeout(() => {
                        getUserInfo();
                    }, config.syncDelayTime);
                }
            }
        }
    });
}

function showMenu(publicMenu, context) {
    const isPublic = context.conversationType === RongIMLib.ConversationType.APP_PUBLIC_SERVICE;
    if (!isPublic) {
    // 弱网情况下，快递切换会话列表，菜单显示错误问题
        return;
    }
    const cache = context.$im().dataModel._Cache || {};
    const publicCache = cache.public;

    const menuContent = publicMenu.menu_content || [];
    // 如果菜单设置为 true ，并且有菜单内容，则显示公众号菜单
    const menuEnabled = publicMenu.menu_enabled && menuContent.length > 0;
    const inputEnabled = publicMenu.input_enabled;
    if (menuEnabled && inputEnabled) {
    // 菜单和输入框同时都开启时，优先显示菜单
        context.menuEnabled = true;
        context.inputEnabled = false;
    } else {
        context.menuEnabled = menuEnabled;
        context.inputEnabled = inputEnabled;
    }
    context.menuInfo = publicMenu;
    publicCache[publicMenu.app_id] = publicMenu;
}

function checkGroupValid(conversation, authId) {
    const group = conversation.group || {};
    const members = group.member_id_list || [];
    const inGroup = members.indexOf(authId) >= 0;
    const isDismiss = (group.group_status === 2);
    return inGroup && !isDismiss;
}

/*
说明： 判断自己在群组中的禁言状态
*/
function checkGroupBanned(params) {
    const group = params.group;
    if (group) {
        let isBanned = false;
        if (!group.is_creator) {
            const members = group.groupMembers || [];
            const selfInfo = members.filter(member => member.id === params.authId)[0] || {};
            if (group.is_all_mute && selfInfo.mute_status !== 2) {
                isBanned = true;
            }
            if (selfInfo.mute_status === 1) {
                isBanned = true;
            }
            if (selfInfo.role === 1) {
                isBanned = false;
            }
        }
        params.setIsBand(isBanned);
    }
}

/*
说明: 发送文本消息
*/
function sendTextMessage(params, context) {
    const message = params.message;
    if (!message.text) {
        return;
    }
    const common = context.RongIM.common;
    const conversationType = params.conversationType;
    const targetId = params.targetId;
    message.text = RongIMLib.RongIMEmoji.symbolToEmoji(message.text);
    let msg = new RongIMLib.TextMessage({ content: message.text, extra: '' });
    if (params.quote) {
        const content = $.extend({}, params.quote, {
            text: message.text,
        });
        msg = buildMessage.ReferenceMessage(content);
    }
    //  获取 '@' 人员信息
    let mentiondMsg = false;
    if (message.at && message.at.length > 0) {
        const mentioneds = new RongIMLib.MentionedInfo();
        const userIdList = message.at.map(item => item.id);
        // '@所有人' 的 userId 为 0
        const isAtAll = userIdList.indexOf(0) !== -1;
        if (isAtAll) {
            mentioneds.type = RongIMLib.MentionedType.ALL;
            const atUserIds = userIdList.filter(item => item !== 0);
            msg.content.extra = JSON.stringify({ userIdList: atUserIds });
        } else {
            mentioneds.type = RongIMLib.MentionedType.PART;
            mentioneds.userIdList = userIdList;
        }
        // 40651 @人发送消息不成功
        if (msg && msg.content) {
            msg.content.mentionedInfo = mentioneds;
        }
        mentiondMsg = true;
    }

    params.messageApi.send({
        conversationType,
        targetId,
        content: msg,
        mentiondMsg,
    }, (errorCode) => {
        if (errorCode) {
            const ignoreErrorCodeMap = [
                'lib--1',
                'lib-30001',
                'lib-30003',
                // 'lib-21502'
            ];
            const existed = ignoreErrorCodeMap.indexOf(errorCode) >= 0;
            if (existed) {
                return;
            }
            const errMsg = common.getErrorMessage(errorCode);
            if (errorCode !== `lib-${RongIMLib.ErrorCode.NOT_IN_GROUP}`) {
                common.toastError(errorCode);
                return;
            }
            const messageParams = createNotificationMessage(conversationType, targetId, errMsg);
            params.messageApi.insertMessage(messageParams);
            params.setInGroup(false);
        }
    });
    params.conversationApi.clearDraft(conversationType, targetId);
    params.clearUnReadCount();
}
