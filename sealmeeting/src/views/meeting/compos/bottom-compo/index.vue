<template>
  <div class="bottom">
    <ToggleBtn
      class="right-has-ele"
      @click.native="operateAudio"
      :isNomalState="meInfo.isAudioOn"
      img1="mic.svg"
      img2="mic_disable.svg"
      :label="locale.microphone"
    ></ToggleBtn>
    <ToggleBtn
      class="right-has-ele"
      @click.native="operateVideo"
      :isNomalState="meInfo.isVideoOn"
      img1="camera.svg"
      img2="camera_disable.svg"
      :label="locale.camera"
    ></ToggleBtn>
    <div class="mid-icons">
      <ToggleBtn
        class="right-has-ele chat"
        @click.native="actDrawer('chat')"
        :isNomalState="true"
        img1="chat.svg"
        :label="locale.chat"
      >
        <div class="red-point" v-show="hasNewMessage"></div>
      </ToggleBtn>

      <el-dropdown class="drop-menus-share" @command="actShareCommands">
        <ToggleBtn
          :isNomalState="true"
          img1="shared.svg"
          :label="shareBtnName"
          @click.native="actShareBtn"
        ></ToggleBtn>
        <i class="arrow-icon right-has-ele"></i>
        <template #dropdown>
          <el-dropdown-menu v-if="isShareFuncEnable" slot="dropdown">
            <template v-if="isStartShareEnable">
              <el-dropdown-item command="startScreen">{{
                locale.screen
              }}</el-dropdown-item>
              <el-dropdown-item
                v-show="isStartWhiteBoardEnable"
                command="startWhiteBoard"
                >{{ locale.whiteBoard }}</el-dropdown-item
              >
              <el-dropdown-item command="startMediaFile">
                {{ locale.mediaFile }}
                <input
                  class="select-media"
                  type="file"
                  ref="fileInputRef"
                  @change="startShareMediaFile($event)"
                  accept="video/mp4"
                />
              </el-dropdown-item>
            </template>
            <template v-else>
              <el-dropdown-item
                v-show="isStopScreenEnable"
                command="stopScreen"
                >{{ locale.stopScreen }}</el-dropdown-item
              >
              <el-dropdown-item
                command="stopWhiteBoard"
                >{{ locale.stopWhiteBoard }}</el-dropdown-item
              >
              <el-dropdown-item
                v-show="isStopMediaFileEnable"
                command="stopMediaFile"
                >{{ locale.stopMediaFile }}</el-dropdown-item
              >
            </template>
          </el-dropdown-menu>
          <el-dropdown-menu v-if="!isShareFuncEnable" slot="dropdown"
            >当前已有人正在共享，请等待其结束再共享</el-dropdown-menu
          >
        </template>
      </el-dropdown>
      <ToggleBtn
        class="right-has-ele"
        @click.native="actDrawer('member')"
        :isNomalState="true"
        img1="user_list.svg"
        :label="locale.member"
      ></ToggleBtn>
      <el-dropdown @command="actMoreCommands">
        <ToggleBtn
          :isNomalState="true"
          img1="more.svg"
          :label="locale.more"
        ></ToggleBtn>
        <i class="arrow-icon"></i>
        <template #dropdown>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-show="isStartRecordEnable"
              command="startRecord"
              >{{ locale.startRecord }}</el-dropdown-item
            >
            <el-dropdown-item
              v-show="isStopRecordEnable"
              command="stopRecord"
              >{{ locale.stopRecord }}</el-dropdown-item
            >
            <el-dropdown-item command="invite">{{
              locale.invite
            }}</el-dropdown-item>
            <el-dropdown-item command="setting">{{
              locale.setting
            }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-button class="end-meeting" @click="actEndMeeting">{{
      locale.stopMeeting
    }}</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import localeStore from '@/store/localeStore'
import ToggleBtn from '@/compos/ToggleBtn.vue'
import { meInfo } from '@/store/meeting'
import { EnumTrackTag } from '@/types/meeting'
import useMeetingEnd from './hooks/useMeetingStop'
import useAVOperation from './hooks/useAVOperation'
import useShareOperation from './hooks/useShareOperation'
import useCommonOperation from './hooks/useCommonOperation'

export default defineComponent({
  components: {
    ToggleBtn
  },
  setup(props, { attrs, slots, emit }) {
    const locale = localeStore('meeting')
    const { operateAudio, operateVideo } = useAVOperation(meInfo)
    const {
      shareBtnName,
      isShareFuncEnable,
      isStartShareEnable,
      isStopScreenEnable,
      isStopWhiteBoardEnable,
      isStopMediaFileEnable,
      isStartWhiteBoardEnable,
      actShareCommands,
      actShareBtn,
      startShareMediaFile
    } = useShareOperation(meInfo)
    const {
      actDrawer,
      actMoreCommands,
      isStartRecordEnable,
      isStopRecordEnable,
      hasNewMessage
    } = useCommonOperation(meInfo)
    const { actEndMeeting } = useMeetingEnd()
    return {
      locale,
      meInfo,
      EnumTrackTag,

      operateAudio,
      operateVideo,

      shareBtnName,
      isShareFuncEnable,
      isStartShareEnable,
      isStopScreenEnable,
      isStopWhiteBoardEnable,
      isStopMediaFileEnable,
      isStartWhiteBoardEnable,
      actShareCommands,
      actShareBtn,
      startShareMediaFile,

      actDrawer,
      actMoreCommands,
      isStartRecordEnable,
      isStopRecordEnable,
      actEndMeeting,
      hasNewMessage
    }
  }
})
</script>
<style lang="scss" scoped>
.bottom {
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: 70px;
  padding: 8px 40px;
  background: rgba(255, 255, 255, 1);
  z-index: 1001;
  .mid-icons {
    position: absolute;
    right: 351px;
    top: 8px;
  }
  .right-has-ele {
    margin-right: 30px;
  }
  .end-meeting {
    padding: 9px 28px;
    border-radius: 0px;
    color: rgba(255, 86, 79, 1);
    border: 1px solid rgba(255, 86, 79, 1);
    float: right;
    margin-top: 7px;
  }
}

.arrow-icon {
  width: 16px;
  height: 16px;
  vertical-align: top;
  margin-top: 13px;
  cursor: pointer;
  background-size: 8px 6px;
  background-image: url(~@/assets/images/arrow.svg);
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center center;
}

.app-body-all {
  .main-container {
    .main-content {
      .six-items {
        .list {
          .big-stream-item {
            top: 60px;
            height: calc(100vh - 60px - 70px);
          }
        }
      }
    }
  }
}
.rong-setting-slide-enter-active,
.rong-setting-slide-leave-active {
  transition: 0.5s all;
}
.rong-setting-slide-enter,
.rong-setting-slide-leave-active {
  transform: translateX(100%);
}

.right-panel {
  position: absolute;
  right: 0px;
  top: 0px;
  width: 380px;
  height: 100%;
  padding-top: 40px;
  z-index: 1101;
}

.el-icon-info:before {
  content: none;
}

.select-media {
  font-size: 100px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  left: 0;
  position: absolute;
  opacity: 0;
  height: 30px;
  bottom: 10px;
}
.chat {
  position: relative;
  .red-point {
    width: 8px;
    height: 8px;
    background: #ff564f;
    position: absolute;
    border-radius: 50%;
    top: 0px;
    right: 0px;
  }
}
</style>