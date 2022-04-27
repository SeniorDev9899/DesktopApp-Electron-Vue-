<template>
  <div
    @click="showConversaton"
    @contextmenu.prevent="showContextmenu"
    :class="[
      conItem.isSelected && 'rong-selected',
      conItem.isTop && 'rong-conversation-top',
      'rong-resize-' + resizeDirection,
    ]"
    class="rong-conversation-item rong-clearfix"
    :id="conItem.viewId"
    v-show="
      conItem.latestMessage &&
      conItem.latestMessage.messageType !== 'UnknownMessage'
    "
    @dragover="dragOverItem"
    @drop="dropItem"
  >
    <!-- 会话列表item -->
    <div class="rong-conversation-aside">
      <avatar
        v-if="conItem.group"
        :group="conItem.group"
        class="rong-avatar-middle"
      ></avatar>
      <avatar
        v-else-if="conItem.user"
        :user="conItem.user"
        class="rong-avatar-middle"
      ></avatar>
      <avatar v-else class="rong-avatar-middle"></avatar>
      <span
        v-if="conItem.unreadMessageCount > 0"
        class="rong-message-count"
        :class="{
          'rong-conversation-mute': conItem.notificationStatus,
        }"
      >
        <em
          v-if="!conItem.notificationStatus"
          :class="{
            'rong-message-more': conItem.unreadMessageCount > 999,
          }"
        >
          <template v-if="conItem.unreadMessageCount < 99">{{
            conItem.unreadMessageCount
          }}</template>
          <template v-else-if="conItem.unreadMessageCount < 999">99+</template>
          <template v-else>...</template>
        </em>
      </span>
    </div>
    <div class="rong-item-main">
      <div v-if="conItem.latestMessage" class="rong-conversation-time">
        {{ sentTime }}
      </div>
      <div
        class="rong-conversation-name"
        :class="isShowGroupType ? 'rong-conversation-grouptype' : ''"
        :style="{ 'margin-right': timeRenderWidth + 'px' }"
      >
        <em
          v-if="isGroup"
          :class="{ 'rong-item-cover-name': isGroupNameCover }"
          v-html="getHtmlGroupName"
        ></em>
        <em
          v-else-if="isPrivate"
          :class="{ 'rong-item-cover-name': isUserNameCover }"
          v-html="htmlUsername"
        ></em>
        <em
          v-else-if="isSystem"
          :class="{ 'rong-item-cover-name': isUserNameCover }"
          v-html="htmlUsername"
        ></em>
        <span v-if="isShowGroupType" class="rong-tag">{{ groupType }}</span>
      </div>
      <span
        v-if="conItem.notificationStatus"
        class="rong-conversation-mute-icon"
        :title="locale.conversation.mute"
      ></span>
      <div
        v-if="conItem.latestMessage"
        class="rong-conversation-message"
        :class="[
          'rong-list-' + messageType,
          'rong-list-' + sentStatus || recievedStatus,
        ]"
      >
        <div
          class="rong-conversation-message-bd"
          :class="[isRichText ? 'rong-richtext' : 'rong-simpletext']"
        >
          <span
            v-if="!conItem.isSelected && conItem.draft && conItem.draft.content"
            class="rong-draft"
          >
            <label>[{{ locale.conversation.draft }}]</label>
            <em v-html="convertMessage"></em>
          </span>
          <template v-else>
            <span v-if="isCanceled"></span>
            <i
              v-else-if="isFailed"
              class="rong-conversation-fail"
              :title="locale.conversation.messageSentFail"
            ></i>
            <i v-else-if="isSending" class="rong-conversation-sending"></i>

            <span v-else-if="isInvalid"></span>
            <span v-else-if="showSentStatus" class="rong-sentstatus">
              <template v-if="isOtherRead"
                >[{{ locale.message.read }}]</template
              >
              <template v-else>[{{ locale.message.unread }}]</template>
            </span>
            <span v-if="mentionMsgHasSelf" class="rong-conversation-at">
              [{{ locale.conversation.atme }}]
            </span>
            <span v-if="isShowName" class="rong-conversation-username">
              <span v-if="isGroup"  v-html="htmlGroupUsername"></span>
              <span v-else v-html="htmlUsernameLatestMsg"></span>:
            </span>
            <latest-message
              :message="conItem.latestMessage"
              :conversation="conItem"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dateFormat from '../../utils/dateFormat';
import getLocaleMixins from '../../utils/getLocaleMixins';
import getGroupName from '../../common/getGroupName';
import isEmojiOverlap from '../../utils/isEmojiOverlap';
import isCanceled from '../../common/isCanceled';
import MessageType from '../../utils/MessageType';
import isEmpty from '../../utils/isEmpty';
import avatar from '../avatar.vue';
import getLatestMessage from './latest-message.vue';

export default {
    name: 'ConversationItem',
    props: {
    // 会话item
        conItem: {
            type: Object,
            default: () => ({}),
        },
        resizeDirection: {
            type: String,
            default: () => ({}),
        },
    },
    data() {
        const im = this.$im();
        return {
            auth: im.auth,
            // 群组中最新消息的用户名字
            htmlGroupUsername: '',
        };
    },
    mixins: [getLocaleMixins('conversation-list')],
    components: {
        avatar,
        'latest-message': getLatestMessage,
    },
    computed: {
        // 发送时间
        sentTime() {
            return this.dateFormat(this.conItem.latestMessage.sentTime);
        },
        // 是否显示群组
        isShowGroupType() {
            if (this.conItem.group) {
                return this.conItem.group && +this.conItem.group.type !== 0;
            }
            return false;
        },
        // 绘制 UI 使用， 获取会话列表最后一条消息时间的字符串在页面渲染的宽度（为保证会话名称最大长度展示）
        timeRenderWidth() {
            if (this.conItem.latestMessage) {
                const fontSize = 12;
                const timeString = this.dateFormat(this.conItem.latestMessage.sentTime);
                return this.RongIM.common.getTextRenderWidth(timeString, fontSize);
            }
            return '';
        },
        // 是否是群组
        isGroup() {
            return this.conItem.conversationType === 3;
        },
        isGroupNameCover() {
            if (this.conItem.group) {
                const name = this.getGroupName(this.conItem.group);
                return this.isCoverName(name);
            }
            return '';
        },
        getHtmlGroupName() {
            return this.RongIM.common.getHtmlGroupName(
                this.conItem.group,
                17,
                this.conItem.targetId,
            );
        },
        // 是否是私聊
        isPrivate() {
            return (
                this.conItem.conversationType === 1
        || this.conItem.conversationType === 7
            );
        },
        isSystem() {
            return this.conItem.conversationType === 6;
        },
        isUserNameCover() {
            if (this.conItem.user) {
                const name = this.RongIM.common.getUsername(this.conItem.user);
                return this.isCoverName(name);
            }
            return false;
        },
        groupType() {
            return this.RongIM.common.getGroupType(this.conItem.group.type);
        },
        htmlUsername() {
            return this.RongIM.common.getHtmlUsername(
                this.conItem.user,
                17,
                this.conItem.targetId,
            );
        },
        // 消息类型
        messageType() {
            if (
                this.conItem.latestMessage
        && this.conItem.latestMessage.messageType
            ) {
                return (this.conItem.latestMessage.messageType || '').toLowerCase();
            }
            return '';
        },
        sentStatus() {
            if (this.conItem.latestMessage) {
                const sentStatus = RongIMLib.SentStatus[this.conItem.latestMessage.sentStatus] || '';
                return sentStatus.toLowerCase();
            }
            return '';
        },
        // 接收状态
        recievedStatus() {
            if (this.conItem.latestMessage) {
                const status = RongIMLib.ReceivedStatus[this.conItem.latestMessage.receivedStatus]
          || '';
                return status.toLowerCase();
            }
            return '';
        },
        // 最后一条消息展示样式
        isRichText() {
            if (!this.conItem.latestMessage) {
                return false;
            }

            if (this.conItem.latestMessage.messageType !== 'TextMessage') {
                return false;
            }

            const common = this.RongIM.common;
            const textContent = this.conItem.latestMessage.content.content;
            const content = common.convertMessage(textContent);
            return textContent !== content;
        },
        convertMessage() {
            if (this.conItem.draft && this.conItem.draft.content) {
                return this.RongIM.common.convertMessage(this.conItem.draft.content);
            }
        },
        isCanceled() {
            if (this.conItem.latestMessage) {
                return this.getIsCanceled(this.conItem.latestMessage);
            }
            return false;
        },
        // 失败状态
        isFailed() {
            if (this.conItem.latestMessage) {
                return (
                    this.conItem.latestMessage.sentStatus === RongIMLib.SentStatus.FAILED
                );
            }
        },
        // 发送状态
        isSending() {
            if (this.conItem.latestMessage) {
                return (
                    this.conItem.latestMessage.sentStatus === RongIMLib.SentStatus.SENDING
                );
            }
        },
        // 是否是无效消息,比如历史消息全部删除后会有一条 messageId=-1 的消息
        isInvalid() {
            if (this.conItem.latestMessage) {
                return this.conItem.latestMessage.messageId === -1;
            }
        },
        // 是否显示消息状态："已读" "未读"
        showSentStatus() {
            if (!this.conItem.latestMessage) {
                return;
            }
            const message = this.conItem.latestMessage;
            const conversation = this.conItem;

            const isPrivate = this.getIsPrivate(message);
            const isFromMe = this.getIsFromMe(message);
            const messageTypes = [
                MessageType.TextMessage,
                MessageType.ImageMessage,
                MessageType.FileMessage,
                MessageType.VoiceMessage,
                MessageType.CardMessage,
                MessageType.LocationMessage,
                MessageType.ReferenceMessage,
            ];
            const existed = messageTypes.indexOf(message.messageType) >= 0;
            const user = conversation.user;
            const isNotFileHelper = user && user.type !== 3;
            const isPublic = message.conversationType === 7;
            return isPrivate && isFromMe && existed && isNotFileHelper && !isPublic;
        },
        // 消息状态 "已读" "未读"
        isOtherRead() {
            if (this.conItem.latestMessage) {
                if (isEmpty(this.conItem.latestMessage.sentStatus)) {
                    // web 不支持存储消息状态默认置为已读
                    this.conItem.latestMessage.sentStatus = RongIMLib.SentStatus.READ;
                }
                return (
                    this.conItem.latestMessage.sentStatus === RongIMLib.SentStatus.READ
                );
            }
        },
        // 判断 '@' 消息中是否包含自己
        mentionMsgHasSelf() {
            const conversation = this.conItem;

            if (!conversation.latestMessage || !conversation.latestMessage.content) {
                return false;
            }
            // 39891 - 【@人变色】pc端会话列表未显示有人@我红色字体提示信息
            const mentionedInfo = conversation.latestMessage.content.mentionedInfo;

            // 判读这条@消息是谁发的如果是自己发的则不显示，暂用有无未读消息
            const hasUnRead = conversation.unreadMessageCount !== 0;
            if ($.isEmptyObject(mentionedInfo)) {
                return false;
            }

            if (mentionedInfo.type === RongIMLib.MentionedType.ALL) {
                return hasUnRead;
            }
            const userIdList = mentionedInfo.userIdList;
            return userIdList.indexOf(this.$im().auth.id) !== -1 && hasUnRead;
        },
        // 是否显示名字
        isShowName() {
            const conversation = this.conItem;

            const groupType = RongIMLib.ConversationType.GROUP;
            const isGroup = conversation.conversationType === groupType;

            // SDK消息未解析 messageType 为 undefined 此处要判断
            let isNotificationMessage = true;
            const notNotificationMessages = [
                'InformationNotificationMessage',
                'JrmfRedPacketOpenedMessage',
                'JrmfRedPacketMessage',
                'GroupMemChangedNotifyMessage',
                'GroupNotifyMessage',
                'GroupCmdMessage',
            ];
            const messageType = conversation.latestMessage.messageType;
            if (!isEmpty(messageType)) {
                isNotificationMessage = notNotificationMessages.indexOf(messageType) !== -1;
            }
            const user = conversation.latestMessage.user || {};
            const isOther = this.auth.id !== user.id;
            const username = !isEmpty(this.RongIM.common.getUsername(user));
            const notReCall = messageType !== 'RecallCommandMessage';
            const isShow = isGroup && !isNotificationMessage && isOther && username && notReCall;
            return isShow;
        },
        htmlUsernameLatestMsg() {
            if (!this.conItem.latestMessage) {
                return '';
            }
            if (!this.conItem.latestMessage.user) {
                return '';
            }
            return this.RongIM.common.getHtmlUsername(
                this.conItem.latestMessage.user,
                16,
            );
        },
    },
    watch: {
       // 实时更新最新一条消息发送人名称
       conItem: {
         deep: true,
         handler() {
           if(this.conItem  && this.isGroup && this.conItem.latestMessage) {
              this.getHtmlGroupUsername([this.conItem.latestMessage.user, this.conItem.group.id, 16])
           }
         }
       }
    },
    methods: {
        dateFormat,
        getGroupName,
        getIsCanceled: isCanceled,
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
        getIsFromMe(message) {
            return message.messageDirection === 1;
        },
        getIsPrivate(item) {
            return item.conversationType === 1 || item.conversationType === 7;
        },
        getHtmlGroupUsername(args) {
            this.RongIM.common.getHtmlGroupUsernameAsync(args, (res) => {
                this.htmlGroupUsername = res
            });
        },
        // 暴露的事件
        showConversaton() {
            this.$emit('showConversaton', this.conItem);
        },
        showContextmenu(e) {
            this.$emit('showContextmenu', e, { conversation: this.conItem });
        },
        dragOverItem(e) {
            this.$emit('dragOverItem', e, this.conItem);
        },
        dropItem(e) {
            this.$emit('dropItem', e, this.conItem);
        },
    },
    beforeUpdate() {
        console.log('这个组件ConversationItem要更新了----------------------', this.conItem.targetId);
    },
};
</script>
