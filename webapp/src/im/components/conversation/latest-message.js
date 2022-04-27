import localeConf from '../../locale';
import templateFormat from '../../utils/templateFormat';
import getLocaleMixins from '../../utils/getLocaleMixins';
import htmlLang from '../../utils/htmlLang';
import isEmpty from '../../utils/isEmpty';
import getCombineMessageTitle from '../../utils/getCombineMessageTitle';
import config from '../../config';
import system from '../../system';
import latestGroupNoticeFormat from '../../common/latestGroupNoticeFormat';
import groupSummaryFormat from '../../common/groupSummaryFormat';

/*
说明： 最后一条消息(会话列表显示的最后一条消息)
功能： 对各类消息进行格式化，展示为一行文本。
       如： 图片消息 => [图片]
            文件消息 => [文件] 文件名称
*/
export default {
    name: 'latest-message',
    props: ['message', 'conversation'],
    mixins: [getLocaleMixins('latest-message')],
    data() {
        const im = this.$im();
        const convertLatestMessage = getConvertLatestMessage(im, this);
        return {
            convertLatestMessage,
        };
    },
    computed: {
        authId() {
            return this.$im().auth.id;
        },
        // 是否是无效消息,比如历史消息全部删除后会有一条 messageId=-1 的消息
        isInvalid() {
            return this.message.messageId === -1;
        },
        // 是否支持显示此类型消息
        isSupport() {
            const message = this.message;
            const content = !isEmpty(this.convertLatestMessage[message.messageType]);
            const prefix = !isEmpty(this.prefix);
            return prefix || content;
        },
        /*
            消息前缀
                文本消息 => ''
                图片消息 => '[图片]'
                文件消息 => '[文件]'
                图文消息 => '[图文]'
                ...
            */
        prefix() {
            const message = this.message;
            let val = this.locale.message.prefix[message.messageType] || '';
            if (message.messageType === 'ApprovalMessage' && val) {
                val = `<em>${val}</em>`;
            }
            return val;
        },
        /*
            最终展示内容
                消息前缀 + ' ' +
            */
        content() {
            const message = this.message;
            const convert = this.convertLatestMessage[message.messageType] || $.noop;
            const content = convert(message, this.authId, this.conversation) || '';
            return `${this.prefix} ${content}`;
        },
        platform() {
            return system.platform;
        },
    },
};

function getHtmlUsername(user, groupId, common) {
    return common.getHtmlGroupUsername(user, groupId, 16);
}

/*
说明：  消息内容 (“最后一条消息”消息内容转换)
            文本消息 => '文本内容'
            图片消息 => ''
            文件消息 => '文件名称'
            图文消息 => '图文标题'
            ...
*/
function getConvertLatestMessage(im, context) {
    const common = im.RongIM.common;
    const auth = im.auth;
    const userAPI = im.dataModel.User;
    const locale = config.currentLocale();
    return {
        TextMessage(message) {
            const textMessage = message.content;
            let content = textMessage.content;
            content = htmlLang.check(content);
            return common.convertMessage(content);
        },
        FileMessage(message) {
            return message.content.name;
        },
        RCCombineMessage(message) {
            const nameList = message.content.nameList;
            const conversationType = message.content.conversationType;
            let combinetitle = '';
            combinetitle = getCombineMessageTitle(context, nameList, conversationType);
            return combinetitle;
        },
        LocalFileMessage(message) {
            return message.content.name;
        },
        CardMessage(message) {
            const fromMe = message.messageDirection === 1;
            const name = message.content.name;
            let text = locale.message.cardOther;
            if (fromMe) {
                text = locale.message.cardSelf;
            }
            return templateFormat(text, name);
        },
        GroupMemChangedNotifyMessage(message, authId, conversation) {
            const isMe = auth.id;
            const group = conversation.group;
            // 操作行为类型
            const messageAction = message.content.action;
            // 群组减员通知：3，被移除；4，主动退出
            if (messageAction === 3 || messageAction === 4) {
                // 非操作者，后台操作时，操作者 id 为群主
                const isNotOperatorUser = message.content.operatorUser.id !== isMe;
                // 非被操作者
                const isNotTargetUsers = !message.content.targetUsers.some(item => item.id === isMe);
                const isManager = group.admin_id === isMe;
                // 无关消息，不显示
                if (isNotOperatorUser && isNotTargetUsers && !isManager) {
                    return '';
                }
                // 群组减员消息，只通知群主和被减员人，且群必须为自建群，部门群等不通知
                if ((!isManager || group.type !== 0) && isNotTargetUsers) {
                    return '';
                }
            }
            return common.getGroupNotification(message, authId);
        },
        GroupNotifyMessage(message, authId) {
            return common.getGroupNotification(message, authId);
        },
        GroupCmdMessage(message, authId) {
            return common.getGroupNotification(message, authId);
        },
        InformationNotificationMessage(message) {
            const content = message.content.message;
            if (content.messageName === 'ContactNotifyMessage') {
                return common.getContactNotification(content, auth.id);
            }
            const enDesc = localeConf.en.components.getFileHelper.desc;
            const zhDesc = localeConf.zh.components.getFileHelper.desc;
            const isFhMessage = content === enDesc || content === zhDesc;
            if (isFhMessage) {
                return locale.components.getFileHelper.desc;
            }
            return content;
        },
        RecallCommandMessage(message, authId, conversation) {
            const isMe = message.senderUserId === authId;
            let name = conversation.user && conversation.user.name;
            if (conversation.conversationType === RongIMLib.ConversationType.GROUP) {
                if (conversation.latestMessage.user) {
                    name = getHtmlUsername(conversation.latestMessage.user, conversation.group.id, common);
                } else {
                    // 解决 web 端收到消息撤回时，最后一条消息显示错误问题
                    userAPI.get(conversation.latestMessage.senderUserId, (errorCode, user) => {
                        if (errorCode) {
                            console.warn(errorCode);
                            return;
                        }
                        name = user.name;
                        name = getHtmlUsername(user, conversation.group.id, common);
                    });
                }
            }
            let result = templateFormat(locale.message.recallOther, name);
            if (message.content && message.content.isAdmin) {
                return locale.message.recallAdmin;
            }
            if (isMe) {
                result = locale.message.recallSelf;
            }
            return result;
        },
        ContactNotifyMessage(message) {
            return common.getContactNotification(message.content, auth.id);
        },
        ApprovalMessage(message) {
            return message.content.content;
        },
        GroupNoticeNotifyMessage(message) {
            const content = message.content.content;
            return latestGroupNoticeFormat(content, locale);
        },
        JrmfRedPacketMessage(message) {
            return common.getJrmfRedPacket(message);
        },
        JrmfRedPacketOpenedMessage(message) {
            return common.getJrmfRedPacketOpened(message, auth.id);
        },
        PublicServiceRichContentMessage(message) {
            const content = message.content;
            if (!content) {
                return '';
            }
            let articles = content.articles;
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessage && content.richContentMessage.articles) {
                articles = content.richContentMessage.articles;
            }
            return articles && articles.length > 0 ? articles[0].title : '';
        },
        PublicServiceMultiRichContentMessage(message) {
            const content = message.content;
            if (!content) {
                return '';
            }
            let articles = content.articles;
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessages && content.richContentMessages.articles) {
                articles = content.richContentMessages.articles;
            }
            return articles && articles.length > 0 ? articles[0].title : '';
        },
        VideoSummaryMessage(message) {
            const isGroup = message.conversationType === RongIMLib.ConversationType.GROUP;
            if (isGroup) {
                return groupSummaryFormat(message.content, locale);
            }
            const isVideo = message.content.mediaType === 2;
            if (isVideo) {
                return locale.message.prefix.VideoMessage;
            }
            return locale.message.prefix.AudioMessage;
        },
        ReferenceMessage(message) {
            let content = message.content.text;
            content = htmlLang.check(content);
            return common.convertMessage(content);
        },
        RealTimeLocationStartMessage() {
            return '';
        },
        RequestFriendVerificationMessage() {
            return locale.message.requestFriendVerification;
        },
    };
}
