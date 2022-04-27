<template>
  <div
    :class="[viewModeStyle, normalModeStyle, focusModeStyle]"
    style="user-select: none"
  >
    <div class="stream-item" @dblclick="actMeFocusBig">
      <!-- <slot name="viewChange"></slot> -->
      <div class="default-bg" @dblclick="videoClick" v-show="isAvatarVisible">
        <Avatar class="avatar" :user="user" :fontSize="40"></Avatar>
      </div>
      <div class="stream" @dblclick="videoClick" v-if="isWhiteboardVisible">
        <Whiteboard :user="user"></Whiteboard>
      </div>
      <div class="stream" @dblclick="videoClick" v-else v-show="user.isVideoOn">
        <video
          class="rong-video"
          autoplay
          :id="user.userId"
          muted
          ref="videoEle"
          loop
        ></video>
      </div>
      <!-- 置顶 -->
      <div class="icon is-icon-top" v-if="isTopVisible">
        <i class="top-icon"></i>
      </div>
      <div v-if="isMenuVisible" class="menu">
        <el-dropdown size="mini" @command="meneComman" trigger="click">
          <div class="icon">
            <i class="more-icon"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-if="user.isTop"
                style="width: 80px"
                command="unTop"
                >{{ locale.cancelTop }}</el-dropdown-item
              >
              <el-dropdown-item
                v-if="!user.isTop"
                style="width: 80px"
                command="top"
                >{{ locale.top }}</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <!-- 图标 -->
      <div class="icon info">
        <i class="mic-icon" v-if="!user.isShadow && user.isAudioOn"></i>
        <i
          class="mic-icon-disable"
          v-if="!user.isShadow && !user.isAudioOn"
        ></i>
        <span class="user-show-name">{{ user.userName }}</span>
        <div
          class="host-speaker"
          v-if="user.isHost || user.isSpeaker || user.isShadow"
        >
          <span class="user-show-name">
            (
            <i v-if="user.isHost" class="host-icon"></i>
            <span v-if="user.isHost">{{ locale.host }}</span>
            <span v-if="user.isHost && user.isSpeaker">,</span>
            <i v-if="user.isSpeaker" class="speaker-icon"></i>
            <span v-if="user.isSpeaker">{{ locale.speaker }}</span>
            <span v-if="videoType">, {{ videoType }}</span>
            )
          </span>
        </div>
      </div>
      <!-- 最大化 -->
      <div v-if="isUserFocused" class="full-pannel">
        <i
          :class="meetingSetting.isFocusFull ? 'full-cancel' : 'full-set'"
          @click="actMeFocusFull"
        ></i>
        <!-- <i v-else class="full-cancel" @click="actMeFocusFull"></i> -->
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  Ref,
  ref,
  watch,
  watchEffect
} from 'vue'
import localeStore from '@/store/localeStore'
import { meetingAction } from '@/store/meeting'
import useMediaStyle from './hooks/useMediaStyle'
import useVideoDisplay from './hooks/useVideoDisplay'
import Avatar from '@/compos/Avatar.vue'
import Whiteboard from './WhiteboardCompo.vue'
import { IUserModel, EnumTrackTag } from '@/types/meeting'
import { meetingSetting } from '@/store/meeting'
export default defineComponent({
  props: {
    user: {
      type: Object,
      require: true
    }
  },
  components: {
    Avatar,
    Whiteboard
  },
  setup({ user }, { attrs, slots, emit }) {
    const locale = localeStore('meeting')
    const {
      viewModeStyle,
      normalModeStyle,
      focusModeStyle,
      actMeFocusBig,
      actMeFocusFull,
      isUserFocused,
      isTopVisible,
      videoType,
      isMenuVisible,
      isWhiteboardVisible,
      isAvatarVisible,
      meneComman
    } = useMediaStyle(user as IUserModel)
    const videoDisplay = useVideoDisplay(user as IUserModel)
    return {
      viewModeStyle,
      normalModeStyle,
      focusModeStyle,
      actMeFocusBig,
      actMeFocusFull,
      isUserFocused,
      videoDisplay,
      isTopVisible,
      videoType,
      isMenuVisible,
      isWhiteboardVisible,
      isAvatarVisible,
      meneComman,
      locale,
      EnumTrackTag,
      meetingSetting
    }
  }
})
</script>
<style lang="scss" scoped>
.normal-mode {
  height: calc(33.33%);
  width: calc(33.33%);
  padding: 10px;
  float: left;
  // border: 1px solid blue;
}
.normal-users1 {
  width: calc(100%);
  height: calc(100%);
}
.normal-users2 {
  width: calc(50%);
  height: calc(100%);
}
.normal-users3,
.normal-users4 {
  width: calc(50%);
  height: calc(50%);
}
.normal-users5,
.normal-users6 {
  height: calc(50%);
  width: calc(33.33%);
}

.focus-mode {
  width: 100%;
  height: 140px;
  padding: 5px;
}
.focus-big {
  position: absolute;
  left: 0px;
  top: 40px;
  height: calc(100vh - 110px);
  width: calc(100vw - 250px);
}
.focus-full {
  position: absolute;
  left: 0px;
  top: 40px;
  height: calc(100vh - 110px);
  width: calc(100vw);
  z-index: 10;
}
.stream-item {
  position: relative;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.3);
  height: 100%;
  width: 100%;
  background-color: black;
  .default-bg {
    width: 100%;
    height: 100%;
    .avatar {
      width: 80px;
      height: 80px;
      top: 50%;
      right: 50%;
      position: absolute;
      transform: translate(50%, -50%);
    }
  }
  .stream {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    video {
      width: 100%;
      height: 100%;
    }
  }
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
    // .speaker-icon {
    //   background-image: url(~@//assets/images/speaker.png);
    // }
    .speaker-icon {
      background-image: url(~@/assets/images/speaker.svg);
    }
  }
  .is-icon-top {
    position: absolute;
    left: 0;
    top: 0;
  }
  .menu {
    cursor: pointer;
    position: absolute;
    cursor: pointer;
    right: 0;
    top: 0;
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
  .full-pannel {
    width: 30px;
    height: 30px;
    display: inline-block;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1099;
    // background: #000;
    .full-set {
      display: inline-block;
      width: 30px;
      height: 30px;
      background-image: url(~@/assets/images/view_max.svg);
      background-repeat: no-repeat;
      background-size: 100%;
      cursor: pointer;
      z-index: 1099;
    }
    .full-cancel {
      display: inline-block;
      width: 30px;
      height: 30px;
      background-image: url(~@/assets/images/view_min.svg);
      background-repeat: no-repeat;
      background-size: 100%;
      cursor: pointer;
      z-index: 1099;
    }
  }
}
</style>