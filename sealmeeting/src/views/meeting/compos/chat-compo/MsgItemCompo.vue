<template>
  <li class="message-item" :class="{ right: msg.isSend }">
    <div class="send-time" v-if="msgTime">{{ msgTime }}</div>
    <div class="username">{{ msg.user.name }}</div>
    <component
      is="TextMessage"
      :message="msg.content"
      :is_self="msg.isSend"
    ></component>
  </li>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, computed, onMounted } from 'vue'
import { meetingAction } from '@/store/meeting'
import TextMessage from './TextMsgCompo.vue'
import { timeUtil } from '@/utils/timeUtil'
export default defineComponent({
  props: {
    msg: Object
  },
  components: {
    TextMessage
  },
  setup({ msg }, { attrs, slots, emit }) {
    const msgTime = computed(() => {
      if (msg!.sendTime) {
        return timeUtil.calDisplay(msg!.sendTime)
      }
      return ''
    })
    return {
      msgTime
    }
  }
})
</script>

<style lang="scss" scoped>
.message-list-box {
  background: rgba(255, 255, 255, 1);
  width: 100%;
  height: 100%;
  box-shadow: -2px 0px 6px 0px rgba(6, 66, 96, 0.1);
  .title-bar {
    position: relative;
    height: 44px;
    border-bottom: 1px solid rgba(228, 230, 231, 1);
    text-align: center;
    line-height: 44px;
    font-size: 14px;
    font-weight: 400;
  }

  .messages-content {
    position: relative;
    height: 100%;
    padding: 0px 0 214px 0;
    .messages-list {
      height: 100%;
      overflow: auto;
      .message-item {
        width: 100%;
        padding: 10px;
        .send-time {
          user-select: none;
          width: 60px;
          height: 30px;
          line-height: 30px;
          background-color: #b1b3b7;
          border-radius: 4px;

          margin: 15px auto;
          color: #ffffff;
          font-size: 12px;
          text-align: center;

          font-weight: 600;
        }
        .username {
          font-size: 12px;
          font-weight: 400;
          color: #5c6970;
          line-height: 17px;
          margin-bottom: 6px;
        }
      }
      .right {
        text-align: right;
      }
    }
  }
}

.right-panel {
  position: absolute;
  right: 0px;
  top: 0px;
  width: 380px;
  height: 100%;
  padding-top: 40px;
  z-index: 1101;
  .panel {
    width: 100%;
    height: 100%;
    box-shadow: -2px 0px 6px 0px rgba(6, 66, 96, 0.1);
  }
}
.el-message-box__headerbtn {
  top: 10px;
}
</style>
