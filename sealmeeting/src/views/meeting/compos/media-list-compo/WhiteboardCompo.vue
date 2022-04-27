<template>
  <div class="white-board" @click="changeRe">
    <slot name="viewChange"></slot>
    <iframe
      ref="rongcloudWhite"
      frameborder="0"
      style="width: 100%; height: 100%"
    ></iframe>
    <!-- <div class="icons">
      <div class="icon info">
        <span class="user-show-name">{{ user.id === meInfo.id?'我自己' : data.userName }}</span>
        <div class="host-speaker" v-if="user.isHost || user.isSpeaker">
          <span class="user-show-name">
            (
            <i v-if="user.isHost" class="host-icon"></i>
            <span v-if="user.isHost">主持人</span>
            <span v-if="user.isHost && user.isSpeaker">,</span>
            <i v-if="user.isSpeaker" class="speaker-icon"></i>
            <span v-if="user.isSpeaker">主讲人</span>
            <span>, 白板</span>
            )
          </span>
        </div>
      </div>
    </div>-->
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  watch,
  computed,
  onUnmounted
} from 'vue'
import { meInfo, whiteboardInfo } from '@/store/meeting'
import { loginService } from '@/core/services'
import { EnumTrackTag } from '@/types/meeting'
export default defineComponent({
  props: {
    user: Object
  },
  setup({ user }, { attrs, slots, emit }) {
    const rongcloudWhite = ref('')
    onMounted(() => {
      const whiteDom = rongcloudWhite.value as any
      whiteDom.src = whiteboardInfo.rcUrl
    })
    return {
      meInfo,
      rongcloudWhite
    }
  }
})
</script>

<style lang="scss" scoped>
.white-board {
  width: 100%;
  height: 100%;
  position: relative;
  //   margin: 1vh auto 0;
  //   box-shadow: 0 0 9px 2px #ccc;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  background: #fff;
  .white-tool-box {
    position: absolute;
    z-index: 10;
    height: 60px;
    right: 40px;
    bottom: 30px;
    border-radius: 45px;
    background-color: #fcfcfc;
    box-shadow: #1e4396 0px 0px 20px -7px;
    padding-left: 10px;
    padding-right: 10px;
    .tool-box-cell {
      width: 40px;
      height: 42px;
      float: left;
      margin: 9px 10px;
      font-size: 14px;
      color: #3d4041;
      text-align: center;
      cursor: pointer;
      position: relative;
    }
  }
  .tool-box-cell {
    .cell-icon {
      height: 20px;
      width: 20px;
      display: inline-block;
    }
    .pencil {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) 53px 1px;
    }
    .pencil-color {
      display: none;
      width: 110px;
      height: 110px;
      background: #fcfcfc;
      position: absolute;
      top: -125px;
      left: -10px;
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(0, 0, 0, 0.2);
      span {
        display: inline-block;
        width: 24px;
        height: 24px;
        margin: 3px;
      }
    }
    .word {
      background-size: 19px;
      width: 19px;
      height: 19px;
      margin-top: 1px;
      background: url(~@/assets/images/whiteboard/word-pre.svg);
    }
    .eraser {
      background: url(~@/assets/images/whiteboard/eraser-pre.svg);
    }
    .clear {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) -71px 1px;
    }
    .pagination {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) -139px 1px;
    }
    .new {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) 90px 1px;
    }
    .upload {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) 20px 1px;
    }
    .delete {
      background: url(~@/assets/images/whiteboard/opt-icons.svg) 160px 1px;
    }
    .upload-input {
      opacity: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      cursor: pointer;
    }
  }
  .pencil-color {
    .color-red {
      background: #ff0000;
    }
    .color-orange {
      background: #ffa500;
    }
    .color-yellow {
      background: #ffff00;
    }
    .color-blue {
      background: #0000ff;
    }
    .color-cyan {
      background: #00ffff;
    }
    .color-green {
      background: #008000;
    }
    .color-black {
      background: #000;
    }
    .color-purple {
      background: #800080;
    }
    .color-gray {
      background: #808080;
    }
  }
  .pre-scene {
    left: 0%;
  }
  .next-scene {
    right: 0%;
  }
  .close-white {
    position: absolute;
    top: 0;
    right: -15px;
    text-align: center;
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 14px;
    color: #fff;
    background: #333;
    border-radius: 3px;
    cursor: pointer;
  }
  .icons {
    // position: absolute;
    // top: 0;
    // left: 0;
    // width: 100%;
    // height: 100%;
    .icon {
      background: rgba(46, 53, 56, 1);
      border-radius: 0px 0px 0px 2px;
      opacity: 0.5;
      display: inline-block;
      font-size: 0px;
      i {
        width: 24px;
        height: 24px;
        display: inline-block;
        background-repeat: no-repeat;
        background-position: center center;
      }
      .top-icon {
        background-image: url(~@/assets/images/top_disable.svg);
      }
      .subscribe-icon {
        background-image: url(~@/assets/images/subscribe.svg);
      }
      .mic-icon {
        background-image: url(~@/assets/images/mic_user.svg);
      }
      .mic-icon-disable {
        background-image: url(~@/assets/images/mic_user_disable.svg);
      }
      .more-icon {
        background-image: url(~@/assets/images/more_small.svg);
      }
      .host-icon {
        background-image: url(~@/assets/images/host.svg);
      }
      .speaker-icon {
        background-image: url(~@/assets/images/speaker.svg);
      }
    }
    .is-icon-top {
      position: absolute;
      left: 0;
      top: 0;
    }
    .more {
      // float: right;
      cursor: pointer;
      position: absolute;
      right: 0px;
      top: 0px;
    }
    .info {
      position: absolute;
      left: 0px;
      bottom: 0px;
      line-height: 15px;
      font-size: 12px;
      font-weight: 400;
      color: rgba(255, 255, 255, 1);
      padding: 3px 9px 3px 4px;
      .user-show-name {
        position: relative;
        top: 0px;
        max-width: 85px;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .host-speaker {
        display: inline-block;
        i {
          position: relative;
          top: 5px;
        }
        .user-show-name {
          max-width: 100%;
        }
      }
    }
  }
}
#pencilColor {
  &::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 13px solid transparent;
    border-right: 13px solid transparent;
    border-top: 15px solid #fcfcfc;
    position: absolute;
    left: 41px;
    bottom: -14px;
  }
}
.white-board .pre-scene,
.white-board .next-scene {
  position: absolute;
  top: 45%;
  width: 50px;
  height: 50px;
  border-radius: 3px;
  background: #ccc;
  line-height: 46px;
  text-align: center;
  cursor: pointer;
}
.white-board .pre-scene img,
.white-board .next-scene img {
  vertical-align: middle;
}
</style>
