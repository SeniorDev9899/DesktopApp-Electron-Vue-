<template>
  <div class="meeting-detial-container">
    <div class="title">{{ locale.meetingDetialText }}</div>
    <i class="up-page" @click="upPage"></i>
    <div class="subject">{{ meetingInfo.subject }}</div>
    <div class="detail">
      <div>
        <i class="label">{{ locale.sender }}</i>
        <span>{{ meetingInfo.creatorName }}</span>
      </div>
      <div>
        <i class="label">{{ locale.time }}</i>
        <span>{{ startTime }}-{{ stopTime }}</span>
      </div>
      <div>
        <i class="label">{{ locale.id }}</i>
        <span>{{ meetingInfo.number }}</span>
      </div>
      <div v-if="meetingInfo.password">
        <i class="label">{{ locale.password }}</i>
        <span>{{ meetingInfo.password }}</span>
      </div>
      <div v-if="meetingInfo.recordFileUrls">
        <i class="label">{{ locale.recordFile }}</i>
        <template v-for="item in meetingInfo.recordFileUrls" :key="item">
          <a target="_blank" class="video-item" :href="item">{{ item }}</a>
        </template>
      </div>
      <div>
        <i class="label">{{ locale.recordDeleteTip }}</i>
      </div>
    </div>
    <div class="btns">
      <el-button
        type="primary"
        v-if="meetingInfo.status === 0"
        @click="
          () => handleJoinMeetingItem(meetingInfo.id, meetingInfo.password)
        "
        >{{ locale.joinMeeting }}</el-button
      >
      <el-button
        type="primary"
        v-if="meetingInfo.status === 0"
        @click="handleInvitationMeetingItem(meetingInfo.id)"
        >{{ locale.shareMeeting }}</el-button
      >
      <el-button
        type="danger"
        plain
        @click="() => handleDeleteMeetingItem($route)"
        >{{ locale.deleteMeeting }}</el-button
      >
    </div>
    <InviteDialog v-model="visible" :detialInfo="meetingInfo" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import localeStore from '@/store/localeStore'
import Background from '@/compos/Background.vue'
const locale = localeStore('home.detial')
import { useDetialInfo, useCommon } from './hooks/useMeetingDetil'
import InviteDialog from '@/compos/dialog/InviteDialog.vue'
import { timeUtil } from '@/utils/timeUtil'
export default defineComponent({
  components: {
    Background,
    InviteDialog
  },
  setup() {
    const {
      upPage,
      handleJoinMeetingItem,
      handleInvitationMeetingItem,
      handleDeleteMeetingItem,
      visible
    } = useCommon()
    const { meetingInfo, startTime, stopTime } = useDetialInfo()
    return {
      startTime,
      stopTime,
      locale,
      meetingInfo,
      upPage,
      handleJoinMeetingItem,
      handleInvitationMeetingItem,
      handleDeleteMeetingItem,
      visible
    }
  }
})
</script>

<style lang="scss" scoped>
.meeting-detial-container {
  width: 100%;
  height: 100%;
  position: relative;
  .up-page {
    position: absolute;
    top: 24px;
    left: 0px;
    width: 16px;
    height: 16px;
    background-image: url(~@/assets/images/left_arrow.png);
    cursor: pointer;
  }
  .subject {
    font-weight: 500;
    line-height: 20px;
    font-size: 14px;
    margin-bottom: 22px;
    font-size: 14px;
    margin-top: 30px;
  }
  .detail {
    font-size: 12px;
    line-height: 17px;
    div {
      margin-bottom: 10px;
    }
    .label {
      color: rgba(143, 156, 163, 1);
    }
    .video-item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      display: inline-block;
    }
    span {
      float: right;
    }
  }
  .btns {
    position: absolute;
    bottom: 40px;
    width: 100%;
    .el-button {
      display: block;
      margin-top: 10px;
      width: 100%;
      margin-left: 0px;
    }
  }
}
</style>
