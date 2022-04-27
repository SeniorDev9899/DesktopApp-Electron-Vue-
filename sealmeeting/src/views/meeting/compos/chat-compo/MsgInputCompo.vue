<template>
  <div class="message-input">
    <div class="resize-y"></div>
    <div class="tool-bar">
      <div class="emoji-icon" @click="showEmojiPanel"></div>
    </div>
    <textarea
      v-model="textContent"
      ref="textEleRef"
      cols="30"
      rows="4"
      class="textarea-editor"
      maxlength="100"
      placeholder="请输入内容"
      @keydown="keyDownHandler($event)"
    ></textarea>
    <el-button
      class="btn blue send-btn"
      @click.prevent="sendMessage()"
      :disabled="!textContent"
      >发送</el-button
    >
    <emoji
      v-if="isShowEmojiPanel"
      :setEmoji="setEmoji"
      :hide="hideEmojiPanel"
    ></emoji>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, watch } from 'vue'
import emoji from './emoji.vue'
import ToggleBtn from '@/compos/ToggleBtn.vue'
import { msgService } from '@/core/services'
export default defineComponent({
  components: {
    emoji,
    ToggleBtn
  },

  setup(props, { attrs, slots, emit }) {
    const textContent = ref('')
    const textEleRef = ref(null)
    const isShowEmojiPanel = ref(false)

    const keyDownHandler = (event: any) => {
      console.log(event.keyCode === 13 && !event.shiftKey && textContent.value)
      if (event.keyCode === 13 && !event.shiftKey && textContent.value.trim()) {
        sendMessage()
        event.preventDefault()
      }
    }

    const sendMessage = async () => {
      let msg = textContent.value.trim()
      if (msg) {
        msgService.sendMessage(msg)
        textContent.value = ''
      }
    }

    const showEmojiPanel = () => {
      isShowEmojiPanel.value = !isShowEmojiPanel.value
    }

    const setEmoji = (emoji: string) => {
      textContent.value += emoji
      isShowEmojiPanel.value = false
      ;(textEleRef.value! as HTMLElement).focus()
    }

    const hideEmojiPanel = () => {
      isShowEmojiPanel.value = false
    }

    return {
      keyDownHandler,
      sendMessage,
      showEmojiPanel,
      isShowEmojiPanel,
      textContent,
      hideEmojiPanel,
      setEmoji,
      textEleRef
    }
  }
})
</script>

<style lang="scss" scoped>
.message-input {
  width: 100%;
  height: 174px;
  position: absolute;
  z-index: 10;
  left: 0;
  bottom: 0;

  min-height: 120px;
  max-height: 346px;
  background: #fbfbfd;

  // .resize-y-middle {
  //     cursor: row-resize;
  // }
  .resize-y {
    width: 100%;
    height: 10px;
    position: absolute;
  }

  .tool-bar {
    height: 30px;
    padding: 5px;
    border-top: 1px solid #ececed;
    border-bottom: 1px solid #e4e6e7;
  }

  .textarea-editor {
    width: 100%;
    border: 0px;
    height: 124px;
    resize: none;
    outline: 0;
  }

  .send-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 6px 21px;
  }

  .emoji-icon {
    display: inline-block;
    width: 20px;
    height: 18px;
    background-image: url(~@/assets/images/emoji.svg);
    cursor: pointer;
  }
}
</style>

height: ; } .rong-conversation-editor {
