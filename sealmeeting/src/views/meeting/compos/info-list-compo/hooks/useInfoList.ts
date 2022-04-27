import { meetingControlService, meetingRoomService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { meetingAction } from '@/store/meeting'
import { ElMessage } from 'element-plus'
import { showCommonNotice } from '@/utils/noticeUtil'

export default () => {
  const closeDrawer = async () => {
    meetingAction.drawerClosed()
  }
  const ctrlMeetingLock = async (isLock: boolean) => {
    const lockStatus = isLock ? 1 : 0
    if (lockStatus === 1) {
      const action = await showCommonNotice(
        `锁定房间之后，后续人员将不能进入房间，是否继续？`
      )
      if (action !== 'confirm') return
    }

    await meetingRoomService.ctrlMeetingLock(isLock)
    const msg = isLock ? '会议已锁定' : '会议已解锁'
    ElMessage.info(msg)
  }
  const ctrlAllAudioMute = async () => {
    await meetingControlService.ctrlUserAudio('', false)
  }
  return {
    closeDrawer,
    ctrlMeetingLock,
    ctrlAllAudioMute
  }
}
