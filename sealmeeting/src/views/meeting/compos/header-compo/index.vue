<template>
  <div class="head">
    <i :class="'signal-icon' + meetingMonitor"></i>
    <em class="room-id">ID: {{ meetingInfo.number }}</em>
    <em class="room-id" v-if="meetingInfo.recordStatus === 1 && meInfo?.isHost">
      <i class="signal-recordIng"></i>
      {{ locale.recordIng }}
    </em>
    <em class="subject">{{ meetingInfo.subject }}</em>
    <div class="right-items">
      <em class="duration">{{ meetingDuration }}</em>
      <i
        class="normal_view-icon"
        :class="{ nine_item_view: isFocusMode }"
        @click="changeViewMode(!isFocusMode)"
      ></i>
      <i class="normal-screen-icon full_screen" style="display: none"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted } from 'vue'
import {
  meetingInfo,
  meetingSetting,
  meetingAction,
  meInfo
} from '@/store/meeting'
import localeStore from '@/store/localeStore'
import { durationFormat } from '@/utils/timeUtil'
import { ref } from 'vue'
import use from './hooks/use'
export default defineComponent({
  setup(props, { attrs, slots, emit }) {
    const locale = localeStore('meeting')

    const { meetingDuration, isFocusMode, meetingMonitor, changeViewMode } =
      use()
    return {
      locale,
      meetingInfo,
      meInfo,
      meetingDuration,
      isFocusMode,
      meetingMonitor,
      changeViewMode
    }
  }
})
</script>
<style lang="scss" scoped>
.head {
  position: absolute;
  width: 100%;
  height: 40px;
  background: rgba(255, 255, 255, 1);
  padding: 8px 20px;
  line-height: 24px;
  top: 0px;
  bottom: 0px;
  z-index: 1099;

  .signal-icon {
    display: inline-block;
    width: 15px;
    height: 15px;
    background-image: url(~@/assets/images/signal.svg);
  }

  .signal-icon-600 {
    display: inline-block;
    width: 15px;
    height: 15px;
    background-image: url(~@/assets/images/signal600.png);
    background-size: 100%;
  }

  .signal-icon-900 {
    display: inline-block;
    width: 15px;
    height: 15px;
    background-image: url(~@/assets/images/signal900.png);
    background-size: 100%;
  }

  .signal-recordIng {
    display: inline-block;
    width: 15px;
    height: 20px;
    vertical-align: middle;
    background-image: url(~@/assets/images/recording.png);
    background-repeat: no-repeat;
    background-size: 100%;
  }

  .room-id {
    margin-left: 20px;
    // position: absolute;
  }

  .subject {
    position: absolute;
    width: 200px;
    left: calc(50% - 100px);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .right-items {
    position: absolute;
    padding: 8px 0px;
    line-height: 24px;
    top: 0px;
    right: 20px;

    .normal_view-icon {
      display: inline-block;
      margin-left: 40px;
      width: 16px;
      height: 16px;
      background-image: url(~@/assets/images/normal_view.svg);
      cursor: pointer;
    }

    .nine_item_view {
      width: 18px;
      height: 18px;
      background-image: url(~@/assets/images/nine_item_view.svg);
    }

    .normal-screen-icon {
      display: inline-block;
      margin-left: 20px;
      width: 16px;
      height: 16px;
      background-image: url(~@/assets/images/normal_screen.svg);
    }

    .full_screen {
      display: inline-block;
      width: 18px;
      height: 18px;
      background-image: url(~@/assets/images/full_screen.svg);
    }
  }
}
</style>