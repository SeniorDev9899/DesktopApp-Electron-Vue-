import router from '@/utils/routerUtil'
import {
  meetingOperateService,
  meetingRoomService,
  serviceManager
} from '@/core/services'
import { getEndMeetingNotice } from '@/utils/noticeUtil'
import { onEvent } from '@/store/event'
import { meInfo } from '@/store/meeting'
import { noticeAction } from '@/store/notice'
import { Action } from 'element-plus/lib/el-message-box/src/message-box.type'
import { onUnmounted } from '@vue/runtime-core'
import { meetingId } from '@/session'

export default () => {
  /**
   * 会议被结束，或我被T出会议
   */
  const ctrlMeetingEnded = () => {
    meetingRoomService.leaveMeeting(false)
    serviceManager.onMeetingEnd()
  }
  onEvent('ctrl:meetingEnded', ctrlMeetingEnded)
  onUnmounted(() => {
    if (meetingId.value) {
      console.log(
        '页面离开时，meeting未释放，补偿离开会议，onUnmounted.meetingId:',
        meetingId.value
      )
      meetingRoomService.leaveMeeting(false)
      serviceManager.onMeetingEnd()
    }
  })
  window.onbeforeunload = (e: BeforeUnloadEvent) => {
    if (meetingId.value) {
      console.log(
        '页面离开时，meeting未释放，补偿离开会议，onUnmounted.meetingId:',
        meetingId.value
      )
      meetingRoomService.leaveMeeting(false)
      serviceManager.onMeetingEnd()
    }
  }
  const actEndMeeting = () => {
    const notice = getEndMeetingNotice(meInfo, async (action: Action) => {
      if (action === 'confirm') {
        meetingRoomService.leaveMeeting(meInfo.isHost)
        serviceManager.onMeetingEnd()
        router.toHome()
      } else if (action === 'cancel') {
        if (meInfo.isHost) {
          meetingRoomService.leaveMeeting(false)
          serviceManager.onMeetingEnd()
          router.toHome()
        }
      }
    })
    noticeAction.noticeSet(notice)
  }
  return {
    actEndMeeting
  }
}
