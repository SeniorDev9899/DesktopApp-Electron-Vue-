<template>
  <div>
    <div class="user-list-box">
      <div class="title-bar">
        成员({{ users.length }})人
        <button
          type="button"
          aria-label="Close"
          class="el-message-box__headerbtn"
          @click="closeDrawer"
        >
          <i class="el-message-box__close el-icon-close"></i>
        </button>
      </div>
      <ul class="users-content">
        <InfoItemCompo
          v-for="(item, index) in users"
          :key="item.userId"
          :user="item"
        ></InfoItemCompo>
      </ul>
      <div v-if="meInfo.isHost" class="bottom-btns">
        <!-- 锁定会议 -->
        <el-button
          class="btn blue"
          v-if="meetingInfo.lockStatus === 0"
          @click="ctrlMeetingLock(true)"
          >锁定会议</el-button
        >
        <el-button
          class="btn blue"
          v-if="meetingInfo.lockStatus === 1"
          @click="ctrlMeetingLock(false)"
          >解锁会议</el-button
        >
        <!-- 录制、关闭会议 -->
        <el-button
          class="btn blue"
          v-if="meetingInfo.recordStatus === 0"
          @click="ctrlMeetingRecord(true)"
          >开始录制</el-button
        >
        <el-button
          class="btn blue"
          v-if="meetingInfo.recordStatus === 1"
          @click="ctrlMeetingRecord(false)"
          >结束录制</el-button
        >
        <!-- 全体静音 -->
        <el-button class="btn blue" @click="ctrlAllAudioMute"
          >全体静音</el-button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, watch } from 'vue'
import ToggleBtn from '@/compos/ToggleBtn.vue'
import InfoItemCompo from './InfoItemCompo.vue'
import localeStore from '@/store/localeStore'
import {
  userInfoList,
  meInfo,
  meetingInfo,
  meetingAction,
  userAction
} from '@/store/meeting'
import { meetingControlService, meetingRoomService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { ElMessage } from 'element-plus'
import useInfoList from './hooks/useInfoList'
import useRecord from './hooks/useRecord'
export default defineComponent({
  props: {
    hideRightPanel: Function,
    recordStart: Function,
    recordEnd: Function,
    isRecord: Boolean
  },
  components: {
    ToggleBtn,
    InfoItemCompo
  },
  setup(props, { attrs, slots, emit }) {
    const { closeDrawer, ctrlMeetingLock, ctrlAllAudioMute } = useInfoList()
    const { ctrlMeetingRecord } = useRecord()
    return {
      users: userInfoList,
      meInfo: meInfo,
      meetingInfo: meetingInfo,
      closeDrawer,
      ctrlMeetingLock,
      ctrlMeetingRecord,
      ctrlAllAudioMute
    }
  }
  // setup({ hideRightPanel }, { root }) {
  //   const userInfo = cache.get(Keys.USER_INFO);
  //   const allLocale = useLocale();
  //   const locale = reactive((allLocale.value as any).components.meetingHome);
  //   const userListTitle = ref('');
  //   const data = reactive({
  //     users: [],
  //   });
  //   const closePanel = () => {
  //     hideRightPanel();
  //   };

  //   const changeTop = (user: any) => {
  //     if (user.isTop) {
  //       rtc.unTopUser(user);
  //     } else {
  //       rtc.topUser(user);
  //     }
  //     // user.isTop = !user.isTop;
  //   };
  //   const changeMic = async (user: any) => {
  //     const operate = user.isOpenAudio ? 'close' : 'open';
  //     if (user.id === userInfo.id) {
  //       try {
  //         const user = rtc.getUser(userInfo);
  //         if (!user.isOpenAudio) {
  //           if (!user.stream.mediaStream) {
  //             const userStream = await rtc.publishMediaStream(
  //               userInfo.id,
  //               0,
  //               false,
  //               true
  //             );
  //             if (userStream === '10001') {
  //               root.$message.error(locale.openAudioAndVideo);
  //               return;
  //             }
  //             user.stream = userStream.stream;
  //           } else if (user.stream.mediaStream.getAudioTracks().length <= 0) {
  //             const videoLn = user.stream.mediaStream.getVideoTracks().length;
  //             const audioLn = user.stream.mediaStream.getAudioTracks().length;
  //             if (videoLn > 0) {
  //               await rtc.getStream({ audio: true, video: true });
  //               await rtc.unPublishMediaStream(user);
  //               const userStream = await rtc.publishMediaStream(
  //                 userInfo.id,
  //                 2,
  //                 false,
  //                 !videoLn
  //               );
  //               if (userStream === '10001') {
  //                 root.$message.error(locale.openAudioAndVideo);
  //                 return;
  //               }
  //               if (!user.isOpenCamera) {
  //                 await changeCamera(false);
  //               }
  //               user.stream = userStream.stream;
  //             }
  //           }
  //         }
  //         await rtc.operateAudio(user, !user.isOpenAudio);
  //       } catch (error) {
  //         root.$message.error(locale.openAudioAndVideo);
  //         console.warn(error);
  //         console.warn('当前在线用户数：', rtc.users.value.length);
  //       }
  //       return;
  //     }
  //     const tip = operate === 'open' ? locale.openMicTip : locale.closeMicTip;
  //     root
  //       .$confirm(tip, '', {
  //         confirmButtonText: locale.btnYes,
  //         cancelButtonText: locale.btnNo,
  //       })
  //       .then(async () => {
  //         await RongMTLib.controlDevice(
  //           [user.id],
  //           meetingService.DEVICE_TYPE.MIC,
  //           operate
  //         );
  //       });
  //   };

  //   const changeCamera = async (user: any) => {
  //     const operate = user.isOpenCamera ? 'close' : 'open';
  //     if (user.id === userInfo.id) {
  //       try {
  //         // console.warn(rtc.getUser(userInfo));
  //         const user = rtc.getUser(userInfo);
  //         if (!user.isOpenCamera) {
  //           if (!user.stream.mediaStream) {
  //             const userStream = await rtc.publishMediaStream(
  //               userInfo.id,
  //               1,
  //               true,
  //               false
  //             );
  //             if (userStream === '10001') {
  //               root.$message.error(locale.openAudioAndVideo);
  //               return;
  //             }
  //             user.stream = userStream.stream;
  //           } else if (user.stream.mediaStream.getVideoTracks().length <= 0) {
  //             const videoLn = user.stream.mediaStream.getVideoTracks().length;
  //             const audioLn = user.stream.mediaStream.getAudioTracks().length;
  //             if (audioLn > 0) {
  //               await rtc.getStream({ audio: true, video: true });
  //               await rtc.unPublishMediaStream(user);
  //               const userStream = await rtc.publishMediaStream(
  //                 userInfo.id,
  //                 2,
  //                 !audioLn,
  //                 false
  //               );
  //               if (userStream === '10001') {
  //                 root.$message.error(locale.openAudioAndVideo);
  //                 return;
  //               }
  //               user.stream = userStream.stream;
  //               if (!user.isOpenAudio) {
  //                 // TODO 手动静音
  //                 await rtc.operateAudio(user, false);
  //               }
  //             }
  //           }
  //         }
  //         await rtc.operateVideo(user, !user.isOpenCamera);
  //       } catch (error) {
  //         root.$message.error(locale.openAudioAndVideo);
  //         console.warn(error);
  //         console.warn('当前在线用户数：', rtc.users.value.length);
  //       }
  //       return;
  //     }

  //     const tip =
  //       operate === 'open' ? locale.openCameraTip : locale.closeCameraTip;
  //     root
  //       .$confirm(tip, '', {
  //         confirmButtonText: locale.btnYes,
  //         cancelButtonText: locale.btnNo,
  //       })
  //       .then(async () => {
  //         await RongMTLib.controlDevice(
  //           [user.id],
  //           meetingService.DEVICE_TYPE.CAMERA,
  //           operate
  //         );
  //       });
  //   };

  //   const muteAllUsers = () => {
  //     root
  //       .$confirm(locale.muteAllTip, '', {
  //         confirmButtonText: locale.btnYes,
  //         cancelButtonText: locale.btnNo,
  //       })
  //       .then(async () => {
  //         await RongMTLib.controlDevice(
  //           [],
  //           meetingService.DEVICE_TYPE.MIC,
  //           'close'
  //         );
  //         console.log('全体静音成功');
  //       });
  //   };

  //   const lockRoom = async (user: object) => {
  //     root
  //       .$confirm(locale.lockRoomTip, '', {
  //         confirmButtonText: locale.btnYes,
  //         cancelButtonText: locale.btnNo,
  //       })
  //       .then(async () => {
  //         await RongMTLib.updateMeetingLockStatus(userInfo.roomId, 1);
  //         userInfo.locked = true;
  //         cache.set(Keys.USER_INFO, userInfo);
  //       });
  //   };

  //   const unLockRoom = async (user: object) => {
  //     root
  //       .$confirm(locale.unLockRoomTip, '', {
  //         confirmButtonText: locale.btnYes,
  //         cancelButtonText: locale.btnNo,
  //       })
  //       .then(async () => {
  //         await RongMTLib.updateMeetingLockStatus(userInfo.roomId, 0);
  //         userInfo.locked = false;
  //         cache.set(Keys.USER_INFO, userInfo);
  //       });
  //   };

  //   watch(
  //     () => users.value,
  //     (newItems: Array<object>, oldItems: Array<object>) => {
  //       const usersAll: Array<IUserStream> = [];
  //       let speakerUser: IUserStream;
  //       let hostUSer: IUserStream;
  //       users.value.map((item: IUserStream) => {
  //         if (item.stream.tag === TAG.NORMAL || item.stream.type === -1) {
  //           if (item.isHost && item.id !== userInfo.id) {
  //             hostUSer = item;
  //             // usersAll.splice(1, 0, item);
  //           } else if (item.isSpeaker && item.id !== userInfo.id) {
  //             speakerUser = item;
  //           } else {
  //             usersAll.push(item);
  //           }
  //         }
  //       });
  //       if (speakerUser) {
  //         usersAll.splice(1, 0, speakerUser);
  //       }
  //       if (hostUSer) {
  //         usersAll.splice(1, 0, hostUSer);
  //       }
  //       data.users = usersAll;
  //       userListTitle.value = templateFormat(locale.user, data.users.length);
  //     },
  //     { lazy: false }
  //   );
  //   //  设置为主讲人
  //   const setSpeaker = async (user: any) => {
  //     const res = await RongMTLib.setSpeaker(userInfo.roomId, user.id);
  //     console.warn(res);
  //   };
  //   //  取消主讲人身份
  //   const unSetSpeaker = async (user: any) => {
  //     const res = await RongMTLib.unSetSpeaker(userInfo.roomId, user.id);
  //     console.warn(res);
  //   };
  //   // 设置为主持人
  //   const transferHost = async (user: any) => {
  //     const res = await RongMTLib.transferHost(userInfo.roomId, user.id);
  //     console.warn(res);
  //   };
  //   // 设置为主持人
  //   const removeMeeting = async (user: any) => {
  //     const res = await RongMTLib.kickOutUser(userInfo.roomId, user.id);
  //   };
  //   // const recordStart = async () => {
  //   //   const user = getUser(userInfo);
  //   //   const room = getRoom();
  //   //   const streamId =
  //   //     user.stream.mediaStream && user.stream.mediaStream.streamId;
  //   //   await meetingService.recordStart(
  //   //     userInfo.roomId,
  //   //     room.sessionId,
  //   //     userInfo.id,
  //   //     streamId
  //   //   );
  //   //   userInfo.isRecord = true;
  //   //   cache.set(Keys.USER_INFO, userInfo);
  //   // };
  //   // const recordEnd = async () => {
  //   //   const room = getRoom();
  //   //   await meetingService.recordEnd(userInfo.roomId, room.sessionId);
  //   //   userInfo.isRecord = false;
  //   //   cache.set(Keys.USER_INFO, userInfo);
  //   // };
  //   const updateUsername = () => {
  //     const commontLocale = (allLocale.value as any).common;
  //     console.log(commontLocale.validateTip.name);
  //     root
  //       .$prompt('', locale.updateUsername, {
  //         confirmButtonText: commontLocale.btns.on,
  //         cancelButtonText: commontLocale.btns.cancel,
  //         inputPattern: /^[\u4E00-\u9FA5 A-Za-z0-9]{1,40}$/,
  //         inputErrorMessage: commontLocale.validateTip.name,
  //         center: true,
  //         customClass: 'prompt-update-name',
  //       })
  //       .then(async (param: any) => {
  //         const [msg] = await meetingService.modifyMeetingUserName(
  //           userInfo.roomId,
  //           param.value
  //         );
  //         if (!msg) {
  //           root.$message.success(locale.updateUsername_success_tip);
  //           rtc.updateUser(data.users[0], { userName: param.value });
  //         } else {
  //           root.$message.error(locale.updateUsername_error_tip);
  //         }
  //       });
  //   };
  //   // 人员管理下来显示信息
  //   const dropdownCommand = (command: string) => {
  //     if (command === 'updateUsername') {
  //       updateUsername();
  //       return;
  //     }
  //     const key = command.split('_')[0];
  //     const index = parseInt(command.split('_')[1]);
  //     const methodMap: any = {
  //       setSpeaker: setSpeaker,
  //       unSetSpeaker: unSetSpeaker,
  //       transferHost: transferHost,
  //       removeMeeting: removeMeeting,
  //     };
  //     methodMap[key](data.users[index], userInfo);
  //   };
  //   return {
  //     data,
  //     closePanel,

  //     userInfo,
  //     changeTop,
  //     changeMic,
  //     changeCamera,
  //     muteAllUsers,

  //     lockRoom,
  //     unLockRoom,
  //     locale,
  //     userListTitle,
  //     dropdownCommand,
  //   };
  // },
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
