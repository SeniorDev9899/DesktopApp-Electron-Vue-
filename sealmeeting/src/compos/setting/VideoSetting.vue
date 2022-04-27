<template>
  <div class="video-setting">
    <el-form label-width="85px">
      <el-form-item :label="locale.videoDevice">
        <el-select v-model="state.cameraId">
          <el-option
            v-for="item in state.cameras"
            :key="item.deviceId"
            :label="item.label"
            :value="item.deviceId"
          ></el-option>
        </el-select>
        <!-- <el-button v-if="!data.videoStream" type="primary" @click="getVideo">{{locale.checkCamera}}</el-button>
        <el-button v-else type="primary" @click="stopVideo">{{locale.closeCheckCamera}}</el-button>-->
      </el-form-item>
      <el-form-item :label="locale.videoResolution">
        <el-radio-group v-model="state.cameraRes">
          <el-radio :label="RCResolution.W256_H144">{{ locale.low }}</el-radio>
          <el-radio :label="RCResolution.W640_H480">{{ locale.mid }}</el-radio>
          <el-radio :label="RCResolution.W1280_H720">{{
            locale.high
          }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <div class="video-view">
      <video autoplay ref="videoEle"></video>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  onUnmounted,
  computed,
  watchEffect
} from 'vue'
import { settingAction, settingState } from '@/store/setting'
import localeStore from '@/store/localeStore'
import rtcCore from '@/modules/RTCCore'
import { EnumErrorCode } from '@/types/Enums'
import { RCLocalVideoTrack, device } from '@rongcloud/plugin-rtc'
import { meetingRoomService } from '@/core/services'
import { RCFrameRate, RCResolution } from '@rongcloud/plugin-rtc'
const useVideoSetting = () => {
  const state = reactive({
    cameras: [] as any[],
    cameraId: settingState.cameraId,
    cameraRes: settingState.cameraRes
  })
  const videoEle = ref(null)
  let _track: RCLocalVideoTrack | undefined = undefined
  watchEffect(async () => {
    if (state.cameraId && state.cameraRes) {
      const { code, track } = await rtcCore.getLocalVideoTrack({
        frameRate: RCFrameRate.FPS_15,
        resolution: state.cameraRes,
        cameraId: state.cameraId
      })
      if (code === EnumErrorCode.OK) {
        track!.play(videoEle.value! as HTMLVideoElement)
        !!_track && _track.destroy()
        _track = track
        settingAction.updateSettig({
          cameraId: state.cameraId,
          cameraRes: state.cameraRes
        })
      }
    }
  })
  onMounted(async () => {
    ;(await device.getCameras()).forEach((item) => {
      state.cameras.push(item)
      if (!state.cameraId) {
        state.cameraId = item.deviceId
      }
    })
  })
  onUnmounted(() => {
    if (_track) {
      ;(_track as RCLocalVideoTrack).destroy()
    }
  })
  return {
    state,
    videoEle
  }
}
export default defineComponent({
  setup() {
    const { state, videoEle } = useVideoSetting()
    const locale = localeStore('setting')
    return {
      state,
      videoEle,
      locale,
      RCResolution
    }
  }
})
</script>

<style lang="scss" scoped>
.video-setting {
  padding-top: 16px;
  .el-select {
    width: 280px;
  }
  .el-button {
    margin-left: 16px;
  }
  .video-view {
    width: 100%;
    height: 250px;
    padding: 20px;
    video {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
