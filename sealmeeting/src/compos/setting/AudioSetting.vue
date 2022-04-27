<template>
  <div class="video-setting">
    <el-form label-width="85px">
      <el-form-item :label="locale.speaker">
        <el-select v-model="state.speakerId">
          <el-option
            v-for="item in state.speakers"
            :key="item.deviceId"
            :label="item.label"
            :value="item.deviceId"
          ></el-option>
        </el-select>
        <!-- <el-button type="primary" @click="getAudio">{{locale.checkSpeaker}}</el-button> -->
      </el-form-item>
      <!-- <el-form-item  label="输出等级" >
        <el-slider ></el-slider>
      </el-form-item>
       <el-form-item  label="扬声器音量" >
        <el-slider ></el-slider>
      </el-form-item>-->
      <el-form-item :label="locale.mic">
        <el-select v-model="state.microphoneId">
          <el-option
            v-for="item in state.microphones"
            :key="item.deviceId"
            :label="item.label"
            :value="item.deviceId"
          ></el-option>
        </el-select>

        <!-- <el-button type="primary">{{locale.checkMic}}</el-button> -->
      </el-form-item>
      <!-- <el-form-item  label="输入等级" >
        <el-slider ></el-slider>
      </el-form-item>
       <el-form-item  label="麦克风音量" >
        <el-slider ></el-slider>
      </el-form-item>-->
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, watch, ref } from 'vue';
import { settingAction, settingState } from '@/store/setting';
import localeStore from '@/store/localeStore';
import { RCLocalVideoTrack, device } from '@rongcloud/plugin-rtc';
const useAudioSetting = () => {
  const state = reactive({
    microphones: [] as any[],
    speakers: [] as any[],
    speakerId: settingState.speakerId,
    microphoneId: settingState.microphoneId,
  });
  watch(
    () => state.microphoneId,
    (value) => {
      settingAction.updateSettig({ microphoneId: value });
    }
  );
  watch(
    () => state.speakerId,
    (value) => {
      settingAction.updateSettig({ speakerId: value });
    }
  );
  onMounted(async () => {
    (await device.getMicrophones()).forEach((item) => {
      state.microphones.push(item);
      if (!state.microphoneId) {
        state.microphoneId = item.deviceId;
      }
    });
    (await device.getSpeakers()).forEach((item) => {
      state.speakers.push(item);
      if (!state.speakerId) {
        state.speakerId = item.deviceId;
      }
    });
  });
  return {
    state,
  };
};
export default defineComponent({
  setup() {
    const { state } = useAudioSetting();
    const locale = localeStore('setting');
    return {
      locale,
      state,
    };
  },
});
</script>

<style lang="scss">
.video-setting {
  padding-top: 16px;
  .el-slider,
  .el-select {
    width: 280px;
  }
  .el-button {
    margin-left: 16px;
  }
  .el-form-item {
    margin-bottom: 10px;
  }
}
</style>
