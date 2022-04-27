/* eslint-disable no-param-reassign */
import domtoimage from 'dom-to-image';
import Base64Util from '../../utils/Base64Media';
import copyToClipboard from '../../utils/copyToClipboard';
import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmpty from '../../utils/isEmpty';
import debounce from '../../utils/debounce';
import getBase64Size from '../../utils/getBase64Size';
import MessageType from '../../utils/MessageType';
import templateFormat from '../../utils/templateFormat';
import getPlatform from '../../utils/getPlatform';
import getDateId from '../../utils/getDateId';
import throttle from '../../utils/throttle';
import console from '../../utils/console';
import dateFormat from '../../utils/dateFormat';
import getFilename from '../../utils/getFilename';
import localeConf from '../../locale';
import system from '../../system';
import file from '../../file';
import clipboard from '../../clipboard';
import { download } from '../../download';
import config from '../../config';
import isAvailableData from '../../isAvailableData';
import imageViewer from '../../imageViewer';
import avatar from '../avatar.vue';
import RecallCommandMessage from '../message/recall-command.vue';
import TextMessage from '../message/text.vue';
import RCCombineMessage from '../message/combine.vue';
import ImageMessage from '../message/image.vue';
import FileMessage from '../message/file.vue';
import VoiceMessage from '../message/voice.vue';
import LocationMessage from '../message/location.vue';
import CardMessage from '../message/card.vue';
import SightMessage from '../message/sight.vue';
import RichContentMessage from '../message/richcontent.vue';
import ApprovalMessage from '../message/approval.vue';
import UnknownMessage from '../message/unknown.vue';
import GroupNoticeNotifyMessage from '../message/groupnotice.vue';
import JrmfRedPacketMessage from '../message/jrmf-red-packet.vue';
import PublicServiceRichContentMessage from '../message/ps-image-text.vue';
import PublicServiceMultiRichContentMessage from '../message/ps-multi-image-text.vue';
import VideoSummaryMessage from '../message/summary.vue';
import ReferenceMessage from '../message/quote/quote.vue';
import RequestFriendVerificationMessage from '../message/request-friend-verification.vue';
import groupSummaryFormat from '../../common/groupSummaryFormat';
import isCanceled from '../../common/isCanceled';
import UserType from '../../common/UserType';
import equalMessage from '../../common/equalMessage';
import groupNoticeFormat from '../../common/groupNoticeFormat';
import showAck from '../../dialog/conversation/ack';
import userProfile from '../../dialog/contact/user';
import showForward from '../../dialog/conversation/forward';
import getContextMenuMixins from '../mixins/context-menu';
import createNotificationMessage from '../../common/createNotificationMessage';
import buildMessage from '../../common/buildMessage';
import forwardDialog from '../../dialog/forward-message';
import combineMsgDetail from '../../dialog/conversation/combinemsg-detail';
import { getServerConfigByChainedKey } from '../../cache/helper';

function transId(messageId) {
    return `rong-message-${messageId}`;
}

// Element.scrollIntoView 导致页面抖动变形,自己控制消息滚动位置
function scrollIntoView(container, target, alignToTop) {
    let scrollTop = target.offsetTop;
    if (alignToTop === false) {
        scrollTop = target.offsetTop - (container.clientHeight - target.offsetHeight);
    }
    container.scrollTop = scrollTop;
}

const supportMessageTypeList = [
    'TextMessage',
    'ImageMessage',
    RongIMLib.RongIMClient.MessageType.GIFMessage,
    'FileMessage',
    'VoiceMessage',
    'GroupMemChangedNotifyMessage',
    'GroupNotifyMessage',
    'GroupCmdMessage',
    'LocationMessage',
    'NotificationMessage',
    'RecallCommandMessage',
    'LocalFileMessage',
    'LocalImageMessage',
    'InformationNotificationMessage',
    'CardMessage',
    'SightMessage',
    'ContactNotifyMessage',
    'RichContentMessage',
    'ApprovalMessage',
    'GroupNoticeNotifyMessage',
    'JrmfRedPacketMessage',
    'JrmfRedPacketOpenedMessage',
    'PublicServiceRichContentMessage',
    'PublicServiceMultiRichContentMessage',
    'PublicServiceCommandMessage',
    'VideoSummaryMessage',
    'RealTimeLocationStartMessage',
    'ReferenceMessage',
    'RequestFriendVerificationMessage',
    'RCCombineMessage',
];

/*
说明： 消息列表
功能： 会话界面处理各种消息的展示、复制、删除、转发，图片文件的下载等
*/
export default {
    name: 'message-list',
    mixins: [getContextMenu(), getLocaleMixins('message-list')],
    props: [
        'conversation',
        'append-message',
        'status',
        'group',
        'in-group',
        'isBanned',
        'isMultiSelected',
        'conversation_type', // 43192 【逐条转发】逐条转发群组中@人消息至单人对话框，可以点击@人消息查看人员资料
    ],
    data() {
        const titleBarHeight = 55;
        return {
            busy: false,
            autoScroll: true,
            fixOffset: {
                top: titleBarHeight,
            },
            // 页面渲染的 list
            messageList: [],
            // 和缓存绑定的 list
            realList: [],
            // 未读的 list，不和缓存绑定
            unreadList: [],
            lastMessage: {},
            atMessagesUIds: [],
            hasMoreLast: false,
            isJump: false,
            showAttip: false,
            // drag item, drop conversation item
            dragMessageInfo: '',
            dropConversationInfo: '',
            selectedMessageIds: [],
            selectedMessages: [],
            selectedMessageCount: 0,
        };
    },
    components: {
        avatar,
        RecallCommandMessage,
        TextMessage,
        ImageMessage,
        GIFMessage: ImageMessage,
        LocalImageMessage: ImageMessage,
        FileMessage,
        LocalFileMessage: FileMessage,
        VoiceMessage,
        LocationMessage,
        CardMessage,
        SightMessage,
        RichContentMessage,
        ApprovalMessage,
        UnknownMessage,
        GroupNoticeNotifyMessage,
        JrmfRedPacketMessage,
        PublicServiceRichContentMessage,
        PublicServiceMultiRichContentMessage,
        VideoSummaryMessage,
        ReferenceMessage,
        RequestFriendVerificationMessage,
        RCCombineMessage,
    },
    mounted() {
        const im = this.$im();
        const context = this;

        im.$on('multiMsgForwardDone', () => {
            this.selectedMessageIds.forEach((messageId) => {
                if (document.getElementById(messageId)) {
                    document.getElementById(messageId).classList.remove('rong-collect-selected');
                }
            });
            this.selectedMessages = [];
            this.$emit('setMultiSelect', false);
            this.$emit('selectedMessages', []);
        });

        im.$on('select-conversation', (dropConversation) => {
            context.dropConversationInfo = dropConversation;
            forwardDialog();
        });

        im.$on('approve-forward-message', () => {
            const target = context.dragMessageInfo; // message
            const dest = context.dropConversationInfo; // group

            const dataModel = context.$im().dataModel;
            const messageApi = dataModel.Message;
            const messageContent = target.content;
            const destConversationType = dest.conversationType;
            const destTargetId = dest.targetId;
            const receiverID = dest.viewId;

            const message = messageApi.create({
                messageType: target.messageType,
                content: messageContent,
            });
            const destObj = {
                conversationType: destConversationType,
                targetId: destTargetId,
                content: message,
            };
            messageApi.send(destObj, (err, msg) => {
                if (err === 'lib-22408') {
                    messageApi.addForwardFaildMessage(msg);
                }

                // activate conversation
                im.$emit('activate-forward-channel', {
                    receiver: receiverID,
                });
            });
        });
    },
    computed: {
        // 文件助手
        isFileHelper() {
            const conversation = this.conversation || {};
            const user = conversation.user || {};
            const isFileHelper = user.id === getServerConfigByChainedKey('file.file_transfer_robot_id');
            return isFileHelper;
        },
        conversationType() {
            return +this.$route.params.conversationType;
        },
        isPublic() {
            return (
                +this.$route.params.conversationType
                === RongIMLib.ConversationType.APP_PUBLIC_SERVICE
            );
        },
        targetId() {
            return this.$route.params.targetId;
        },
        /*
      显示新消息提示
      消息列表滚动条不在最底部时有新消息给出提示
    */
        hasNewMessageTip() {
            return !this.autoScroll && this.conversation.unreadMessageCount > 0;
        },
        disabled() {
            return !this.inGroup;
        },
        /*
      url query 参数包含 messageUId 是由搜索消息跳转
    */
        isSearch() {
            const query = this.$route.query;
            return !isEmpty(query.messageUId);
        },
        filtedMessageList() {
            const authId = this.$im().auth.id;
            const messageList = this.messageList;
            const group = this.conversation.group;
            const now = Date.now()
                .toString()
                .substr(-6);
            // 排除部分群通知 成员被踢出和退出时其他成员不显示
            const list = messageList.filter((message, index) => {
                if (message.content && message.content.burnDuration) {
                    return false;
                }
                const isGroupMemberMessage = message.messageType === 'GroupMemChangedNotifyMessage';
                if (isGroupMemberMessage) {
                    if (!group) {
                        return false;
                    }
                    // 操作行为类型
                    const messageAction = message.content.action;
                    // 群组减员通知：3，被移除；4，主动退出
                    if (messageAction === 3 || messageAction === 4) {
                        // 非操作者，后台操作时，操作者 id 为群主
                        const isNotOperatorUser = message.content.operatorUser.id !== authId;
                        // 非被操作者
                        const isNotTargetUsers = !message.content.targetUsers.some(
                            item => item.id === authId,
                        );
                        const isManager = group.admin_id === authId;
                        // 无关消息，不显示
                        if (
                            isNotOperatorUser
                            && isNotTargetUsers
                            && !isManager
                        ) {
                            return false;
                        }
                        // 群组减员消息，只通知群主且群必须为自建群，部门群等不通知
                        return (
                            !isNotTargetUsers || (isManager && group.type === 0)
                        );
                    }
                    return true;
                }
                // 移动端仅有的消息类型
                const isMobileMessage = message.messageType === 'RealTimeLocationStartMessage';
                // 如果是发送给公众号 commandMessage，不显示
                // 移动端进入应用公众号会发一条 ClickMenuMessage 消息
                const isPublicServiceCommandMessage = message.messageType === 'PublicServiceCommandMessage'
                    || message.objectName === 'RC:PSCmd';
                // 排除 '可以在手机与电脑间互传文件与消息' 消息
                const isInformationNotificationMessage = message.messageType === 'InformationNotificationMessage'
                    || message.objectName === 'RC:InfoNtf';
                let isDeletePrompt = false;
                if (isInformationNotificationMessage) {
                    const content = message.content.message || '';
                    const enDesc = localeConf.en.components.getFileHelper.desc;
                    const zhDesc = localeConf.zh.components.getFileHelper.desc;
                    isDeletePrompt = content === enDesc || content === zhDesc;
                }
                if (
                    isPublicServiceCommandMessage
                    || isMobileMessage
                    || isDeletePrompt
                ) {
                    return false;
                }
                if (!message.messageId) {
                    // 偶现 messageId 为 0 值导致页面渲染出现多个 id 相同的 DOM 元素，致使 Vue 渲染报错
                    // 故增加日志用于分析排查
                    // 修复撤回消息 messageId 为空的问题打开日志看是否有其他消息影响
                    system.appLogger(
                        'error',
                        `messageId invalied!!!\nmessage: ${JSON.stringify(
                            message,
                        )}`,
                    );
                    message.showId = message.showId || transId(now + index);
                } else {
                    message.showId = transId(message.messageId);
                }
                return true;
            });
            setMessagesAlias(this, list);
            return list;
        },
        isWebPlatform() {
            return getPlatform().indexOf('web') !== -1;
        },
        // 未读消息提示的位置
        bottom() {
            const node = this.$im().resizeNode.messageInput;
            const height = node.height;
            return (height || 120) + 8;
        },
        atNumber() {
            const length = this.atMessagesUIds.length;
            if (length < 100) {
                return length;
            }
            return '99+';
        },
    },
    watch: {
        realList() {
            const newMessage = this.realList.slice(-1)[0] || {};
            const fromMe = newMessage.messageDirection === 1;
            if (fromMe) {
                this.setMessageList(this.realList);
                this.isJump = false;
            }
        },
        isJump() {
            if (this.isJump) {
                this.autoScroll = false;
            }
        },
        $route() {
            this.$emit('selectedMessages', []);
            this.busy = false;
            this.checkAtUnread();
            if (this.conversation.unreadMessageCount > 0) {
                this.$im().dataModel.Conversation.clearUnReadCount(this.conversationType, this.targetId);
            }
            this.unreadList = [];
            this.getMessage();
        },
        messageList() {
            if (this.messageList.length === 0) {
                return;
            }
            const newMessage = this.messageList.slice(-1)[0] || {};
            newMessage.messageUId = newMessage.messageUId || new Date().getTime();
            const hasNewMessage = this.lastMessage.messageUId !== newMessage.messageUId;
            if (hasNewMessage && newMessage.messageDirection === RongIMLib.MessageDirection.RECEIVE) {
                this.$im().dataModel.Message.setMessageStatus(newMessage);
            }
            if (
                hasNewMessage
                && this.autoScroll
                && this.messageList.length > 300
            ) {
                this.messageList.splice(0, 100);
            }
            if (!this.isJump) {
                messageListChanged(this, this.$im());
            }
            // 有新消息进来时,判断是否是@自己的消息,是添加到 atMessagesUIds
            if (hasNewMessage
                && newMessage.messageDirection === RongIMLib.MessageDirection.RECEIVE
                && newMessage.content.mentionedInfo
                && (newMessage.content.mentionedInfo.type === 1
                    || (newMessage.content.mentionedInfo.type === 2
                        && newMessage.content.mentionedInfo.userIdList.indexOf(this.$im().auth.id) > -1))) {
                this.atMessagesUIds.push(newMessage.messageUId);
            }
        },
        appendMessage(newMessage, oldMessage) {
            const changValid = isEmpty(oldMessage)
                || newMessage.messageUId !== oldMessage.messageUId;
            if (changValid) {
                this.messageList.push(newMessage);
            }
        },
        isMultiSelected(newValue) {
            if (!newValue) {
                this.selectedMessageIds = [];
                this.selectedMessages = [];
                this.$emit('selectedMessages', []);
                this.selectedMessageCount = 0;
            }
        },
    },
    created() {
        created(this);
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    filters: {
        dateFormat(timestamp) {
            return dateFormat(timestamp, {
                alwaysShowTime: true,
            });
        },
    },
    methods: {
        showAtTip(atUIds) {
            if (atUIds.length > 0) {
                this.showAttip = true;
                return;
            }
            this.showAttip = false;
        },
        isUnreadAt(msg) {
            if (this.atMessagesUIds.indexOf(msg.messageUId) > -1) {
                return true;
            }
            return false;
        },
        checkAtUnread() {
            const context = this;
            const conversationApi = this.$im().dataModel.Conversation;
            const params = {
                targetId: this.targetId,
                conversationType: this.conversationType,
            };
            const atMessages = conversationApi.getUnreadMentionedMessages(params);
            context.atMessagesUIds = atMessages.map(item => item.messageUId);
        },
        addAtListener() {
            const context = this;
            if (context.atNumber === '99+' || context.atNumber > 0) {
                const atElements = document.querySelectorAll('.rong-unread-at-message');
                window.atElements = atElements;
                const msgUids = [];
                atElements.forEach((element) => {
                    if (isInSight(element, context)) {
                        const msgUId = element.dataset.messageuid;
                        msgUids.push(msgUId);
                    }
                });
                const atUIds = context.atMessagesUIds.filter(msg => msgUids.indexOf(msg) === -1);
                context.showAtTip(atUIds);
                context.atMessagesUIds = atUIds;
            }
        },
        jumpAtMsg() {
            const msgUId = this.atMessagesUIds[0];
            this.isJump = true;
            if (this.atNumber > 0 && this.atMessagesUIds.length > 0 && this.showAtTip) {
                jumpAtMsg(this, msgUId, this.$im().dataModel.Message);
            }
        },
        scrollBarMove: throttle(function onscroll(event) {
            if (isAvailableData()) {
                scroll(this, event, true);
            }
        }, 500),
        setMessageList(messageList) {
            this.messageList = messageList;
        },
        reset() {
            this.setMessageList([]);
        },
        getMessage() {
            getMessage(this, this.$im().dataModel.Message);
        },
        getMessageType(item) {
            const messageType = item.messageType;
            const supported = this.$options.components[messageType];
            if (!supported) {
                return 'UnknownMessage';
            }
            const map = {
                LocalImageMessage: 'ImageMessage',
                LocalFileMessage: 'FileMessage',
                GIFMessage: 'ImageMessage',
            };
            return map[item.messageType] || messageType;
        },
        isGroupNotificationMessage(message) {
            const NOTICE_ACTION = 3;
            const content = message.content || {};
            const isNotice = content.action === NOTICE_ACTION;
            const isGroupNotification = message.messageType === 'GroupNotifyMessage';
            if (isGroupNotification && isNotice) {
                return false;
            }
            const list = ['GroupMemChangedNotifyMessage', 'GroupNotifyMessage'];
            return list.indexOf(message.messageType) >= 0;
        },
        getNotification(item) {
            return item.content.content;
        },
        getGroupNotification(item) {
            return this.RongIM.common.getGroupNotification(
                item,
                this.$im().auth.id,
            );
        },
        isGroupSummary(message) {
            const isGroup = message.conversationType === RongIMLib.ConversationType.GROUP;
            const isSummary = message.messageType === 'VideoSummaryMessage';
            return isGroup && isSummary;
        },
        getGroupSummary(message) {
            return groupSummaryFormat(message.content, this.locale);
        },
        getJrmfRedPacket(item) {
            return this.RongIM.common.getJrmfRedPacket(item);
        },
        getJrmfRedPacketOpened(item) {
            return this.RongIM.common.getJrmfRedPacketOpened(
                item,
                this.$im().auth.id,
            );
        },
        getContactNotification(item) {
            return this.RongIM.common.getContactNotification(
                item.content,
                this.$im().auth.id,
            );
        },
        getInformationNotificationMessage(item) {
            const content = item.content.message;
            if (content.messageName === 'ContactNotifyMessage') {
                return this.RongIM.common.common.getContactNotification(
                    content,
                    this.$im().auth.id,
                );
            }
            return content;
        },
        /*
获取消息的发送状态
10 'SENDING'
20 'FAILED'
30 'SENT'
40 'RECEIVED'
50 'READ'
60 'DESTROYED'
*/
        getMessageStatus(message) {
            if (isEmpty(message.sentStatus)) {
                // 接收消息的 sentStatus 为空
                return undefined;
            }
            let status = RongIMLib.SentStatus[message.sentStatus];
            if (isCanceled(message)) {
                status = 'SENT';
            }
            return status.toLowerCase();
        },
        isImageMessage(item) {
            return item.messageType === 'ImageMessage';
        },
        recall(message) {
            recall(message, this.$im().dataModel.Message, this.RongIM.common);
            this.$refs.contextmenu.close();
        },
        copy(message) {
            copy(this, message);
        },
        collect(message) {
            collect(this, message);
        },
        forward(message) {
            forward(this, message);
        },
        remove(message) {
            remove(this, message, this.$im().dataModel.Message);
        },
        /* 下载图片 */
        download(message) {
            if (message.messageType === 'FileMessage') {
                const fileComponents = this.$refs[message.messageUId];
                if (fileComponents && fileComponents.length > 0) {
                    fileComponents[0].download(message, false, fileComponents, true);
                }
                // 38807 - 【小视频】移动端发送的小视频，PC 端查看失败，无法查看
            } else if (message.messageType === 'SightMessage') {
                const imgUrl = message.content.sightUrl;
                const filename = message.content.name;
                const downloader = download({ url: imgUrl, name: filename });
                downloader.saveAs();
            } else {
                const imgUrl = message.content.imageUri || message.content.remoteUrl;
                const tmpFile = getFilename(imgUrl);
                let filename = '';
                if (tmpFile.ext === '') {
                    filename = `${getDateId()}.png`;
                }
                const downloader = download({ url: imgUrl, name: filename });
                downloader.saveAs();
            }
            this.closeContextmenu();
        },
        /* 文件消息打开文件所在文件夹 */
        open(message) {
            openFolder(message, this);
            this.closeContextmenu();
        },
        quote(message) {
            // 引用消息再次引用，只引用文本部分。
            let msg = message;
            if (msg.messageType === 'ReferenceMessage') {
                const text = message.content.text;
                msg = $.extend({}, message, {
                    messageType: 'TextMessage',
                    content: {
                        content: text,
                    },
                });
            }
            this.$emit('quote', msg);
            this.closeContextmenu();
        },
        multiSelect(message) {
            const messageId = message.messageId;
            const classList = document.getElementById(messageId).classList;
            classList.add('rong-collect-selected');
            this.selectedMessageIds.push(messageId);
            addSelectedMessage(this, messageId, message);
            this.$emit('selectedMessages', this.selectedMessages);
            this.$emit('setMultiSelect', true);
            this.closeContextmenu();
        },
        userProfile,
        scrollToRecord() {
            const $content = $(this.$refs.content);
            const recordTop = this.recordTop;
            setTimeout(() => {
                $content[0].scrollTop = recordTop;
            }, 300);
        },
        /*
当input被拖动, 且会话也在底部时, 消息滚动到底部
调用位置: message-input.js(inputBoxResize方法)
 */
        scrollWhenInputResize() {
            if (this.autoScroll) {
                this.scrollToMessage('bottom');
            }
        },
        scrollToMessage(messageId, alignToTop) {
            const $content = $(this.$refs.content);
            const context = this;
            function waitImageLoad() {
                const el = document.getElementById(transId(messageId));
                if ($content) $content.css('visibility', 'visible');
                // if (el) el.scrollIntoView(alignToTop);
                if (el) {
                    scrollIntoView($content.get(0), el, alignToTop);
                }
                Vue.nextTick(() => {
                    context.addAtListener();
                });
            }
            setTimeout(waitImageLoad, 200);
        },
        scrollToNewMessage(unreadMessageCount) {
            scrollToNewMessage(this, unreadMessageCount);
        },
        scroll: throttle(function onscroll(event) {
            if (isAvailableData()) {
                scroll(this, event);
            }
        }, 500),
        getHistory: debounce(
            function getHistoryHandle(last) {
                getHistory(this, this.$im().dataModel.Message, last);
            },
            500,
            true,
        ),
        clearUnReadCount() {
            const im = this.$im();
            clearUnReadCount(
                this,
                im.dataModel.Conversation,
                this.conversation,
                im,
            );
        },
        /* 发送失败的消息点击重新发送 */
        reSendMessage(message) {
            const dataModel = this.$im().dataModel;
            if (
                message.sentStatus === RongIMLib.SentStatus.FAILED
                && this.inGroup
            ) {
                const api = {
                    message: dataModel.Message,
                    file: dataModel.File,
                };
                reSendMessage(api, message, this);
            }
        },
        uploadCancel(message, messageList) {
            const arrMessage = messageList || this.messageList;
            const index = arrMessage.indexOf(message);
            arrMessage.splice(index, 1);
        },
        isValidMessage(message) {
            return message.messageType !== 'UnknownMessage';
        },
        isLastMessage(message) {
            const lastMessage = this.messageList.slice(-1)[0] || message;
            return message.messageUId === lastMessage.messageUId;
        },
        /* 是否显示群消息回执 */
        showGroupResp(message) {
            const send = message.messageDirection === RongIMLib.MessageDirection.SEND;
            const isGroup = message.conversationType === RongIMLib.ConversationType.GROUP;
            return this.isValidMessage(message) && send && isGroup;
        },
        /* 是否显示单聊消息已读回执状态 */
        showPrivateResp(message) {
            const excludeList = [
                'VideoSummaryMessage',
            ];
            const show = excludeList.indexOf(message.messageType) === -1;
            const send = message.messageDirection === RongIMLib.MessageDirection.SEND;
            const isPrivate = +message.conversationType
                === RongIMLib.ConversationType.PRIVATE;
            const conversation = this.conversation || {};
            const user = conversation.user || {};
            const isFileHelper = user.type === 3;
            return (
                this.isValidMessage(message)
                && send
                && isPrivate
                && !isFileHelper
                && show
            );
        },
        fromMe(message) {
            return message.messageDirection === 1;
        },
        isUnRead(message) {
            return message.sentStatus === RongIMLib.SentStatus.SENT;
        },
        isRead(message) {
            return message.sentStatus === RongIMLib.SentStatus.READ;
        },
        /* 可发送群已读回执请求 显示 '查看未读' */
        ableSendGroupReq(message) {
            if (this.$route.query.messageUId) {
                return false;
            }
            // 30 发送成功 40 对方已接收 50 对方已读 60 对方已销毁。 大于 30 都记为发送成功
            const isSendSuccess = message.sentStatus >= RongIMLib.SentStatus.SENT;
            const isSendLastMessage = isLatestSentMessage(
                message,
                this.messageList,
            );
            return isEmpty(message.receiptResponse) && isSendSuccess
                && isSendLastMessage;
        },
        sendGroupReq(message) {
            Vue.set(message, 'receiptResponse', []);
            this.$im().dataModel.Message.sendGroupRequest(message);
        },
        /* 存在群消息已读回执数据 */
        hasGroupResp(message) {
            return $.isArray(message.receiptResponse);
        },
        /* 获取群消息未读具体人数 */
        getUnreadCount(message) {
            const unreadMember = getUnreadMember(
                this.conversation.group,
                message,
                this.$im().auth.id,
            );
            uploadUnReadMember(message, unreadMember, this.$im());
            const unreadCount = unreadMember ? unreadMember.length : -1;
            return unreadCount;
        },
        /* 展示群消息已读回执详情 */
        showUnreadMember(message) {
            const im = this.$im();
            const userApi = im.dataModel.User;
            const readMember = message.receiptResponse.filter(
                item => item !== im.auth.id,
            );
            const unreadMember = getUnreadMember(
                this.conversation.group,
                message,
                im.auth.id,
            ).map(item => item.id);
            const arr = unreadMember.concat(readMember);
            const group = this.conversation.group;
            userApi.getBatch(arr, (errorCode, userList) => {
                showAck(userList, readMember, message.messageId, group.id);
            });
        },
        handleResize() {
            this.closeContextmenu();
        },
        showImage(message) {
            if (this.isMultiSelected) {
                return;
            }
            this.RongIM.common.showImage(
                getImageMessageList(this.filtedMessageList),
                message.messageUId,
                config.locale,
            );
        },
        showSight(message) {
            if (this.isMultiSelected) {
                return;
            }
            this.showImage(message);
        },
        showCombineMsg(message) {
            if (this.isMultiSelected) {
                return;
            }
            combineMsgDetail(message);
        },
        /* 自动播放未读语音的回调 */
        autoPlay(context) {
            const msg = getNextUnreadVoice(this, context);
            this.$im().$emit('voicemessage.autoplay', msg);
        },
        imageDownloadComplete() {
            if (this.autoScroll) {
                this.scrollToMessage('bottom', false);
            }
        },

        /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
        dragMessage(evt, item) {
            if (item.messageType === 'ImageMessage'
                || item.messageType === 'GIFMessage'
                || item.messageType === 'FileMessage'
                || item.messageType === 'LocalImageMessage'
                || item.messageType === 'SightMessage'
                || item.messageType === 'LocalFileMessage'
            ) {
                evt.dataTransfer.dropEffect = 'move';
                evt.dataTransfer.effectAllowed = 'move';
                this.dragMessageInfo = item;
                if (item.messageType === 'ImageMessage'
                    || item.messageType === 'GIFMessage'
                    || item.messageType === 'SightMessage'
                    || item.messageType === 'LocalImageMessage'
                ) {
                    evt.dataTransfer.setDragImage(evt.target.querySelector('img'), 0, 0);
                }
                this.$im().$emit('start-dragItem', item);
            } else {
                evt.preventDefault();
            }
        },
        dropMessage() {
            this.$im().$emit('clear-all-selection');
        }, // 丹东合并过来的代码，出现语法错误。暂时添加 } 解决，问题待验证
        isCombineMessage(item) {
            return item.messageType === 'RCCombineMessage';
        },
        select(event, item) {
            if (!this.isMultiSelected) {
                return;
            }
            if (this.selectedMessageCount > 99) {
                this.RongIM.common.messageToast({
                    type: 'error',
                    message: this.locale.tips.mostCombineMsg,
                });
                return;
            }
            const messageId = item.messageId;
            const $target = $(event.target);
            if ($target.is('input')) {
                return;
            }
            const classList = document.getElementById(messageId).classList;
            if ($target.is('i')) {
                if (classList.contains('rong-collect-selected')) {
                    classList.remove('rong-collect-selected');
                    const index = this.selectedMessageIds.indexOf(messageId);
                    if (index > -1) {
                        this.selectedMessages.splice(index, 1);
                        this.selectedMessageCount -= 1;
                    }
                } else {
                    classList.add('rong-collect-selected');
                    addSelectedMessage(this, messageId, item);
                }
            } else if (classList.contains('rong-collect-selected')) {
                classList.remove('rong-collect-selected');
                const index = this.selectedMessageIds.indexOf(messageId);
                if (index > -1) {
                    this.selectedMessageIds.splice(index, 1);
                    this.selectedMessages.splice(index, 1);
                    this.selectedMessageCount -= 1;
                }
            } else {
                classList.add('rong-collect-selected');
                this.selectedMessageIds.push(messageId);
                addSelectedMessage(this, messageId, item);
            }
            this.$emit('selectedMessages', this.selectedMessages);
        },
    },
};

function setMessagesAlias(context, messageList) {
    let groupMembersMap;
    if (context.conversation.group) {
        groupMembersMap = context.RongIM.common.getGroupMemberMap(context.conversation.group);
    }
    messageList.forEach((message) => {
        const user = message.user;
        let alias;
        if (!user) {
            message.alias = '';
            return;
        }
        /* eslint no-underscore-dangle: 0 */
        alias = user.alias || context.RongIM.dataModel._Cache.alias[user.id] || user.name;
        if (groupMembersMap && groupMembersMap[user.id]) {
            const cacheMember = groupMembersMap[user.id];
            if (cacheMember) {
                alias = cacheMember.groupAlias || cacheMember.alias || alias;
            }
        }
        // 备注的优先级高于群昵称
        if (user.alias) {
            alias = user.alias;
        }
        message.alias = context.RongIM.common.getHtmlGroupUsername2(alias, 16, message.senderUserId);
    });
}
/**
 * 查询消息内容是否可复制
 * @param {Message} message 消息内容
 * @param {(boolean) => void} callback 结果回调
 */
function checkCopyEnable(context, message, callback) {
    if (message.noSupportView) {
        return;
    }
    const messageType = message.messageType;
    const isTxtMsg = ['TextMessage', 'ReferenceMessage'].indexOf(messageType) > -1;
    if (isTxtMsg) {
        callback(true);
        return;
    }
    const content = message.content;
    const isImgMsg = messageType === 'ImageMessage';
    if (isImgMsg) {
        const url = content.imageUri || content.remoteUrl;
        context.RongIM.common.localfileInDesk(
            url,
            'media',
            (localPath) => {
                if (localPath) {
                    message.localPath = localPath;
                }
                callback(!!localPath);
            },
        );
        return;
    }
    const isFileMsg = messageType === 'FileMessage';
    if (isFileMsg) {
        const localPath = content.localPath;
        const fileExist = file.checkExist(localPath);
        callback(localPath && fileExist);
        return;
    }
    callback(false);
}

/*
说明： 消息的右键菜单
备注： 多图文消息比较特殊，需要解析每一项进行转发
*/
function getContextMenu() {
    const enableCollect = config.modules.collect;
    const options = {
        template: 'templates/conversation/message-contextmenu.html',
        data() {
            return {
                showCopy: false,
            };
        },
        props: ['isBanned', 'context'],
        computed: {
            support() {
                return config.support;
            },
            message() {
                const context = this;
                const message = this.context.message;
                // 异步检查 copy 键是否显示
                checkCopyEnable(context, message, (bool) => {
                    context.showCopy = bool;
                });
                return message;
            },
            messageContent() {
                return this.message.content;
            },
            imageURL() {
                return this.messageContent.imageUri || this.messageContent.remoteUrl;
            },
            fileURL() {
                return this.messageContent.fileUrl;
            },
            filename() {
                return this.messageContent.name;
            },
            canOpenFile() {
                const localUrl = this.message.content.localPath
                    || this.message.content.fileUrl;
                return getFileExists(localUrl);
            },
            isSuccess() {
                const sentStatus = this.message.sentStatus;
                const read = sentStatus === RongIMLib.SentStatus.READ;
                const unread = sentStatus === RongIMLib.SentStatus.SENT;
                return isEmpty(sentStatus) || read || unread;
            },
            showSave() {
                if (this.message.noSupportView) {
                    return false;
                }
                const type = this.message.messageType;
                const isImageMessage = (type === 'ImageMessage' || type === RongIMClient.MessageType.GIFMessage);
                return this.isSuccess && isImageMessage;
            },
            showSaveAs() {
                // 39327 - 【消息】下载中将超过5m的图片存到桌面上，文件没显示下载完成
                // 如果下载中，无法SaveAs
                const im = this.$im();
                if (this.message.noSupportView) {
                    return false;
                }
                if (im.RongIM.dataModel.File.downloadManage.get(this.message.messageUId)) {
                    return false;
                }
                // 38807 - 【小视频】移动端发送的小视频，PC 端查看失败，无法查看
                if (this.message.messageType === 'SightMessage') {
                    return this.message.content.sightUrl;
                }
                return this.message.content.fileUrl;
            },
            showDownload() {
                const isFileMessage = this.message.messageType === 'FileMessage';
                return this.isSuccess && isFileMessage;
            },
            showForward() {
                const excludeList = [
                    'VoiceMessage',
                    'VideoSummaryMessage',
                    'ApprovalMessage',
                    'JrmfRedPacketMessage',
                ];
                const show = excludeList.indexOf(this.message.messageType) < 0;
                return this.isSuccess && show;
            },
            showRecall() {
                const excludeList = [
                    'VideoSummaryMessage',
                    'JrmfRedPacketMessage',
                ];
                const show = excludeList.indexOf(this.message.messageType) < 0;
                const isSent = this.message.messageDirection === 1;
                const time = new Date().getTime() - this.message.sentTime;
                const isValidTime = time < config.recallMessageTimeout;
                const isPublic = this.message.conversationType === 7;
                return (
                    this.isSuccess && isSent && isValidTime && show && !isPublic
                );
            },
            showQuote() {
                const message = this.message;
                // 44694 - 【文件隔离】被隔离的图片缺少“引用”选项
                if (message.noSupportView && message.messageType !== 'ImageMessage') {
                    return false;
                }
                // 有效消息类型检测
                const validMessage = [
                    'TextMessage',
                    'ImageMessage',
                    // RongIMClient.MessageType.GIFMessage,
                    'FileMessage',
                    'RichContentMessage',
                    'ReferenceMessage',
                ].some(type => type === message.messageType);
                if (!validMessage) {
                    return false;
                }
                // 有效会话类型检测
                const conversationType = +this.message.conversationType;
                // 私聊
                if (conversationType === RongIMLib.ConversationType.PRIVATE) {
                    const conversation = this.context.conversation;
                    // 文件小助手不显示引用按钮
                    const isRobot = conversation.user.type === UserType.ROBOT;
                    return this.isSuccess && !isRobot;
                }
                // 群聊
                if (conversationType === RongIMLib.ConversationType.GROUP) {
                    // 被禁言时不显示引用按钮
                    return this.isSuccess && !this.isBanned;
                }
                return false;
            },
            showMultiSelect() {
                const message = this.message;
                if (this.message.noSupportView) {
                    return false;
                }
                // 有效消息类型检测
                const validMessage = [
                    'TextMessage',
                    'ImageMessage',
                    RongIMClient.MessageType.GIFMessage,
                    'FileMessage',
                    'RichContentMessage',
                    'SightMessage',
                    'CardMessage',
                    'LocationMessage',
                    'VoiceMessage',
                    'VideoSummaryMessage',
                    'RCCombineMessage',
                ].some(type => type === message.messageType);
                if (!validMessage) {
                    return false;
                }
                return this.isSuccess;
            },
            showCollect() {
                const excludeList = [
                    'BQMMEmojiMessage',
                    'BQMMGifMessage',
                    'VideoSummaryMessage',
                    'BQMMGifMessage',
                    'ApprovalMessage',
                    'JrmfRedPacketMessage',
                    'JrmfRedPacketOpenedMessage',
                    'GroupNoticeNotifyMessage',
                    'StickerMessage',
                    // 'PublicServiceRichContentMessage',
                    // 'PublicServiceMultiRichContentMessage',
                    'UnknownMessage',
                    'CardMessage',
                    'ReferenceMessage',
                    'RCBQMM:GifMsg',
                    'BQMMEmojiMessage',
                    'RCCombineMessage',
                    // 39158 - 【麒麟】向好友发送收藏中的动图显示不正确
                    // RongIMClient.MessageType.GIFMessage,
                ];
                const show = excludeList.indexOf(this.message.messageType) < 0;
                return this.isSuccess && show && enableCollect;
            },
        },
        methods: {
            close() {
                this.$emit('close');
            },
            open() {
                this.$emit('open', this.context.message);
            },
            recall() {
                this.$emit('recall', this.context.message);
            },
            copy() {
                this.$emit('copy', this.context.message);
            },
            forward() {
                this.$emit('forward', this.context.message);
            },
            collect() {
                this.$emit('collect', this.context.message);
            },
            remove() {
                this.$emit('remove', this.context.message);
            },
            download() {
                this.$emit('download', this.context.message);
            },
            quote() {
                this.$emit('quote', this.context.message);
            },
            multiSelect() {
                this.$emit('multiSelect', this.context.message);
            },
        },
    };
    return getContextMenuMixins(options);
}

/*
说明： 消息列表改变事件 （收到新消息，获取历史消息时）
功能： 判断是否需要展示消息时间戳
       如果消息列表滚动条在最底部立即清除未读消息
*/
function messageListChanged(context, im) {
    const newMessage = context.messageList.slice(-1)[0] || {};
    newMessage.messageUId = newMessage.messageUId || new Date().getTime();
    const hasNewMessage = context.lastMessage.messageUId !== newMessage.messageUId;
    const fromMe = newMessage.messageDirection === 1;
    context.lastMessage = newMessage;
    if (hasNewMessage && fromMe) {
        context.autoScroll = true;
    }
    // 接收到新消息并且消息列表滚动条在最底部并且会话窗口处于激活状态，清除未读
    if (hasNewMessage && !fromMe && context.autoScroll && !im.hidden) {
        const conversationApi = im.dataModel.Conversation;
        conversationApi.clearUnReadCount(
            context.conversationType,
            context.targetId,
        );
    }
    const otherInterval = 3 * 60 * 1000;
    const myInterval = 5 * 60 * 1000;
    const myAccountId = im.auth.id;
    let oldSentTime;
    context.messageList.forEach((item, index) => {
        const support = supportMessageTypeList.indexOf(item.messageType) >= 0;
        if (!support) {
            item.messageType = 'UnknownMessage';
        }
        if (index === 0) {
            oldSentTime = item.sentTime;
            context.$set(item, '_showTime', true);
            return;
        }

        const interval = item.senderUserId === myAccountId ? myInterval : otherInterval;
        const sentTime = item.sentTime || new Date().getTime();
        if (sentTime - oldSentTime > interval) {
            oldSentTime = item.sentTime;
            context.$set(item, '_showTime', true);
        } else {
            context.$set(item, '_showTime', false);
        }

        let diffTime = new Date().getTime() - item.sentTime;
        const t = 1000 * 2 * 60;
        diffTime = diffTime > 0 ? diffTime - t : -t;
        if (diffTime < 0) {
            context.$set(item, 'isShow', true);
            setTimeout(
                (message) => {
                    message.isShow = false;
                },
                Math.abs(diffTime),
                item,
            );
        }
    });
    if (context.autoScroll) context.scrollToMessage('bottom', false);
}

function created(context) {
    const unwatch = context.$watch('status', (status) => {
        if (status === RongIMLib.ConnectionStatus.CONNECTED) {
            unwatch();
            context.getMessage();
        }
    });
    context.checkAtUnread();
    if (context.conversation.unreadMessageCount > 0) {
        context.$im().dataModel.Conversation.clearUnReadCount(context.conversationType, context.targetId);
    }
    context.getMessage();
}

function getImageMessageList(list) {
    const imageMsgList = list.filter((item) => {
        if (!item.content) {
            return false;
        }
        if (item.messageType === 'LocalImageMessage') {
            item.content.imageUri = Base64Util.concat(item.content.content);
        }
        const url = item.content.imageUri
            || item.content.sightUrl
            || item.content.remoteUrl
            || (item.content.content || {}).imageUri;
        const isImage = item.messageType === 'ImageMessage'
            || item.messageType === 'LocalImageMessage'
            || item.messageType === RongIMLib.RongIMClient.MessageType.GIFMessage;
        const isSight = item.messageType === 'SightMessage';
        const isQuoteimage = item.messageType === 'ReferenceMessage'
            && item.content.objName === 'RC:ImgMsg';
        if (!url && !isImage) {
            return false;
        }
        return isImage || isSight || isQuoteimage;
    });
    return imageMsgList;
}
// 获取下一条未读语音
function getNextUnreadVoice(currentContext, context) {
    const list = currentContext.filtedMessageList;
    const message = context.message;

    let result = null;
    let after = false;
    for (let i = 0, len = list.length; i < len; i += 1) {
        const item = list[i];
        if (after) {
            const RECEIVE = RongIMLib.MessageDirection.RECEIVE;
            const LISTENED = RongIMLib.ReceivedStatus.LISTENED;
            const isReceiver = item.messageDirection === RECEIVE;
            const isVoice = item.messageType === 'VoiceMessage';
            const unListened = item.receivedStatus !== LISTENED;
            if (isReceiver && isVoice && unListened) {
                result = item;
                break;
            }
        } else if (equalMessage(item, message)) {
            after = true;
        }
    }
    return result;
}
/*
说明： 判断传入消息是否为自己发送的最后一条消息
参数：
    @param {object} message     需要判断的消息
    @param {array}  messageList 从此消息列表中匹配
*/
function isLatestSentMessage(message, messageList) {
    const latestSentMessage = getLatestSentMessage(messageList);
    if (!latestSentMessage) {
        return false;
    }
    return equalMessage(latestSentMessage, message);
}
/*
说明： 获取自己发送的最后一条消息
*/
function getLatestSentMessage(list) {
    const sentList = list.filter((item) => {
        const isSend = item.messageDirection === RongIMLib.MessageDirection.SEND;
        const notNotify = [
            'GroupMemChangedNotifyMessage',
            'GroupNotifyMessage',
            'GroupCmdMessage',
            'GroupVerifyNotifyMessage',
        ].indexOf(item.messageType) === -1;
        return isSend && notNotify;
    });
    return sentList[sentList.length - 1];
}

/*
说明： 获取群消息回执未读成员
参数：
    @param {object} group   群组信息
    @param {object} message 群消息回执指定消息（回执详情保存在 消息的 receiptResponse 属性中）
    @param {string} selfId  自己的 id （需要排除自己）
*/
function getUnreadMember(group, message, selfId) {
    let unreadMember = null;
    if (group) {
        const readMember = message.receiptResponse || [];
        const timestamp = message.sentTime;
        const briefMember = group.groupMembers || [];
        unreadMember = briefMember.filter((item) => {
            const valid = item.createDt < timestamp;
            const unread = readMember.indexOf(item.id) === -1;
            const notSelf = selfId !== item.id;
            return valid && unread && notSelf;
        });
    }
    return unreadMember;
}

function uploadUnReadMember(message, unreadMember, im) {
    const userApi = im.dataModel.User;
    const readMember = message.receiptResponse;
    unreadMember = (unreadMember || []).map(item => item.id);
    const arr = unreadMember.concat(readMember);
    userApi.getBatch(arr, (errorCode, userList) => {
        im.$emit(`messageUnRead${message.messageId}`, {
            memberList: userList,
            readIdList: readMember,
        });
    });
}

/*
说明： 获取会话消息 (进入会话第一次获取消息)
*/
function getMessage(context, messageApi) {
    /**
* PC 中断开连接任可获取历史消息。 8, 30010 为重定向 navi 不可用重新获取 navi
* web 中断开连接状态为 RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE 不可继续获取消息
*/
    const validStatus = [
        RongIMLib.ConnectionStatus.CONNECTED,
        RongIMLib.ConnectionStatus.DISCONNECTED,
        8,
        30010,
    ];
    const invalid = validStatus.indexOf(context.status) === -1;
    if (invalid || context.busy) {
        return;
    }
    context.autoScroll = true;
    context.busy = true;

    // 切换会话后加载消息列表，等消息列表滚动后再显示，避免视觉上的抖动
    const $content = $(context.$refs.content);
    $content.css('visibility', 'hidden');
    $content.css('word-wrap', 'break-word');

    const query = context.$route.query;
    const common = context.RongIM.common;
    if (!context.isSearch) {
        messageApi.get(
            {
                conversationType: context.conversationType,
                targetId: context.targetId,
                position: 1,
                timestamp: 0,
            },
            (errorCode, list) => {
                context.busy = false;
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                context.$nextTick(() => {
                    context.realList = list;
                    context.setMessageList(context.realList);
                    context.lastMessage = context.messageList.slice(-1)[0] || {};
                    context.scrollToMessage('bottom', false);
                });
            },
        );
    } else {
        messageApi.getMessageNearList(
            query.messageUId,
            (errorCode, list, msg) => {
                context.busy = false;
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                context.hasMoreLast = true;
                context.setMessageList(list);
                context.lastMessage = context.messageList.slice(-1)[0] || {};
                context.autoScroll = false;
                context.scrollToMessage(msg.messageId);
            },
        );
    }
}

function jumpAtMsg(context, msgUId, messageApi) {
    const validStatus = [
        RongIMLib.ConnectionStatus.CONNECTED,
        RongIMLib.ConnectionStatus.DISCONNECTED,
        8,
        30010,
    ];
    const invalid = validStatus.indexOf(context.status) === -1;
    if (invalid || context.busy) {
        return;
    }
    context.autoScroll = true;
    context.busy = true;
    context.hasMoreLast = true;

    // 切换会话后加载消息列表，等消息列表滚动后再显示，避免视觉上的抖动
    const $content = $(context.$refs.content);
    $content.css('visibility', 'hidden');
    $content.css('word-wrap', 'break-word');

    const common = context.RongIM.common;
    messageApi.getMessageNearList(
        msgUId,
        (errorCode, list, msg) => {
            context.busy = false;
            if (errorCode) {
                common.toastError(errorCode);
                return;
            }
            context.unreadList = list;
            context.setMessageList(context.unreadList);
            context.lastMessage = context.messageList.slice(-1)[0] || {};
            context.autoScroll = false;
            context.scrollToMessage(msg.messageId);
        },
    );
}

function scroll(context, event, isBarMove) {
    context.addAtListener();
    const up = event.deltaY < 0;
    const $content = $(context.$refs.content);
    if ((up || isBarMove) && $content.scrollTop() <= 0) {
        context.getHistory();
        return;
    }
    const bottom = $content.scrollTop() + $content.height() >= $content[0].scrollHeight;
    if (bottom && context.hasMoreLast) {
        // context.isSearch &&
        context.recordTop = $content.scrollTop();
        context.getHistory(true);
        return;
    }
    if (!context.isSearch) {
        const DISTANCE_TO_BOTTOM = 50;
        const autoScroll = $content[0].scrollHeight
            - $content.height()
            - $content.scrollTop()
            < DISTANCE_TO_BOTTOM;
        if (autoScroll) context.clearUnReadCount();
        context.autoScroll = autoScroll;
    }
}

/*
说明： 获取历史消息（向上滚动向下滚动时）
参数：
    @param {object}  context    上下文
    @param {object}  messageApi Message 相关操作 API
    @param {boolean} last       true 获取最新的 （向下滚动获取） false 获取更早的消息 （向上滚动获取）
*/
function getHistory(context, messageApi, last) {
    if (context.busy || !isAvailableData()) {
        return;
    }
    if (last && !context.hasMoreLast) {
        return;
    }

    context.busy = true;
    context.autoScroll = false;
    const firstMessage = context.messageList[0];
    let sentTime = context.messageList.length > 0 ? context.messageList[0].sentTime : 0;
    if (last) {
        sentTime = context.messageList[context.messageList.length - 1].sentTime;
    }
    const params = {
        conversationType: context.conversationType,
        targetId: context.targetId,
        position: 2,
        timestamp: sentTime,
        before: !last,
    };
    messageApi.get(params, (errorCode, list, hasMore) => {
        context.busy = false;
        if (last) {
            context.hasMoreLast = hasMore;
            list.reverse().forEach((item) => {
                context.messageList.push(item);
            });
            if (!hasMore && context.unreadList.length > 0) {
                context.autoScroll = false;
                const key = `${context.conversationType}_${context.targetId}`;
                /* eslint no-underscore-dangle: 0 */
                context.RongIM.dataModel.Message._cache[key] = context.unreadList;
                context.realList = context.RongIM.dataModel.Message._cache[key];
                context.setMessageList(context.realList);
            }
            context.scrollToRecord();
            context.isJump = false;
        } else if (list.length !== 0) {
            list.reverse().forEach((item) => {
                context.messageList.unshift(item);
            });
            if (firstMessage) context.scrollToMessage(firstMessage.messageId);
        }
    });
}

/*
说明： 撤回消息
参数：
    @param {object} message    要撤回的消息
    @param {object} messageApi Message 相关 API
*/
function recall(message, messageApi, common) {
    message.messageUId = String(message.messageUId);
    const time = new Date().getTime() - message.sentTime;
    const isValidTime = time < config.recallMessageTimeout;
    // 目前暂定直接删除，没有UId的消息， 特指敏感词消息。
    if (!message.messageUId) {
        const params = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            messageIds: [message.messageId],
        };
        messageApi.removeLocal(params, () => {
            // 删除成功  搜索跳转的消息不是同一个数据源,需要单独删除
            messageApi.saveRemovedEarliestMessageTime(message);
        });
    } else if (isValidTime) {
        messageApi.recall(message, () => {
            // 撤回成功
            // 通知图片查看器
            if (message.messageType === MessageType.ImageMessage) {
                imageViewer.recall(message.messageUId);
            }
        });
    } else {
        const errMsg = common.getErrorMessage('message-recall-timeout');
        common.messageToast({
            type: 'error',
            message: errMsg,
        });
    }
}

/*
说明： 判断页面是否有选中的区域
*/
function isValidSelect(context, message) {
    const sel = window.getSelection();
    const selText = window.getSelection().toString();
    const hasContextMenu = sel.containsNode(context.$refs.contextmenu.$el);
    let isValid = false;
    const copyContentText = [
        'TextMessage',
        'GroupNoticeNotifyMessage',
        'ReferenceMessage',
    ];
    if (
        copyContentText.indexOf(message.messageType) !== -1
        && selText.length
        && !hasContextMenu
    ) {
        isValid = true;
    }
    return isValid;
}

/*
说明： 右键复制消息
       判断页面是否有选中文字区域有则复制选中区域到剪切板
*/
function copy(context, message) {
    message.content.messageName = message.messageType;
    if (isValidSelect(context, message)) {
        document.execCommand('copy');
    } else {
        let str = JSON.stringify(message.content);
        const type = message.messageType;
        let localPath = '';
        if (type === 'TextMessage') {
            str = message.content.content;
            copyToClipboard(str);
        } else if (type === 'ReferenceMessage') {
            str = message.content.text;
            copyToClipboard(str);
        } else if (type === 'GroupNoticeNotifyMessage') {
            str = groupNoticeFormat(message.content.content, context.locale);
            copyToClipboard(str);
        } else if (type === 'ImageMessage' || type === RongIMClient.MessageType.GIFMessage) {
            localPath = message.localPath;
            clipboard.writePath(localPath);
        } else if (type === 'FileMessage') {
            localPath = message.content.localPath;
            clipboard.writePath(localPath);
        } else {
            copyToClipboard(str);
        }
    }
    context.closeContextmenu();
}

/*
说明： 右键消息转发
*/
function forward(context, message) {
    showForward(message);
    context.closeContextmenu();
}

/*
说明：右键消息收藏
*/
function collect(context, message) {
    let type = message.objectName || message.messageType;

    let searchContent = '';
    if (message.objectName === 'RC:TxtMsg') {
        searchContent = message.content.content;
    } else if (
        message.objectName === 'RC:FileMsg'
        || message.objectName === 'LRC:fileMsg'
    ) {
        searchContent = message.content.name;
    } else if (message.objectName === 'RC:LBSMsg') {
        searchContent = message.content.poi;
    } else if (message.objectName === 'RC:ImgTextMsg') {
        searchContent = message.content.title;
    }
    searchContent += message.user && message.user.name;

    if (type === 'ImageMessage') {
        type = 'RC:ImgMsg';
    }
    if (type === 'LRC:fileMsg') {
        type = 'RC:FileMsg';
    }
    if (message.objectName === 'RC:PSMultiImgTxtMsg') {
        message.content.articles.forEach((article) => {
            const msgContent = {
                messageName: 'RichContentMessage',
                content: article.digest,
                title: article.title,
                imageUri: article.picurl,
                extra: article.extra,
                url: article.url,
            };
            searchContent += msgContent.title;
            type = 'RC:ImgTextMsg';
            addCollect(context, searchContent, message, type, msgContent);
        });
    } else {
        addCollect(context, searchContent, message, type);
    }
}

function addCollect(context, searchContent, message, type, imageTextContent) {
    let sourceType;
    if (+message.conversationType === 1) {
        sourceType = 0;
    } else if (+message.conversationType === 3) {
        sourceType = 1;
        searchContent += context.conversation.group.name;
    } else if (+message.conversationType === 7) {
        sourceType = 3;
    }
    const dataModel = context.$im().dataModel;
    const common = context.RongIM.common;
    const tipObj = {
        message: context.locale.tips.collected,
        callback() { },
        el: context.$el,
    };
    const senderId = message.senderUserId;
    const content = imageTextContent || message.content;
    const targetId = +message.conversationType === 3
        ? message.targetId
        : message.senderUserId;
    const contentId = message.messageUId;

    let params = {
        scope: 'message',
        type,
        search_content: searchContent,
        fav_content: {
            sender_id: senderId,
            source_type: sourceType,
            target_id: targetId,
            content_id: contentId,
            url: content.imageUri || content.remoteUrl,
            content: JSON.stringify(content),
        },
    };

    dataModel.Collect.add(params, (errorCode, result) => {
        if (errorCode) {
            common.toastError('collect-failed');
            context.closeContextmenu();
            return;
        }
        if (result) {
            common.messageToast(tipObj);
            context.closeContextmenu();
            const typeList = dataModel.Collect.typeList;
            if (typeList.length === 0) {
                params = {
                    version: -1,
                    scope: 'message',
                };
                dataModel.Collect.getList(params, (errcode, results) => {
                    if (!errcode) {
                        const arr = results.map(item => item.objectName);
                        dataModel.Collect.typeList = arr.filter(
                            (x, index, self) => self.indexOf(x) === index,
                        );
                    }
                });
            } else {
                const iType = type || message.type;
                if (typeList.indexOf(iType) === -1) {
                    typeList.push(iType);
                }
            }
        }
    });
}

/*
说明： 右键删除消息
*/
function remove(context, message, messageApi) {
    // 上传文件消息删除时取消上传
    const isUploadFileMessage = [
        'LocalFileMessage',
        'LocalImageMessage',
        'FileMessage',
        'SightMessage',
        'ImageMessage',
        RongIMLib.RongIMClient.MessageType.GIFMessage,
    ].indexOf(message.messageType) > -1 && $.isFunction(message.cancel);
    if (isUploadFileMessage) {
        message.cancel();
    }

    if (message.messageId) {
        const params = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            messageIds: [message.messageId],
        };
        messageApi.removeLocal(params, () => {
            // 删除成功  搜索跳转的消息不是同一个数据源,需要单独删除
            spliceMessage(context.messageList, message.messageId);
            messageApi.saveRemovedEarliestMessageTime(message);
        });
    } else if (message.messageUId && message.objectName === 'LRC:fileMsg') {
        spliceMessage(context.messageList, message.messageUId);
    } else {
        console.log('没有 messageId web 端不支持删除');
    }
    context.closeContextmenu();
}

/*
说明： 根据 messageId 删除缓存中对应消息
参数：
    @param {array}  cacheList 缓存消息列表
    @param {string} messageId 消息 messageId
*/
function spliceMessage(cacheList, messageId) {
    if (!cacheList) {
        return;
    }
    let index = null;
    for (let i = 0, len = cacheList.length; i < len; i += 1) {
        const cacheMsg = cacheList[i];
        if (
            cacheMsg.messageId === messageId
            || cacheMsg.messageUId === messageId
        ) {
            index = i;
        }
    }

    if (index === null) {
        return;
    }
    cacheList.splice(index, 1);
}

function clearUnReadCount(context, conversationApi, conversation) {
    if (conversation.unreadMessageCount > 0) {
        conversationApi.clearUnReadCount(
            context.conversationType,
            context.targetId,
        );
    }
}

/*
说明： 新消息提示，点击时消息列表滚动到最底部
*/
function scrollToNewMessage(context, unreadMessageCount) {
    context.clearUnReadCount();
    if (context.isSearch) {
        context.$router.push({
            name: 'conversation',
            params: {
                targetId: context.targetId,
                conversationType: context.conversationType,
            },
        });
    } else {
        context.setMessageList(context.realList);
        const index = context.messageList.length - unreadMessageCount;
        const messageId = context.messageList[index].messageId;
        context.scrollToMessage(messageId);
        context.autoScroll = true;
        context.isJump = false;
    }
}

/*
说明： 重新发送消息(消息发送失败重发)
参数：
    @param {object} api         包含 File 和 Message 的 API
    @param {object} message     需要重发的消息
    @param {object} context     发送消息失败不在群组中时通知上层组件
*/
function reSendMessage(api, message, context) {
    const content = reMessage(message, api, context);
    if (isEmpty(content)) {
        // utils.console.log('此消息暂不支持重发:', message);
        return;
    }
    /**
* 38713 - 【群禁言】禁言的群拖拽文件或图片应不能发送
* If messageType == FileMessage then call reSendLocalFile
*/
    if (message.messageType === 'FileMessage' || message.messageType === 'ImageMessage'
        || message.messageType === RongIMClient.MessageType.GIFMessage) {
        reSendLocalFile(context, message, api);
    } else if(message.messageType === 'CardMessage') {
        const messageApi = api.message;
        const conversationType = message.conversationType;
        const targetId = message.targetId;
        let params = {};
        // 删除原来消息
        params = {
            targetId: message.targetId,
            conversationType: message.conversationType,
        };
        params.messageIds = [message.messageId];
        messageApi.removeLocal(params, () => {
            messageApi.saveRemovedEarliestMessageTime(message);
        });

        // 重新上传
        params = {
            conversationType,
            targetId,
            user: content,
            mentiondMsg: !isEmpty(content.mentionedInfo),
        };
    
        messageApi.sendCard(params, (errcode) => {
            if (errcode) {
                const errMsg = common.getErrorMessage(errcode);
                if (errcode === `lib-${RongIMLib.ErrorCode.NOT_IN_GROUP}`) {
                    const notificationMsg = createNotificationMessage(
                        message.conversationType,
                        message.targetId,
                        errMsg,
                    );
                    messageApi.insertMessage(notificationMsg);
                    context.$emit('setInGroup', false);
                }
            }
        });
    } else {
        const messageApi = api.message;
        const params = {
            notNotify: true,
            targetId: message.targetId,
            conversationType: message.conversationType,
        };
        params.messageIds = [message.messageId];
        messageApi.removeLocal(params, () => {
            messageApi.saveRemovedEarliestMessageTime(message);
        });
        const common = context.RongIM.common;
        messageApi.send(
            {
                conversationType: message.conversationType,
                targetId: message.targetId,
                content,
                mentiondMsg: !isEmpty(content.mentionedInfo),
            },
            (errcode) => {
                if (errcode) {
                    const errMsg = common.getErrorMessage(errcode);
                    if (errcode === `lib-${RongIMLib.ErrorCode.NOT_IN_GROUP}`) {
                        const notificationMsg = createNotificationMessage(
                            message.conversationType,
                            message.targetId,
                            errMsg,
                        );
                        messageApi.insertMessage(notificationMsg);
                        context.$emit('setInGroup', false);
                    }
                }
            },
        );
    }
}

/*
说明： 重发消息
功能： 不同消息类型重发操作不同
       文本消息直接重新发送文本
       图片消息判断是否已上传成功未上传成功需要先上传再发送
       文件消息和图片消息一样需要先判断是否上传成功
*/
function reMessage(message, api, context) {
    let msg = null;
    const isValidUrl = url => url.indexOf('http') > -1;
    let url;
    const dataModel = context.$im().dataModel;

    switch (message.messageType) {
    case 'TextMessage':
        msg = new dataModel.Message.TextMessage(message.content);
        break;
    case 'ImageMessage':
        url = message.content.imageUri;
        if (url && isValidUrl(url)) {
            msg = new dataModel.Message.ImageMessage(message.content);
        } else if (typeof message.data === 'string') {
            uploadBase64(message, context, dataModel);
        } else {
            message.content.localPath = message.data.path;
            reSendLocalFile(context, message, api);
        }
        break;
    case RongIMClient.MessageType.GIFMessage:
        url = message.content.remoteUrl;
        if (url && isValidUrl(url)) {
            msg = buildMessage.GIFMessage(message.content);
        } else {
            message.content.localPath = message.data.path;
            reSendLocalFile(context, message, api);
        }
        break;
    case 'LocalImageMessage':
        reSendLocalFile(context, message, api);
        break;
    case 'FileMessage':
        url = message.content.fileUrl;
        if (url && isValidUrl(url)) {
            msg = new dataModel.Message.FileMessage(message.content);
        } else {
            reSendLocalFile(context, message, api);
        }
        break;
    case 'SightMessage':
        msg = api.message.create({
            messageType: message.content.messageName,
            content: message.content,
        });
        break;
    case 'LocalFileMessage':
        reSendLocalFile(context, message, api);
        break;
    case 'RCCombineMessage':
        msg = api.message.create({
            messageType: message.messageType,
            content: message.content,
        });
        break;
    case 'ReferenceMessage':
        msg = api.message.create({
            messageType: message.messageType,
            content: message.content,
        });
        break;
    default:
        $.noop();
        break;
    }
    return msg;
}

/*
说明： 消息发送失败，文件为上传成功时重新上传
*/
function reSendLocalFile(context, message, api) {
    const path = message.content.localPath || message.localPath;
    // var uploadFile = file.getBlobByPath(path);
    const uploadFile = file.getBlobs([path])[0];

    const messageApi = api.message;
    let params = {};
    if (uploadFile) {
        // 删除原来消息
        params = {
            targetId: message.targetId,
            conversationType: message.conversationType,
        };
        params.messageIds = [message.messageId];
        messageApi.removeLocal(params, () => {
            messageApi.saveRemovedEarliestMessageTime(message);
        });

        // 重新上传
        params = {
            targetId: message.targetId,
            conversationType: message.conversationType,
            data: uploadFile,
            localPath: path,
        };
        const conf = config.upload.file;
        api.file.createUploadMessage(params, (uploadMessage) => {
            uploadMessage.content.localPath = path;
            upload(context, uploadMessage, conf, api);
        });
    } else {
        const type = message.conversationType;
        const id = message.targetId;
        const fileUnexist = context.locale.tips.fileUnexist;
        params = createNotificationMessage(type, id, fileUnexist);
        messageApi.insertMessage(params);
    }
}

/*
说明： 上传 base64 图片消息
*/
function uploadBase64(message, context, dataModel) {
    const base64Str = message.data;
    const fileApi = dataModel.File;
    const messageApi = dataModel.Message;
    const common = context.RongIM.common;

    const base64Config = $.extend({}, config.upload.base64);
    const size = getBase64Size(base64Str);
    const base64Size = base64Config.size;
    if (size > base64Size) {
        const tip = templateFormat(
            context.locale.components.messageInput.screenshotMaxSize,
            `${parseInt(base64Size / 1024)}KB`,
        );
        common.messageToast({
            type: 'error',
            message: tip,
        });
        return;
    }
    // 删除原消息
    messageApi.removeLocal(
        {
            targetId: message.targetId,
            conversationType: message.conversationType,
            messageIds: [message.messageId],
        },
        () => {
            messageApi.saveRemovedEarliestMessageTime(message);
        },
    );
    // 重新上传
    const params = {
        targetId: message.targetId,
        conversationType: message.conversationType,
        data: base64Str,
    };
    fileApi.createUploadMessage(params, (uploadMessage) => {
        base64Config.data = UploadClient.dataType.data;
        const api = {
            file: fileApi,
            message: messageApi,
        };
        upload(context, uploadMessage, base64Config, api);
    });
}

/*
说明： 上传
*/
function upload(context, uploadMessage, conf, api) {
    const fileApi = api.file;
    const messageApi = api.message;
    const common = context.RongIM.common;
    const im = context.$im();
    fileApi.upload(uploadMessage, conf, (errorCode, _uploadMessage, data) => {
        if (errorCode) {
            return;
        }
        fileApi.addFileUrl(_uploadMessage, data, (error, message) => {
            fileApi.send(message, (err, msg) => {
                if (err) {
                    const errMsg = common.getErrorMessage(err);
                    if (err === RongIMLib.ErrorCode.NOT_IN_GROUP) {
                        const params = createNotificationMessage(
                            msg.conversationType,
                            msg.targetId,
                            errMsg,
                        );
                        messageApi.insertMessage(params);
                        context.$emit('setInGroup', false);
                    }
                } else {
                    im.$emit('messagechange');
                    im.$emit('sendMessage');
                }
            });
        });
    });
}

function getFileExists(fileUrl) {
    let existed = false;
    if (!isEmpty(fileUrl)) {
        existed = file.checkExist(fileUrl);
    }
    return existed;
}

function openFolder(message, context) {
    const localUrl = message.content.localPath;
    const url = localUrl || message.content.fileUrl;
    const localPath = file.checkExist(url);
    if (localPath) {
        file.openDir(localUrl);
    } else {
        context.RongIM.common.toastError('file-404');
    }
}

function isInSight(el, context) {
    const $content = context.$refs.content;
    let top = 36;
    if (system.platform === 'win32') {
        top = 76;
    }
    if (el.getBoundingClientRect().top >= top && el.getBoundingClientRect().top < $content.offsetHeight + top - 40) {
        return true;
    }
    return false;
}

function addSelectedMessage(context, messageId, item) {
    const avatarNode = document.querySelector(`div[id='${messageId}'] > .rong-avatar > .rong-avatar-item`);
    if (item.user.avatar === '') {
        domtoimage.toPng(avatarNode)
            .then((dataUrl) => {
                item.user.baseAvatar = dataUrl;
                context.selectedMessages.push(item);
                context.selectedMessageCount += 1;
            })
            .catch((error) => {
                console.error('oops, something went wrong!', error);
            });
    } else {
        context.selectedMessages.push(item);
        context.selectedMessageCount += 1;
    }
    if (item.messageType === 'FileMessage') {
        const fileIconNode = document.querySelector(`div[id='${messageId}'] > .rong-filemessage > .rong-message-bd > .rong-file > .rong-file-inner > .rong-file-icon`);
        domtoimage.toPng(fileIconNode)
            .then((dataUrl) => {
                item.content.fileIcon = dataUrl;
            })
            .catch((error) => {
                console.error('oops, something went wrong!', error);
            });
    }
}
