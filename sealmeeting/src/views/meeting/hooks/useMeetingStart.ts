import { useRoute } from 'vue-router'
import { loginAction } from '@/store/login'
import {
  loginService,
  meetingRoomService,
  serviceManager
} from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { storageUtil } from '@/utils/storageUtil'
import { onMounted, onUnmounted, watch } from 'vue'
import imCore, { imState } from '@/modules/IMCore'
import { appConfig } from '@/appConfig'
import { isLogin, meName } from '@/session'
import routerUtil from '@/utils/routerUtil'
import { settingAction } from '@/store/setting'
import { rtcState } from '@/modules/RTCCore'
export default () => {
  const route = useRoute()
  const query = route.query
  const meetingId = route.query.meetingId as string
  let tmKeepAlive: any = null
  onMounted(async () => {
    if (appConfig.launchFrom === 'rce') {
      const rceInfo = getRCEInfo()
      loginAction.updateLoginAuth(rceInfo)
      settingAction.updateSettig({
        isVideoOn: rceInfo.isVideoOn,
        isAudioOn: rceInfo.isAudioOn
      })
    }
    // 检查登陆
    if (!isLogin.value) {
      // 带参数去，当走时如果有参数，直接跳到meeting
      routerUtil.toLogin(query)
      return
    }
    await loginService.getNavConfig()
    // 检查加入会议
    if (appConfig.launchFrom !== 'meeting') {
      //加入会议
      await meetingRoomService.joinMeeting({
        meetingId: meetingId,
        userName: meName.value
      })
    }
    await startMeeting(meetingId)
    // 开启心跳
    !!tmKeepAlive && clearInterval(tmKeepAlive)
    tmKeepAlive = setInterval(() => {
      imCore.sendKeepAlive(meetingId)
    }, 1000 * 60 * 15)
  })
  onUnmounted(() => {
    !!tmKeepAlive && clearInterval(tmKeepAlive)
  })

  watch(
    () => imState.isConnected,
    async (val, preVal) => {
      console.log('isConnected changed-----------------', val, preVal)
      if (val && !rtcState.isConnected) {
        console.log('开始重新连接会议')
        meetingRoomService.release()
        await startMeeting(meetingId)
      }
    }
  )
  return {}
}

async function startMeeting(meetingId: string) {
  let code = await serviceManager.initSDK()
  if (code !== EnumErrorCode.OK) {
    return
  }
  code = await meetingRoomService.initMeeting(meetingId)
  if (code === EnumErrorCode.OK) {
    serviceManager.onMeetingStart()
  } else {
    serviceManager.onMeetingEnd()
  }
}

function getRCEInfo() {
  const rceInfo = window.RongDesktop?.configInfo?.webInfo || {}
  const info: any = {}
  !!rceInfo.USER_ID && (info.id = rceInfo.USER_ID)
  !!rceInfo.USER_NAME && (info.userName = rceInfo.USER_NAME)
  !!rceInfo.PORTRAIT && (info.portrait = rceInfo.PORTRAIT)
  !!rceInfo.IM_TOKEN && (info.imToken = rceInfo.IM_TOKEN)
  !!rceInfo.MICROPHONE_ID && (info.microphoneId = rceInfo.MICROPHONE_ID)
  !!rceInfo.CAMERA_ID && (info.cameraId = rceInfo.CAMERA_ID)
  !!rceInfo.CAMERA_RES && (info.cameraRes = rceInfo.CAMERA_RES)
  !!rceInfo.IS_VIDEO_ON && (info.isVideoOn = rceInfo.IS_VIDEO_ON)
  !!rceInfo.IS_AUDIO_ON && (info.isAudioOn = rceInfo.IS_AUDIO_ON)
  return info
}

function getRCEMediaInfo() {}
