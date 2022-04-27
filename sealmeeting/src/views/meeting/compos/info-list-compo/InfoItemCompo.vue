<template>
  <li class="user-item" v-if="!user.isShadow">
    <Avatar class="avatar" :user="user" :fontSize="12"></Avatar>
    <div class="user-label">
      <span class="name">{{ user.userName }}</span>
      <span class="role">{{ userTag }}</span>
    </div>
    <div class="right-btns">
      <ToggleBtn
        v-if="isTopVisible"
        @click.native="actUserTop"
        :isNomalState="!user.isTop"
        img1="top.svg"
        img2="top_disable.svg"
        :size="24"
        label
      ></ToggleBtn>
      <ToggleBtn
        class="left-margin"
        @click.native="actUserAudio"
        :isNomalState="user.isAudioOn"
        label
        img1="mic_small.svg"
        img2="mic_small_disable.svg"
        :size="24"
        v-if="isAudioVisible"
      ></ToggleBtn>
      <ToggleBtn
        class="left-margin"
        @click.native="actUserVideo"
        :isNomalState="user.isVideoOn"
        label
        img1="camera_small.svg"
        img2="camera_small_disable.svg"
        :size="24"
        v-if="isVideoVisible"
      ></ToggleBtn>
      <el-dropdown
        v-if="isDropdownVisible"
        :hide-on-click="false"
        @command="actMoreCommands"
        trigger="click"
      >
        <ToggleBtn
          class="left-margin"
          :isNomalState="true"
          :otherStyle="{
            width: '30px',
            height: '25px',
            transform: 'scale(0.7)'
          }"
          img1="more.svg"
        ></ToggleBtn>
        <i class="arrow-icon"></i>
        <template #dropdown>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-if="isTransferHostVisible"
              command="transferHost"
              >移交主持人</el-dropdown-item
            >
            <el-dropdown-item v-if="isSetSpeakerVisible" command="setSpeaker"
              >设为主讲</el-dropdown-item
            >
            <el-dropdown-item
              v-if="isCancelSpeakerVisible"
              command="cancelSpeaker"
              >取消主讲</el-dropdown-item
            >
            <el-dropdown-item v-if="isKickUserVisible" command="kickUser"
              >移出会议</el-dropdown-item
            >
            <el-dropdown-item v-if="isChangeNameVisible" command="changeName"
              >修改用户名</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </li>
</template>

<script lang="ts">
import { computed, defineComponent, watchEffect, watch } from 'vue'
import Avatar from '@/compos/Avatar.vue'
import localeStore from '@/store/localeStore'
import { IUserModel } from '@/types/meeting'
import { meInfo, userAction } from '@/store/meeting'
import {
  meetingControlService,
  meetingOperateService,
  meetingRoomService
} from '@/core/services'
import ToggleBtn from '@/compos/ToggleBtn.vue'
import { noticeAction } from '@/store/notice'
import { ElMessageBoxOptions } from 'element-plus/lib/el-message-box/src/message-box.type'
import { Action } from 'element-plus/lib/el-message-box/src/message-box.type'
import { ENoticeGroup, ENoticeType, INotice } from '@/types/notice'
import useUserInfo from './hooks/useUserInfo'
export default defineComponent({
  props: {
    user: {
      type: Object,
      require: true
    }
  },
  components: {
    Avatar,
    ToggleBtn
  },
  setup(props, { attrs, slots, emit }) {
    const userState = useUserInfo(props.user as IUserModel)
    return {
      ...userState
    }
  }
})
</script>

<style lang="scss" scoped>
.user-list-box {
  padding-bottom: 125px;
  background: rgba(255, 255, 255, 1);
  width: 100%;
  height: 100%;
  box-shadow: -2px 0px 6px 0px rgba(6, 66, 96, 0.1);
  .title-bar {
    height: 44px;
    border-bottom: 1px solid rgba(228, 230, 231, 1);
    text-align: center;
    line-height: 44px;
    font-size: 14px;
    font-weight: 400;
    position: relative;
  }
  // .users-container {
  .users-content {
    height: 100%;
    overflow: auto;
    .user-item {
      width: 100%;
      height: 54px;
      padding: 0px 10px;
      .avatar {
        width: 32px;
        height: 32px;
        margin-top: 11px;
        display: inline-block;
        margin-top: 11px;
        vertical-align: top;
      }
      .user-label {
        display: inline-block;
        font-weight: 400;
        font-size: 12px;
        line-height: 17px;
        margin-top: 10px;
        margin-left: 6px;
        .name {
          display: block;
          color: #2e3538;
        }
        .role {
          display: block;
          color: #8f9ca3;
          margin-top: 1px;
        }
      }
      .right-btns {
        float: right;
        margin-top: 15px;
        .left-margin {
          margin-left: 15px;
        }
      }
    }
  }
  // }
  .bottom-btns {
    .btn {
      padding: 7px 10px 8px 10px;
      border-radius: 2px;
      line-height: 17px;
      font-size: 12px;
    }
    // .btn:first-child {
    //   margin-right: 40px;
    // }
    padding: 20px 21px;
    border-top: solid 1px #e4e6e7;
    border-bottom: solid 1px #e4e6e7;
    text-align: center;
  }
}
.el-message-box__headerbtn {
  top: 10px;
}
.el-message-box__status {
  display: none;
}
.el-message-box__btns {
  text-align: center;
}
</style>
