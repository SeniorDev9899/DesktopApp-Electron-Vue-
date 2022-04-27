<template>
  <div class="audio-setting">
    <div class="setting-item">
      <span class="item-label">{{ locale.speaker }}</span>
      <select v-model="outputDeviceId">
         <option
          v-for="(item, index) in audioOutputDevices"
          :key="index"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </div>
    <div class="setting-item">
      <span class="item-label">{{ locale.mic }}</span>
      <select v-model="inputDeviceId">
         <option
          v-for="(item, index) in audioInputDevices"
          :key="index"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
import getLocaleMixins from '../../utils/getLocaleMixins';
import cache from '../../utils/cache';

export default {
    name: 'meetingSetting',
    data() {
        return {
            outputDeviceId: cache.get('outputDeviceId'),
            inputDeviceId: cache.get('inputDeviceId'),
            audioInputDevices: [],
            audioOutputDevices: [],
        };
    },
    watch: {
        outputDeviceId(newVal) {
            cache.set('outputDeviceId', newVal);
        },
        inputDeviceId(newVal) {
            cache.set('inputDeviceId', newVal);
        },
    },
    mixins: [getLocaleMixins('meetingSetting')],
    async mounted() {
        const r = await this.getDevices();
        const [audioInputDevices, audioOutputDevices] = r;
        this.audioInputDevices = audioInputDevices;
        this.audioOutputDevices = audioOutputDevices;
        this.outputDeviceId = this.outputDeviceId ? this.outputDeviceId : this.audioOutputDevices[0].value;
        this.inputDeviceId = this.inputDeviceId ? this.inputDeviceId : this.audioInputDevices[0].value;
    },
    methods: {
        async getDevices() {
            // 重载设备并渲染页面
            const audioInputDevices = [];
            const audioOutputDevices = [];
            const videoDevices = [];
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                devices.forEach((device) => {
                    switch (device.kind) {
                    case 'audioinput':
                        audioInputDevices.push({
                            label: device.label,
                            value: device.deviceId,
                        });
                        break;
                    case 'audiooutput':
                        audioOutputDevices.push({
                            label: device.label,
                            value: device.deviceId,
                        });
                        break;
                    case 'videoinput':
                        videoDevices.push({
                            label: device.label,
                            value: device.deviceId,
                        });
                        break;
                    default:
                    }
                });
                return [audioInputDevices, audioOutputDevices, videoDevices];
            } catch (e) {
                Promise.reject(e);
                return [];
            }
        },
    },
};
</script>

<style lang="scss">
.audio-setting {
  box-sizing: border-box;
  padding: 25px 15px;
  .setting-item {
    margin-bottom: 30px;
    min-height: 40px;
    .item-label {
      margin-right: 10px;
      display: inline-block;
      width: 70px;
    }
    label {
      margin-right: 13px;
    }
    select {
      width: 320px;
      outline: none;
      border: 1px solid #dcdfe6;
      display: inline-block;
      height: 35px;
      padding: 0 15px;
      background-color: #fff;
      background-image: none;
      border-radius: 4px;
    }
  }
}
</style>
