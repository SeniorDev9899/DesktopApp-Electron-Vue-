<template>
  <div
    class="rong-conversation-editor"
    @dragover="dragover"
    @drop="drop"
    :style="{ height: height + 'px' }"
  >
    <div v-show="isBanned || isInvalidGroup" class="rong-conversation-banned-layer">
      <span v-show="isBanned && !isInvalidGroup">{{ locale.banned }}</span>
    </div>
    <div
      v-show="!disabled"
      class="rong-resize rong-resize-y"
      :class="['rong-resize-' + getResizeDirection()]"
    ></div>
    <div v-if="!isMultiSelected" class="rong-toolbar">
      <div class="rong-toolbar-item">
        <button
          class="rong-toolbar-emoji"
          :title="locale.emoji"
          @click.stop="toggleEmoji"
          :disabled="disabled"
        ></button>
      </div>
      <div
        class="rong-toolbar-item rong-toolbar-item-screenshot"
        v-if="screenshotSupported"
      >
        <button
          class="rong-toolbar-screenshot"
          :title="locale.screenshot"
          @click="takeScreenshot"
          :disabled="disabled"
        ></button>
      </div>
      <div class="rong-toolbar-item" v-if="screenshotSupported">
        <div class="rong-screenshot-toggle" @click.stop="toggleScreenOption"></div>
      </div>
      <div class="rong-toolbar-item" v-if="!isPublicConversation" @click="selectFile">
        <input
          :title="locale.sendFile"
          type="file"
          multiple="multiple"
          @change="fileChanged($event)"
          :disabled="disabled"
        />
        <button class="rong-toolbar-file" :disabled="disabled"></button>
      </div>
      <div class="rong-toolbar-item" v-if="!isPublicConversation">
        <button
          class="rong-toolbar-card"
          :title="locale.sendCard"
          @click="sendCard"
          :disabled="disabled"
        ></button>
      </div>

      <div class="rong-toolbar-item" v-if="showVideo">
        <button
          class="rong-toolbar-video"
          :title="locale.videoCall"
          @click="sendVideo()"
          :disabled="disabled"
        ></button>
      </div>
      <div class="rong-toolbar-item" v-if="showAudio">
        <button
          class="rong-toolbar-audio"
          :title="locale.voiceCall"
          @click="sendAudio()"
          :disabled="disabled"
        ></button>
      </div>
      <div
        v-if="isPublicConversation && isShowMenuSwitch"
        class="rong-toolbar-item rong-toolbar-toggle"
      >
        <button
          class="rong-toolbar-toggle-button"
          :title="locale.emoji"
          @click="inputMenuChanged"
          :disabled="disabled"
        ></button>
      </div>

      <div class="rong-toolbar-item" v-if="isShowCollect">
        <button
          class="rong-toolbar-toggle-collect"
          :title="locale.btns.collect"
          @click="showCollect()"
          :disabled="disabled"
        ></button>
      </div>
    </div>
    <div v-if="!isMultiSelected" class="rong-conversation-field">
      <div class="rong-conversation-field-bd">
        <edit-box
          @click.native="clearUnReadCount"
          ref="editor"
          :atMembers="atMembers"
          :autoFocus="autoFocus"
          :disabled="disabled"
          :notSaveDraft="isInvalidGroup"
          @enter="sendMessage"
          :checkSendEnable="checkSendEnable"
          @editBoxChange="messageInputChanged"
          @paste="paste"
          @prepareinput="prepareinput"
          :class="['rong-resize-' + resizeDirection]"
          :style="{ height: getTextareaHeight() + 'px' }"
        ></edit-box>
      </div>
      <button
        class="rong-button rong-submit"
        type="button"
        :disabled="disabled || !sendBtnAvailable || isBanned"
        @click="sendMessageByButton"
      >
        {{ locale.btns.send }}
      </button>
    </div>
    <div v-if="isMultiSelected" class="rong-conversation-field-bd">
      <multiselect-panel
        :selectedMessages="selectedMessages"
        :conversation="conversation"
        @setMultiSelect="setMultiSelect"
      ></multiselect-panel>
    </div>
    <div
      ref="screenshotoption"
      class="rong-screenshot-option"
      v-show="isShowScreenOption"
    >
      <label class="rong-checkbox"
        ><input type="checkbox" v-model="isShowWindow" /><i></i>
        {{ locale.hideWindow }}</label
      >
    </div>
    <emoji-panel
      v-show="showEmojiPanel"
      @selectedEmoji="selectedEmoji"
      @hideEmojiPanel="hideEmojiPanel"
    ></emoji-panel>
  </div>
</template>
<script src="./message-input.js"></script>
