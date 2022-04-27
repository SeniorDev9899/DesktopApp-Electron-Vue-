<template>
  <div class="rong-component">
    <div
      ref="content"
      class="rong-conversation-content"
      @mousewheel="scroll($event)"
      @wheel="scroll($event)"
      @click="clearUnReadCount"
      @drop="dropMessage()"
      v-rong-scroll-bar-y="scrollBarMove"
      v-watermark
    >
      <div v-if="busy" class="rong-loading">
        <span>{{ locale.tips.loading }}</span>
      </div>
      <div v-if="isFileHelper" class="rong-conversation-tip">
        {{ locale.components.getFileHelper.prompt }}
      </div>
      <div
        v-for="(item, index) in filtedMessageList"
        :id="item.showId"
        :key="item.showId"
      >
        <div
          v-if="item._showTime"
          class="rong-conversation-tip rong-disable-select"
          :data-senttime="item.sentTime"
        >
          {{ item.sentTime | dateFormat }}
        </div>
        <div v-if="isGroupNotificationMessage(item)" class="rong-conversation-tip">
          {{ getGroupNotification(item) }}
        </div>
        <div
          v-else-if="item.messageType === 'ContactNotifyMessage'"
          class="rong-conversation-tip"
        >
          {{ getContactNotification(item) }}
        </div>
        <div
          v-else-if="item.messageType === 'InformationNotificationMessage'"
          class="rong-conversation-tip"
        >
          {{ getInformationNotificationMessage(item) }}
        </div>
        <div
          v-else-if="item.messageType === 'NotificationMessage'"
          class="rong-conversation-tip"
        >
          {{ getNotification(item) }}
        </div>
        <RecallCommandMessage
          v-else-if="item.messageType === 'RecallCommandMessage'"
          :message="item"
          :groupId="(conversation.group || {}).id"
          :isBanned="isBanned"
        ></RecallCommandMessage>
        <div
          v-else-if="item.messageType === 'VoIPNotifyMessage'"
          class="rong-conversation-tip"
        >
          {{ item.content.content }}
        </div>
        <div
          v-else-if="item.messageType === 'ForwardFaildMessage'"
          class="rong-conversation-tip"
        >
          {{ locale.components.groupBanned.banned }}
        </div>
        <div
          v-else-if="item.messageType === 'JrmfRedPacketMessage'"
          class="rong-conversation-tip"
        >
          {{ getJrmfRedPacket(item) }}
        </div>
        <div
          v-else-if="item.messageType === 'JrmfRedPacketOpenedMessage'"
          class="rong-conversation-tip"
        >
          {{ getJrmfRedPacketOpened(item) }}
        </div>
        <div
          v-else-if="item.messageType === 'UnknowMessage'"
          class="rong-conversation-tip"
        >
          {{ locale.message.unknown }}
        </div>
        <div
          v-else-if="item.messageType === 'RequestFriendVerificationMessage'"
          class="rong-conversation-tip"
        >
          <RequestFriendVerificationMessage
            :message="item"
          ></RequestFriendVerificationMessage>
        </div>
        <div
          v-else-if="isGroupSummary(item)"
          :id="item.messageId"
          @click="select($event, item)"
          class="rong-conversation-tip">
            <label v-if="isMultiSelected" class="rong-checkbox rong-multiselect-summary">
              <input type="checkbox" :value="item.messageId" v-model="selectedMessageIds"><i></i>
            </label>
            {{ getGroupSummary(item) }}
        </div>
        <div
          v-else
          :data-senttime="item.sentTime"
          :data-messageuid="item.messageUId"
          :id="item.messageId"
          @click="select($event, item)"
          class="rong-conversation-one rong-clearfix rong-conversation-select"
          :class="{
            'rong-conversation-other': item.messageDirection == 2,
            'rong-conversation-me': item.messageDirection == 1,
            'rong-public-message': isPublic,
            'rong-unread-at-message': isUnreadAt(item),
          }"
        >
          <label v-if="isMultiSelected" class="rong-checkbox rong-multiselect">
            <input type="checkbox" :value="item.messageId" v-model="selectedMessageIds"><i></i>
          </label>
          <div v-if="conversation_type==3">
            <avatar
              class="rong-message-avatar rong-avatar-small"
              v-if="
                !isPublic ||
                (item.messageType !== 'PublicServiceMultiRichContentMessage' &&
                  item.messageType !== 'PublicServiceRichContentMessage')
              "
              :user="item.user"
              @clickavatar="userProfile(item.user.id, isMultiSelected)"
            >
            </avatar>
            <div
              v-if="item.messageDirection == 2"
              class="rong-conversation-one-username rong-disable-select"
            >
              <a :class="isMultiSelected ? 'rong-disable-profile' : ''" @click.prevent="userProfile(item.user.id, isMultiSelected)" href="" v-html="item.alias"></a>
            </div>
          </div>
          <div v-else>
            <avatar
              class="rong-message-avatar rong-avatar-small"
              v-if="
                !isPublic ||
                (item.messageType !== 'PublicServiceMultiRichContentMessage' &&
                  item.messageType !== 'PublicServiceRichContentMessage')
              "
              :user="item.user"
            >
            </avatar>
            <div
              v-if="item.messageDirection == 2"
              class="rong-conversation-one-username rong-disable-select"
            >
              <a :class="isMultiSelected ? 'rong-disable-profile' : ''" href="" v-html="item.alias"></a>
            </div>
          </div>

          <div
            class="rong-message"
            :class="[item.isWideNetwork ? 'rong-disreadable-message' : 'rong-'+getMessageType(item).toLowerCase()]"
          >
            <div
              class="rong-message-bd"
              @contextmenu.prevent="
                showContextmenu(
                  $event,
                  { message: item, conversation: conversation, menuCount: 9 },
                  fixOffset
                )
              "
              draggable
              @dragstart="dragMessage($event, item)"
            >
              <component
                :is="getMessageType(item)"
                :message="item"
                :isMultiSelected="isMultiSelected"
                :conversation_type="conversation_type"
                @autoPlay="autoPlay"
                @uploadCancel="uploadCancel"
                @forward="forward"
                :ref="item.messageUId"
                @remove="remove"
                @showImage="showImage"
                @imageDownloadComplete="imageDownloadComplete"
                @collect="collect"
                @showSight="showSight"
                @showCombineMsg="showCombineMsg"
              >
              </component>
              <!-- <div v-if="item.notSupportView" class="rong-conversation-one-message">
                  <em v-html="locale.message.notSupportView"></em>
              </div> -->
            </div>
            <i
              v-if="fromMe(item) && !isMultiSelected"
              class="rong-message-status"
              :class="['rong-message-' + getMessageStatus(item)]"
              :disabled="disabled"
              @click="reSendMessage(item)"
            ></i>
            <div v-if="showPrivateResp(item) && !isMultiSelected" class="rong-ack rong-disable-select">
              <a v-if="isUnRead(item)" @click.prevent="">{{ locale.message.unread }}</a>
              <span v-if="isRead(item)">{{ locale.message.read }}</span>
            </div>
            <div v-if="showGroupResp(item) && !isMultiSelected" class="rong-ack rong-disable-select">
              <a
                href="#"
                v-show="item.isShow"
                v-if="ableSendGroupReq(item, index)"
                @click.prevent="sendGroupReq(item)"
                >{{ locale.message.checkUnread }}</a
              >
              <template v-if="hasGroupResp(item)">
                <a
                  href="#"
                  v-if="getUnreadCount(item) > 0"
                  @click.prevent="showUnreadMember(item)"
                  >{{
                    localeFormat(locale.message.unreadMember, getUnreadCount(item))
                  }}</a
                >
                <span v-else-if="getUnreadCount(item) === 0">{{
                  locale.message.allRead
                }}</span>
                <span v-else>{{ locale.tips.loading }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div id="rong-message-bottom" class="rong-message-bottom"></div>
    </div>

    <div
      v-if="hasNewMessageTip"
      class="rong-new-message"
      :style="{ bottom: bottom + 'px' }"
    >
      <a
        href="#bottom"
        @click.prevent.stop="scrollToNewMessage(conversation.unreadMessageCount)"
        >{{
          localeFormat(locale.message.unreadMessageCount, conversation.unreadMessageCount)
        }}</a
      >
    </div>
    <div
      class="rong-at-tip"
      v-if="showAttip && atNumber !== 0"
      @click="jumpAtMsg"
      :style="{ bottom: bottom + 'px' }"
    >
      <span class="rong-at-number">{{ atNumber }}</span>
    </div>

    <contextmenu
      v-if="context"
      ref="contextmenu"
      @close="closeContextmenu"
      @recall="recall"
      @copy="copy"
      @collect="collect"
      @forward="forward"
      @remove="remove"
      @download="download"
      @quote="quote"
      @open="open"
      @multiSelect="multiSelect"
      :context="context"
      :isBanned="isBanned"
      :isMultiSelected="isMultiSelected"
    >
    </contextmenu>
  </div>
</template>
<script src="./message-list.js"></script>
