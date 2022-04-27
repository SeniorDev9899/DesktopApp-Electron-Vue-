<template>
  <div class="container">
    <div class="content">
      <div class="name-tip">{{ meetingInfo.subject }}</div>
      <div>
        <span>发起人:</span>
        {{ meetingInfo.creatorName }}
      </div>
      <div>
        <span>时间:</span>
        {{ startTime }}
      </div>
      <div>
        <span>会议ID:</span>
        {{ meetingInfo.number }}
      </div>
      <div>
        <span>会议密码:</span>
        {{ meetingInfo.password }}
      </div>
      <div style="margin-top: 15px">会议地址:</div>
      <div>
        <a :href="meetingUrl" target="_blank">{{ meetingUrl }}</a>
      </div>
    </div>
    <div style="text-align: center; margin-top: 100px">
      <el-button @click="joinMeeting" type="primary">加入会议</el-button>
    </div>
    <div v-if="isWeChat" class="weixin-bg"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import useShare from './hooks/useShare'
export default defineComponent({
  setup() {
    const { meetingInfo, startTime, meetingUrl, isWeChat, joinMeeting } =
      useShare()

    return {
      meetingInfo,
      startTime,
      meetingUrl,
      isWeChat,
      joinMeeting
    }
  }
})
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  width: 100%;
  .content {
    margin: 0px 16px 0px 16px;
    padding: 10px;
    // background: rgba(233, 240, 244, 1);
    border-radius: 2px;
    // border: 1px solid rgba(202, 205, 206, 1);
    line-height: 20px;
    .name-tip {
      margin-bottom: 20px;
    }
    div > span {
      display: inline-block;
      width: 90px;
      padding-right: 15px;
      text-align: left;
      color: #5c6970;
      margin-bottom: 10px;
    }
  }
  .weixin-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.5);
    background-image: url(~@/assets/images/skipWeixin.png);
    background-size: 80%;
    background-repeat: no-repeat;
    background-position: 92% 0;
  }
  .el-button {
    padding: 8px 71px;
  }
}
</style>
