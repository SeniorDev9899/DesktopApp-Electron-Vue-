<template>
  <div class="meeting-setting">
    <div class="switch-item">
      <span>{{ locale.lockRoom }}</span>
      <el-switch class="meet-options-switch" v-model="isMeetingLocked"></el-switch>
    </div>
    <!-- <el-row >
      <span>仅主持人可录制会议</span>
      <el-switch  :model="userInfo.locked"/>
    </el-row>-->
    <div class="switch-item">
      <span>{{ locale.joinMute }}</span>
      <el-switch class="meet-options-switch" v-model="meetingInfo.joinForceCloseMic" />
    </div>
    <div class="switch-item">
      <span>{{ locale.joinCloseCamera }}</span>
      <el-switch class="meet-options-switch" v-model="meetingInfo.joinForceCloseCamera" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch, watchEffect } from 'vue';
import { meetingInfo } from '@/store/meeting';
import localeStore from '@/store/localeStore';
import { meetingRoomService } from '@/core/services';
const useMeetingSetting = () => {
  const isMeetingLocked = computed({
    get: () => {
      return meetingInfo.lockStatus === 1;
    },
    set: (val) => {
      meetingInfo.lockStatus = val ? 1 : 0;
    },
  });
  watch(isMeetingLocked, (val, preVal) => {
    meetingRoomService.ctrlMeetingLock(val);
  });
  watchEffect(() => {
    meetingRoomService.ctrlMeetingSetting(
      meetingInfo.joinForceCloseMic,
      meetingInfo.joinForceCloseCamera
    );
  });
  onMounted(() => {
    meetingRoomService.syncMeetingBasic();
  });
  return {
    isMeetingLocked,
  };
};
export default defineComponent({
  setup() {
    const { isMeetingLocked } = useMeetingSetting();
    const locale = localeStore('setting');
    return {
      meetingInfo: meetingInfo,
      isMeetingLocked,
      locale,
    };
  },
});
</script>

<style lang="scss">
.meeting-setting {
  padding: 16px 32px 16px 18px;
  .switch-item {
    margin-bottom: 10px;
    span {
      line-height: 20px;
    }
    .meet-options-switch {
      float: right;
    }
  }
}
</style>
