<template>
  <div class="video-setting">
    <div class="setting-item">
      <span class="item-label">{{ locale.videoDevice }}</span>
      <select v-model="deviceId">
        <option
          v-for="(item, index) in videoDevices"
          :key="index"
          :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </div>
    <div class="setting-item">
      <span class="item-label">{{ locale.videoResolution }}</span>
      <label for="1"
        ><input
          type="radio"
          name="resolution"
          value="min"
          id="1"
          v-model="videoResolution"
        />
        {{ locale.low }}</label
      >
      <label for="2"
        ><input
          type="radio"
          name="resolution"
          value="middle"
          id="2"
          v-model="videoResolution"
        />
        {{ locale.mid }}</label
      >
      <label for="3"
        ><input
          type="radio"
          name="resolution"
          value="max"
          id="3"
          v-model="videoResolution"
        />
        {{ locale.high }}</label
      >
    </div>
    <div v-show="videoStream" class="video-view">
      <video autoplay ref="videoEle"></video>
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
            deviceId: cache.get('videoDeviceId'),
            videoResolution: cache.get('videoResolution') || 'min',
            videoStream: null,
            videoDevices: [],
        };
    },
    mixins: [getLocaleMixins('meetingSetting')],
    async activated() {
        await this.init();
    },
    deactivated() {
        if (this.videoStream && this.videoStream.stop) {
            this.videoStream.stop();
            this.videoStream = null;
        }
    },
    watch: {
        videoResolution(newVal) {
            this.getVideo();
            cache.set('videoResolution', newVal);
        },
        deviceId(newVal) {
            cache.set('videoDeviceId', newVal);
        },
    },
    async mounted() {
        await this.init();
    },
    methods: {
        async init() {
            const context = this;
            await context.getVideo();
            const r = await context.getDevices();
            const [, , videoDevices] = r;
            context.videoDevices = videoDevices;
            context.deviceId = context.deviceId ? context.deviceId : context.videoDevices[0].value;
        },
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
        getVideo() {
            const madatorys = {
                min: {
                    width: 280,
                    height: 288,
                    frameRate: 10,
                },
                middle: {
                    width: 680,
                    height: 480,
                    frameRate: 20,
                },
                max: {
                    width: 1280,
                    height: 720,
                    frameRate: 30,
                },
            };
            const constraints = {
                video: {
                    //   deviceId: { exact: this.deviceId },
                    ...madatorys[this.videoResolution],
                    ...{ video: true, audio: true },
                },
            };
            const context = this;
            return new Promise((resolve) => {
                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    const videoDom = context.$refs.videoEle;
                    videoDom.srcObject = stream;
                    context.videoStream = stream.getVideoTracks()[0];
                    resolve();
                }).catch(() => {
                });
            });
        },
    },
};
</script>

<style lang="scss">
.video-setting {
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
  .video-view {
    width: 100%;
    height: 150px;
    video {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
