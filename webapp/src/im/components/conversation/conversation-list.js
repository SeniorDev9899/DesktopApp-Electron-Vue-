/* eslint-disable no-param-reassign */
import config from '../../config';
import getResizeDirection from '../../common/getResizeDirection';
import sameConversatonMethod from '../../common/sameConversaton';
import debounce from '../../utils/debounce';
import getLocaleMixins from '../../utils/getLocaleMixins';
import dateFormat from '../../utils/dateFormat';
import isEmojiOverlap from '../../utils/isEmojiOverlap';
import browserWindow from '../../browserWindow';
import client from '../../client';
import system from '../../system';
import getLatestMessage from './latest-message.vue';
import avatar from '../avatar.vue';
import getSearch from '../search.vue';
import getContextMenuMixins from '../mixins/context-menu';
import getGroupName from '../../common/getGroupName';
import {
    getServerConfig,
} from '../../cache/helper';
import ConversationItem from './ConversationItem.vue';

// 会话列表每页加载个数
const pageNum = config.conversationList.pageNum;


export default {
    name: 'conversation-list',
    mixins: [getLocaleMixins('conversation-list'), getContextMenu()],
    data() {
        const im = this.$im();
        const params = im.$route.params;
        return {
            busy: false, //42372 - 【会话列表】拉取会话列表中的会话，一直显示为正在加载
            auth: im.auth,
            conversation: {
                conversationType: params.conversationType,
                targetId: params.targetId,
            },
            list: [],
            hasMore: true,
            listBusy: {},
            bound: {
                width: {
                    min: 0,
                    max: 0,
                },
            },
            isResizing: false,
            // 当前会话列表最后一条的索引值
            lastIndex: 0,
            loadingNextPage: false,
            isFirst: true,
            itemId: null,
            count: 0,
            childCount: 0,
        };
    },
    mounted() {
        const conversationList = this;
        const im = this.$im();
        const conversationAPI = im.dataModel.Conversation;
        const common = this.RongIM.common;
        // 收到消息时更新会话列表,延时500ms,页面平滑过渡 （最后一条消息，未读数）
        const messagechanged = debounce(() => {
            pageRefresh(conversationList);
        }, 500);
        im.$on('messagechange', messagechanged);
        // 会话列表改变时更新到页面。
        conversationList.watch = function watch(list, optimizeOptions) {
            // 对会话列表的更新优化
            if (typeof optimizeOptions === 'object' && optimizeOptions !== null) {
                optimizeConversation(conversationList, optimizeOptions);
                return;
            }
            // 默认逻辑
            pageRefresh(conversationList, list);
        };
        // 监听会话列表改变
        conversationAPI.watch(conversationList.watch);
        // 初始化会话列表获取第一页
        conversationList.getInit();
        // 会话列表可拖拽（增加拖拽事件）
        common.resizeNavNode(conversationList, im);
        // 搜索会话跳转时，加载并滚动到指定会话
        im.$on('loadSearch', (index) => {
            index += 1;
            if (index > conversationList.lastIndex) {
                conversationList.lastIndex = index;
                pageRefresh(conversationList);
            }
        });
        // 发送消息时滚动到最 "顶部"
        im.$on('sendMessage', () => {
            scrollToTop($(conversationList.$refs.list));
        });

        // 文件上传时监听同步文件的状态
        im.$on('uploadStatusChange', (message, status) => {
            // 找到消息,改变状态
            const list = conversationList.list;
            for (let i = 0; i < list.length; i += 1) {
                const item = list[i];
                if (item.conversationType === message.conversationType
                    && item.targetId === message.targetId
                ) {
                    const latestMessage = item.latestMessage;
                    if (latestMessage.messageId !== message.messageId) {
                        break;
                    }
                    // TODO: 代码需优化，暂时没找到更好的方法同步会话列表发送状态
                    latestMessage.content.status = status;
                    if (status === 1) {
                        latestMessage.sentStatus = RongIMLib.SentStatus.SENDING;
                    }
                    break;
                }
            }
        });

        /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
        im.$on('start-dragItem', () => {
            const element = conversationList.$el.querySelector('.rong-selected');
            // 42526 - 【拖拽转发】拖拽转发确认窗口点击确认没有响应，控制台报错
            if (element.hasOwnProperty('classList')) {
                element.classList.add('rong-conversation-border');
            }
        });

        im.$on('clear-all-selection', () => {
            conversationList.deleteSelectionItem();
        });

        im.$on('activate-forward-channel', (data) => {
            if (conversationList.$el.querySelector(`#${data.receiver}`)) conversationList.$el.querySelector(`#${data.receiver}`).click();
        });

        // 44421 - 【工作台】进入工作台，页面无数据
        im.$on('currentSession', () => {
            im.$emit('currentSessionReply', conversationList.conversation);
        });

        // 44248 - 【群头像】群组内添加群成员后，修改为默认头像不变更
        im.$on('groupAvatarChange', (group) => {
            let updatedMessageList = conversationList.messageList;
            updatedMessageList.forEach((item) => {
                if (!!item.group) {
                    if (item.group.id === group.id) {
                        item.group = group;
                    }
                }
            });
            conversationList.messageList = updatedMessageList;
        });

        // [story 498]
        window.RongDesktop.ipcRenderer.on('open-conversation-tray', (event, data) => {
            const conversationId = data.viewId;
            conversationList.$el.querySelector(`#${conversationId}`).click();
        });
    },
    created() {
        const conversationList = this;
        const im = this.$im();
        const conversationAPI = im.dataModel.Conversation;
        // 注册 "Ctrl + F" 搜索快捷键事件
        client.regSearch(() => {
            const searchBox = conversationList.$refs.searchBox;
            if (searchBox) {
                searchBox.focus();
            }
        });

        // 设置公众号信息监听
        browserWindow.enterPublic(im.$router, (router, app) => {
            const params = {
                conversationType: RongIMLib.ConversationType.APP_PUBLIC_SERVICE,
                targetId: app.id,
            };
            router.push({
                name: 'conversation',
                params,
            });
            conversationAPI.add(params);
            const itemId = ['conversation', params.conversationType, params.targetId].join('-');
            Vue.nextTick(() => {
                const item = document.getElementById(itemId);
                if (item) {
                    const parentHeight = item.parentNode.offsetHeight;
                    const offsetTop = item.offsetTop;
                    const alginWithTop = offsetTop > parentHeight;
                    item.scrollIntoView(alginWithTop);
                }
            });
        });

        // 注册双击跳转到未读消息事件
        this.$root.$on('scroll', () => {
            const unReadIndexs = conversationList.getUnReadOffset();
            if (conversationList.count >= unReadIndexs.length) {
                conversationList.count = 0;
            }
            const scrollToIndex = unReadIndexs[conversationList.count];
            // conversationList.$refs.list.scrollTop = 180
            conversationList.$nextTick(() => {
                conversationList.$refs.list.scrollTop = scrollToIndex * 60;
                conversationList.count++;
            });
        });
    },
    destroyed() {
        const im = this.$im();
        const conversationAPI = im.dataModel.Conversation;
        conversationAPI.unwatch(this.watch);
        // 删除监听 "Ctrl + F" 搜索快捷键事件
        client.unregSearch();
    },
    computed: {
        status() {
            return this.$im().status;
        },
        width() {
            // 会话列表的宽度
            const node = this.$im().resizeNode.rongList;
            return node.width;
        },
        resizeDirection() {
            // 当前可拖动的方向
            return this.$im().resizeDirection.use;
        },
        // 44248 - 【群头像】群组内添加群成员后，修改为默认头像不变更
        messageList: {
            get: function() {
                // 40467 - 【登录】换帐号登录后，进入页面拉不到会话，控制台有报错
                // 置顶草稿列表
                const draftTopList = this.list.filter(item => item.isTop && item.draft && item.draft.editTime).sort((messageItem1, messageItem2) => {
                    const draft1 = messageItem1.draft;
                    const draft2 = messageItem2.draft;
                    return draft2.editTime - draft1.editTime;
                });
                // 置顶列表
                const topList = this.list.filter(item => item.isTop && (!item.draft || item.draft.content === '')).sort((messageItem1, messageItem2) => {
                    let sentTime1 = 0;
                    let sentTime2 = 0;
                    if (messageItem1.latestMessage) {
                        sentTime1 = messageItem1.latestMessage.sentTime;
                    }
                    if (messageItem2.latestMessage) {
                        sentTime2 = messageItem2.latestMessage.sentTime;
                    }
                    return sentTime2 - sentTime1;
                });
                // 草稿列表
                const draftList = this.list.filter(item => item.draft && item.draft.editTime && !item.isTop).sort((messageItem1, messageItem2) => {
                    const draft1 = messageItem1.draft;
                    const draft2 = messageItem2.draft;
                    return draft2.editTime - draft1.editTime;
                });
                // 39234 - 【草稿排序】有草稿时会话窗口显示在顶部
                // 发送草稿后，会话应按时间排序
                // 普通列表
                const list = this.list.filter(item => (!item.draft || item.draft.content === '') && !item.isTop).sort((messageItem1, messageItem2) => {
                    let sentTime1 = 0;
                    let sentTime2 = 0;
                    if (messageItem1.latestMessage) {
                        sentTime1 = messageItem1.latestMessage.sentTime;
                    }
                    if (messageItem2.latestMessage) {
                        sentTime2 = messageItem2.latestMessage.sentTime;
                    }
                    return sentTime2 - sentTime1;
                });
                // Story 498 【丹东】【PC客户端】PC端产品能力演进 - RCE - Windows状态栏RCE客户端有未读消息时，展示最新未读消息会话者头像
                let resultArray = [...draftTopList, ...topList, ...draftList, ...list];
                //43720 - 【会话列表】收到有人@我消息，在收到新的消息，有人@我提醒不在显示
                const im = this.$im();
                const conversationAPI = im.dataModel.Conversation;
                resultArray.every((item) => {
                    // Group Conversation
                    if (item.conversationType === RongIMLib.ConversationType.GROUP && 
                        item.unreadMessageCount > 0) {
                        //Get unread notice messages
                        const targetId = item.targetId;
                        const conversationType = item.conversationType;
                        const params = {
                            targetId,
                            conversationType,
                        };
                        const atMessages = conversationAPI.getUnreadMentionedMessages(params);
                        if (atMessages.length > 0) {
                            item.latestMessage = atMessages[0];
                        }
                    }                       
                });

                window.RongDesktop.ipcRenderer.send('updated-list-data-main', resultArray);
                // 39234 - 【草稿排序】有草稿时会话窗口显示在顶部 - 有置顶的消息时，草稿应在置顶消息下面显示
                return resultArray;
            },
            set : function(newValue) {
                this.list = newValue;
            }
        },
    },
    watch: {
        status() {
            // 页面刷新时等待连接成功再获取会话列表
            this.getInit();
        },
        $route(route) {
            const params = route.params;
            const im = this.$im();
            const common = this.RongIM.common;
            this.conversation = {
                conversationType: params.conversationType,
                targetId: params.targetId,
            };
            // 搜索跳转过来也要更新高亮显示
            this.setHighlightItem()
            // 绑定拖动方法
            common.resizeNavNode(this, im);
        },
    },
    components: {
        search: getSearch,
        'latest-message': getLatestMessage,
        avatar,
        ConversationItem,
    },
    methods: {
        // 设置会话item高亮
        setHighlightItem() {
            const prev = this.list.find(l => l.isSelected === true);
            if (prev) {
                prev.isSelected = false;
            }

            const next = this.list.find(l => (this.isEqual(l, this.conversation)));
            if (next) {
                next.isSelected = true;
            }
        },
        /**
         * 修改会话列表
         * @param {Array} arrConversation 会话列表内容
         */
        setList(arrConversation) {
            const idCount = {};
            const context = this;
            // console.debug(`arrConversation.length => ${arrConversation.length}`)
            const tmpList = arrConversation.filter((item) => {
                // 42466 - 【消息】发送一条消息对方未读，会话列表显示为已读
                /* if (item.targetId === context.conversation.targetId && item.unreadMessageCount > 0) {
                    item.unreadMessageCount = 0;
                } */
                const id = `conversation-${item.conversationType}-${item.targetId}`;
                idCount[id] = (idCount[id] || 0) + 1;
                const count = idCount[id];
                if (count > 1) {
                    system.appLogger('error', new Error(`multiple conversation id: ${id}`).stack);
                    return false;
                }
                const key = item.conversationType + item.targetId;
                item.viewId = id;
                item.viewKey = key;
                return true;
            });
            this.list = tmpList.map(l => ({
                ...l,
                isSelected: this.isEqual(l, this.conversation),
            }));
        },

        // 获取所有 有未读消息的会话索引
        getUnReadOffset() {
            return this.messageList.map((item, index) => {
                if (item.unreadMessageCount > 0 && !item.notificationStatus) {
                    return index;
                }
            }).filter(item => typeof item !== 'undefined');
        },
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        getGroupUsername(...args) {
            return this.RongIM.common.getGroupUsername(...args);
        },
        getHtmlGroupUsername(args, ref) {
            this.RongIM.common.getHtmlGroupUsernameAsync(args, (res) => {
                this.$refs[ref][0].innerHTML = res;
            });
        },
        getGroupName,
        dateFormat,
        scroll() {
            // 滚动的时候搜索框失去焦点
            this.$im().$emit('searchBlur');
        },
        getInit() {
            const context = this;
            // 初始化会话列表，获取第一页
            const conversationList = this;
            const conversationAPI = this.$im().dataModel.Conversation;
            const common = this.RongIM.common;
            if (conversationList.status === RongIMLib.ConnectionStatus.CONNECTED) {
                const tag = Date.now();
                console.info('开始初始化会话列表-----', tag);
                conversationAPI.getInitList(pageNum, (errorCode, list) => {
                    console.info('完成初始化会话列表-----', tag, errorCode);
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    // 仅当有数据时再更新会话列表
                    if (list.length === 0) {
                        insertFileHelper(context, list);
                    }
                    conversationList.setList(list);
                    conversationList.lastIndex = list.length > pageNum ? list.length : pageNum;
                    conversationList.busy = false;
                });
            }
        },
        get() {
            const conversationAPI = this.$im().dataModel.Conversation;
            const common = this.RongIM.common;
            const conversationList = this;
            if (conversationList.status === RongIMLib.ConnectionStatus.CONNECTED) {
                // 42372 - 【会话列表】拉取会话列表中的会话，一直显示为正在加载
                // conversationList.busy = true;
                conversationAPI.getList((errorCode, list) => {
                    if (errorCode) {
                        common.toastError(errorCode);
                        return;
                    }
                    // 仅当有数据时再更新会话列表
                    if (list.length > 0) {
                        conversationList.allList = list;
                    }
                    if (conversationList.lastIndex === 0) {
                        const totalNum = conversationList.allList.length + 1;
                        conversationList.lastIndex = totalNum > pageNum ? pageNum : totalNum;
                    }
                    conversationList.busy = false;
                });
            }
        },
        isEqual: sameConversaton,
        isFromMe(message) {
            return message.messageDirection === 1;
        },
        top(conversation) {
            const conversationList = this;
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const key = `${conversationType}_${targetId}`;
            if (conversationList.listBusy[key]) {
                conversationList.closeContextmenu();
                return;
            }
            conversationList.listBusy[key] = true;
            const conversationAPI = this.$im().dataModel.Conversation;
            conversationAPI.top(conversationType, targetId, () => {
                conversationList.listBusy[key] = false;
            });
            conversationList.closeContextmenu();
        },
        untop(conversation) {
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const conversationAPI = this.$im().dataModel.Conversation;
            conversationAPI.untop(conversationType, targetId);
            this.closeContextmenu();
        },
        mute(conversation) {
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const conversationAPI = this.$im().dataModel.Conversation;
            conversationAPI.mute(conversationType, targetId);
            this.closeContextmenu();
        },
        unmute(conversation) {
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const conversationAPI = this.$im().dataModel.Conversation;
            conversationAPI.unmute(conversationType, targetId);
            this.closeContextmenu();
        },
        remove(conversation) {
            const conversationList = this;
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const conversationAPI = this.$im().dataModel.Conversation;
            const removeFuc = function removeFuc() {
                conversationAPI.remove(conversationType, targetId);
                conversationList.closeContextmenu();
                // 删除的是当前会话则跳转到"主页"
                const params = conversationList.$route.params;
                if (sameConversatonMethod(params, conversation)) {
                    conversationList.$router.push({
                        name: 'conversation',
                        query: {
                            force: 1,
                        },
                    });
                }
            };
            removeFuc();
        },
        showConversaton(conversation) {
            const context = this;
            const conversationType = conversation.conversationType;
            const targetId = conversation.targetId;
            const im = this.$im();
            const conversationAPI = im.dataModel.Conversation;
            // 41342 - 【消息】会话窗口里收到新消息提醒，查看后滚动鼠标又会显示新消息提醒
            if (conversation.unreadMessageCount > 0) {
                conversationAPI.clearUnReadCount(conversationType, targetId);
            }

            conversationAPI.getOne(conversationType, targetId, (error, newConversation) => {
                im.$emit('conversationchange', newConversation);
                context.$router.push({
                    name: 'conversation',
                    params: {
                        targetId,
                        conversationType,
                    },
                });

                Object.assign(context.conversation, newConversation || {});

                // 设置会话高亮显示
                this.setHighlightItem();
            });
        },
        getId(conversation) {
            const items = ['conversation', conversation.conversationType, conversation.targetId];
            return items.join('-');
        },
        // 文字最后是emoji, 且在mac 非高清屏下, emoji 会被覆盖一部分
        // 原因: chrome对emoji的渲染造成的. 解决: 判断, 加padding-right
        isCoverName(text) {
            const RongIMEmoji = RongIMLib.RongIMEmoji;
            const nativeTagReg = RongIMEmoji.emojiNativeReg;
            const emojis = text ? text.match(nativeTagReg) : text;
            const notIncludeEmoji = !emojis || !emojis.length;
            if (notIncludeEmoji || !isEmojiOverlap()) {
                return false;
            }
            const matchContent = emojis[emojis.length - 1];
            const index = text.lastIndexOf(matchContent);
            return matchContent.length + index === text.length;
        },
        // 获取拖拽方向
        getResizeDirection() {
            const direction = getResizeDirection({
                range: this.width,
                bound: this.bound.width,
                directions: ['left', 'right'],
            });
            if (this.isResizing) {
                this.$im().resizeDirection.temp = direction;
            }
            return direction;
        },
        loadMore() {
            loadMore(this);
        },

        /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
        deleteSelectionItem() {
            const items = this.messageList;

            for (let i = 0; i < items.length; i += 1) {
                const item = items[i];
                const viewId = item.viewId;
                const element = this.$el.querySelector(`#${viewId}`);

                if (element.classList.contains('rong-conversation-border')) {
                    element.classList.remove('rong-conversation-border');
                    break;
                }
            }
        },
        dragOverItem(evt, item) {
            const viewId = item.viewId;
            this.deleteSelectionItem(); // clear selection of other conversation room
            this.$el.querySelector(`#${viewId}`).classList.add('rong-conversation-border');
        },
        dropItem(evt, item) {
            /* exported evt */
            this.deleteSelectionItem();
            this.$im().$emit('select-conversation', item);

            console.log('drop-event... For 502 ------->');
        },
        dropAllItem() {
            this.deleteSelectionItem();
        },
    },
};

/**
会话列表右键菜单
与context-menu.js混合应用
context为showContextmenu()方法中传入的第二个参数
* */
function getContextMenu() {
    const options = {
        template: '#rong-template-conversation-contextmenu',
        computed: {
            isTop() {
                return this.context.conversation.isTop;
            },
            isMute() {
                return this.context.conversation.notificationStatus;
            },
        },
        methods: {
            top() {
                this.$emit('top', this.context.conversation);
            },
            untop() {
                this.$emit('untop', this.context.conversation);
            },
            mute() {
                this.$emit('mute', this.context.conversation);
            },
            unmute() {
                this.$emit('unmute', this.context.conversation);
            },
            remove() {
                this.$emit('remove', this.context.conversation);
            },
            close() {
                this.$emit('close');
            },
        },
    };
    return getContextMenuMixins(options);
}
// 插入文件助手
function insertFileHelper(context, conversations) {
    const file = getServerConfig().file;
    const friendApi = context.$im().dataModel.Friend;
    const fileHelperConversation = {
        targetId: file.file_transfer_robot_id,
        user: friendApi.getFileHelper(),
        conversationType: RongIMLib.ConversationType.PRIVATE,
        latestMessage: {},
    };
    conversations.push(fileHelperConversation);
}


function sameConversaton(one, another) {
    const oneConversationType = +one.conversationType;
    const anotherConversationType = +another.conversationType;
    const sameConversationType = oneConversationType === anotherConversationType;
    const sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}

function scrollToTop(listContent) {
    listContent.scrollTop(0);
}

// 根据 lastIndex: 显示条数 更新会话列表 isMore: 是否加载更多
function pageRefresh(context, list, isMore) {
    const end = context.lastIndex || pageNum;
    if (Array.isArray(list)) {
        context.setList(list);
        context.lastIndex = list.length > pageNum ? list.length : pageNum;
        return;
    }
    const common = context.RongIM.common;
    const conversationAPI = context.$im().dataModel.Conversation;
    conversationAPI.getInitList(end, (errorCode, conversationList) => {
        if (errorCode) {
            common.toastError(errorCode);
            return;
        }
        setTimeout(() => {
            context.loadingNextPage = false;
            // 仅当有数据时再更新会话列表
            if (conversationList.length > 0) {
                context.setList(conversationList);
            }
            if (conversationList.length < end && isMore) {
                context.hasMore = false;
            }
        }, 1000);
    });
}

// 分页加载会话列表获取下一页
function loadMore(conversationList) {
    if (!conversationList.isFirst && !conversationList.hasMore) {
        return;
    }
    if (conversationList.loadingNextPage) {
        return;
    }
    conversationList.isFirst = false;
    conversationList.loadingNextPage = true;
    const end = conversationList.lastIndex + pageNum;
    conversationList.lastIndex = end;
    pageRefresh(conversationList, null, true);
}

/**
 * 会话列表更新处理，避免全量更新
 * @param {*} context this
 * @param {*} list
 * @param {*} optimizeOptions 优化的选项参数
 */
async function optimizeConversation(context, optimizeOptions) {
    const im = context.$im();
    const conversationAPI = im.dataModel.Conversation;

    // 获取指定会话
    const getCurrent = (conversationType, targetId) => context.list.find(item => context.isEqual(item, {
        conversationType,
        targetId,
    }));
   
    const getConversationOne = (conversationType, targetId) => {
        return new Promise((resolve, reject) => {
            conversationAPI.getOne(conversationType, targetId, (error, newConversation) => {
               if(error) {
                   reject(error)
               }
               resolve(newConversation)
            });
        })
        
    }
    
    // 获取会话详情
    const getConversationDetial = (conversation) => {
        return new Promise((resolve, reject) => {
            conversationAPI.getConversationDetial(conversation, (error, newConversation) => {
               if(error) {
                   reject(error)
               }
               resolve(newConversation)
            });
        })
        
    }

    // 已读回执 
    if (optimizeOptions.receiptStatus) {
        const { message } = optimizeOptions;
        const current = getCurrent(message.conversationType, message.targetId);
        if (current) {
            current.latestMessage = message;
        }
    }

    // 收到消息 
    if (optimizeOptions.receiveMessage) {
        const { message } = optimizeOptions;
        let current = getCurrent(message.conversationType, message.targetId);
        // 从接口重新获取这个会话
        let r = await getConversationOne(message.conversationType, message.targetId)
        
        // 收到消息，但是会话不显示，可能这个会话被删除掉了
        if (!current) {
           context.list.push(r);
           current = r;
        }
        
        // 更新未读数
        current.unreadMessageCount = r.unreadMessageCount;
        // 如果当前打开的窗口是收到消息的窗口，不计数
        const isCurrent = context.isEqual({
            conversationType: message.conversationType, 
            targetId: message.targetId
        }, context.conversation);

        if(isCurrent) {
            current.unreadMessageCount = 0;
        }

        current.latestMessage = message;
        
        //43880 【会话窗口】打开会话窗口后应用退到后台，这时会话有人发消息，对方看到全部显示已读，接收方没有新消息提醒
        if(!browserWindow.isVisible()) {
            current.unreadMessageCount = 1;
        }

        // 消息免打扰
        if(typeof current.notificationStatus === 'number') {
          current.notificationStatus = current.notificationStatus === 1;
        }
        // 完善会话详情信息
        let res = await getConversationDetial({...current});
        Object.assign(current, res)
    }

    // 发送消息 
    if (optimizeOptions.sendMessage) {
        const { message } = optimizeOptions;
        const current = getCurrent(message.conversationType, message.targetId);
        if (current) {
            current.latestMessage = message;
        }
    }
    // 消息发送后清除草稿
    if (optimizeOptions.setDraft) {
        const { conversation } = optimizeOptions;
        const current = getCurrent(conversation.conversationType, conversation.targetId);
        if (current) {
            current.draft = conversation.draft;
        }
    }

    // showConversation清除未读数 
    if (optimizeOptions.clearUnreadCount) {
        const current = getCurrent(optimizeOptions.conversationType, optimizeOptions.targetId);
        if (current) {
            current.unreadMessageCount = 0;
        }
    }

    // 添加会话 1
    if (optimizeOptions.add) {
        const { conversation } = optimizeOptions;
        // 高亮显示
        const prev = context.list.find(l => l.isSelected === true);
        if (prev) {
            prev.isSelected = false;
        }
        Object.assign(conversation, { isSelected: true });
        // 更新会话
        context.list.push(conversation);
    }
}
