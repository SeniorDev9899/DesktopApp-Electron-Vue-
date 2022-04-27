<template>
  <div
    class="rong-component"
    :style="{ width: width + 'px' }"
    @drop="dropAllItem()"
  >
    <div
      class="rong-resize rong-resize-x"
      :class="['rong-resize-' + getResizeDirection()]"
    ></div>
    <search ref="searchBox"></search>

    <div class="rong-list-main">
      <div v-show="loadingNextPage" class="rong-loading-bottom">
        <span>{{ locale.tips.loading }}</span>
      </div>
      <div
        ref="list"
        id="conversationListContent"
        class="rong-list-content rong-conversation-list"
        v-rong-scroll-bar-y="messageList"
        @scroll="scroll()"
        v-rong-scroll-to-bottom="loadMore"
      >
        <div v-if="busy" class="rong-loading">
          <span>{{ locale.tips.loading }}</span>
        </div>
        <!-- // 37762 - 【web】其它端发起音视频后，web 端会出一条消息-->
        <!-- 会话列表item -->
        <template v-else-if="messageList.length > 0">
            <ConversationItem
               v-for="item in messageList"
               :key="item.targetId + item.viewKey"
               :conItem="item"
               :conversation="conversation"
               :resizeDirection="resizeDirection"
               @showConversaton="showConversaton"
               @showContextmenu="showContextmenu"
               @dragOverItem="dragOverItem"
               @dropItem="dropItem"
            />
        </template>
        <div v-else class="rong-empty">
          {{ locale.conversation.empty }}
        </div>
      </div>
    </div>

    <contextmenu
      is="contextmenu"
      v-if="context"
      @close="closeContextmenu"
      @top="top"
      @untop="untop"
      @mute="mute"
      @unmute="unmute"
      @remove="remove"
      :context="context"
    ></contextmenu>
  </div>
</template>
<script src="./conversation-list.js"></script>
