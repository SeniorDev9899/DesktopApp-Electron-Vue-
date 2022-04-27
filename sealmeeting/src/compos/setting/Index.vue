<template>
  <div class="setting">
    <el-divider></el-divider>
    <el-tabs tab-position="left" class="tabs">
      <el-tab-pane :label="locale.videoOption">
        <VideoSetting />
      </el-tab-pane>
      <el-tab-pane :label="locale.audioOption">
        <AudioSetting />
      </el-tab-pane>
      <el-tab-pane v-if="isMeHost" :label="locale.meetingOption">
        <MeetingSetting />
      </el-tab-pane>
      <el-tab-pane v-if="!isInMeeting" :label="locale.meetingConfig">
        <MeetingConfig />
      </el-tab-pane>
      <el-tab-pane v-if="!isInMeeting" :label="locale.accountSetting">
        <AccountSetting />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import VideoSetting from './VideoSetting.vue';
import AudioSetting from './AudioSetting.vue';
import MeetingSetting from './MeetingSetting.vue';
import localeStore from '@/store/localeStore';
import MeetingConfig from './MeetingConfig.vue';
import AccountSetting from './AccountSetting.vue';
import { meInfo, meetingInfo } from '@/store/meeting';
export default defineComponent({
  props: {
    inMeeting: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
  },
  components: {
    VideoSetting,
    AudioSetting,
    MeetingSetting,
    MeetingConfig,
    AccountSetting,
  },
  setup() {
    const locale = localeStore('setting');
    const isInMeeting = computed(() => {
      return !!meetingInfo.id;
    });
    const isMeHost = computed(() => {
      return meInfo.isHost;
    });
    return {
      isInMeeting,
      isMeHost,
      locale,
      meInfo,
    };
  },
});
</script>

<style lang="scss" scoped>
.setting {
  font-weight: 400;
  color: #2e3538;
  font-size: 14px;
  height: 400px;
  .tabs {
    height: 100%;
    .el-tabs__content,
    .el-tab-pane {
      height: 100%;
    }
  }
}

.el-divider--horizontal {
  margin: 0px 0px;
}
</style>
