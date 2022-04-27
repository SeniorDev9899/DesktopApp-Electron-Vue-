import meetingControlApi from '@/core/api/meetingControlApi'
import { meId, meetingId } from '@/session'
import { meetingAction, meetingSetting, userAction } from '@/store/meeting'
import { EnumErrorCode } from '@/types/Enums'
import meetingApi from '@/core/api/meetingApi'
import { showCommonNotice } from '@/utils/noticeUtil'
import { IService } from '@/core/services'
export class MeetingControlService implements IService {
  constructor() {}
  onMeetingStart(): void {}
  onMeetingEnd(): void {}
  onLogout(): void {}

  public async ctrlUserAudio(userId: string, isOpen: boolean) {
    let text = ''
    if (userId === '') {
      text = `所有成员将被静音，但成员可以自行重新打开麦克风，是否继续？`
    } else {
      text = `确定${isOpen ? '打开' : '关闭'}其麦克风？`
    }
    const action = await showCommonNotice(text)
    if (action !== 'confirm') return
    const rst = await meetingControlApi.deviceControl(
      meetingId.value,
      'mic',
      isOpen ? 'open' : 'close',
      userId ? [userId] : []
    )
  }

  public async ctrlUserVideo(userId: string, isOpen: boolean) {
    const action = await showCommonNotice(
      `确定${isOpen ? '打开' : '关闭'}其摄像头？`
    )
    if (action !== 'confirm') return
    const rst = await meetingControlApi.deviceControl(
      meetingId.value,
      'camera',
      isOpen ? 'open' : 'close',
      userId ? [userId] : []
    )
  }

  public async ctrlUserKick(userId: string) {
    const action = await showCommonNotice(`确认将其用户移除会议吗`)
    if (action !== 'confirm') return
    const rst = await meetingControlApi.kickUser(meetingId.value, userId)
    if (rst.code === EnumErrorCode.OK) {
      userAction.actUserKick(userId)
    }
  }

  public async ctrlHostTransfer(targetUserId: string) {
    const action = await showCommonNotice('确认将其设置为主持人吗？')
    if (action !== 'confirm') return
    const rst = await meetingControlApi.transferHost(
      meetingId.value,
      targetUserId
    )
    if (rst.code === EnumErrorCode.OK) {
      meetingAction.actHostChanged(meId.value, targetUserId)
    }
  }

  public async ctrlSpeakerSet(userId: string) {
    const action = await showCommonNotice('确认将其设置为主讲吗？')
    if (action !== 'confirm') return
    const rst = await meetingControlApi.setSpeaker(meetingId.value, userId)
    if (rst.code === EnumErrorCode.OK) {
      !!meetingSetting.speakerId &&
        meetingAction.actSpeakerChanged(meetingSetting.speakerId, false)
      meetingAction.actSpeakerChanged(userId, true)
    }
  }

  public async ctrlSpeakerCancel(userId: string) {
    const rst = await meetingControlApi.cancelSpeaker(meetingId.value, userId)
    if (rst.code === EnumErrorCode.OK) {
      meetingAction.actSpeakerChanged(userId, false)
    }
  }

  public async ctrlChangeName(userId: string, userName: string) {
    const rst = await meetingApi.changeUserDisplayName(
      meetingId.value,
      userName
    )
    if (rst.code === EnumErrorCode.OK) {
      userAction.userUpdate({ userId: userId, userName: userName })
    }
  }
}
