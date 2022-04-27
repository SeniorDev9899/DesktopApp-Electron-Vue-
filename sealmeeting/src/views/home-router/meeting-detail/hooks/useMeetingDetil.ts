import { onMounted, reactive, ref, Ref, watch, computed } from 'vue'
import { useRoute, RouteLocationNormalizedLoaded } from 'vue-router'
import { meetingRoomService } from '@/core/services'
import routerUtil from '@/utils/routerUtil'
import { showCommonNotice } from '@/utils/noticeUtil'
import { meName } from '@/session'
import parseErrorCode from '@/utils/errorUtil'
import { ElMessage } from 'element-plus'
import { EnumErrorCode } from '@/types/Enums'
import router from '@/utils/routerUtil'
import { createMeetingInfo, IMeetingInfo } from '@/types/meeting'
import { timeUtil } from '@/utils/timeUtil'

// 会议详情数据
export const useDetialInfo = () => {
  const meetingInfo = reactive(createMeetingInfo())
  onMounted(async () => {
    let route = useRoute()
    let id = route.params.id as string
    let detialRes = await meetingRoomService.getMeetingInfo(id)
    !!detialRes && Object.assign(meetingInfo, detialRes)
  })
  const startTime = computed(() => {
    return timeUtil.formatTime(meetingInfo.startDt, true)
  })
  const stopTime = computed(() => {
    if (meetingInfo.endDt > 0) {
      return timeUtil.formatTime(meetingInfo.endDt, false)
    }
    return ''
  })
  return { meetingInfo, startTime, stopTime }
}

export const useCommon = () => {
  const upPage = () => routerUtil.toHome()
  const visible = ref(false)
  // 事件
  // 加入会议
  const handleJoinMeetingItem = async (meetingId: string, pwd: string) => {
    const { errorCode } = await meetingRoomService.joinMeeting({
      meetingId: meetingId,
      password: pwd,
      userName: meName.value
    })
    if (errorCode !== EnumErrorCode.OK) {
      const msg = parseErrorCode(errorCode)
      ElMessage.error(msg)
      return
    }
    router.toMeeting({ meetingId, from: 'meeting' })
  }

  // 邀请
  const handleInvitationMeetingItem = () => {
    visible.value = true
  }
  // 删除会议
  const handleDeleteMeetingItem = async (
    route: RouteLocationNormalizedLoaded
  ) => {
    const action = await showCommonNotice(`确认删除该会议？`)
    if (action !== 'confirm') return
    let id = route.params.id
    let res = await meetingRoomService.meetingDeleteOneService(id as string)
    if (res === true) {
      upPage()
    }
  }
  return {
    handleJoinMeetingItem,
    handleInvitationMeetingItem,
    handleDeleteMeetingItem,
    upPage,
    visible
  }
}
