import {
  createMeetingInfo,
  createMeetingSetting,
  EnumTrackTag
} from '@/types/meeting'
import { meetingInfo, meetingSetting, meInfo, userMap } from '.'

export class MeetingAction {
  public meetingUpdate(info: any) {
    Object.assign(meetingInfo, info)
  }

  public settingUpdate(info: any) {
    Object.assign(meetingSetting, info)
  }

  public startShare(userId: string, tag: EnumTrackTag) {}

  public stopShare() {}

  public actHostChanged(fromId: string, toId: string) {
    const operator = userMap.get(fromId)
    operator && (operator.isHost = false)
    const targetor = userMap.get(toId)
    targetor && (targetor.isHost = true)
    this.meetingUpdate({ hostId: toId })
  }

  public actSpeakerChanged(userId: string, isSpeaker: boolean) {
    const user = userMap.get(userId)
    !!user && (user.isSpeaker = isSpeaker)
    meetingInfo.speakerId = isSpeaker ? userId : ''
    meetingSetting.speakerId = isSpeaker ? userId : ''
    if (!isSpeaker) {
      // 主取消主讲时，将全屏恢复
      meetingSetting.isFocusFull = false
    }
  }

  /**
   * 使用户进入焦点，或失去焦点
   * @param userId 用户ID
   */
  public focusUser(userId: string) {
    if (userId === meInfo.userId + '-shadow') {
      if (meetingSetting.shareTrackTag === EnumTrackTag.ScreenShare) {
        return
      }
    }
    meetingSetting.isFocusFull = false
    meetingSetting.foucsUserId = userId
  }

  /**
   * 使用户进入全屏，或取消全屏
   * @param userId 用户ID
   */
  public fullUser(userId: string) {
    if (
      meetingSetting.foucsUserId === userId ||
      meetingSetting.shareUserId === userId ||
      meetingSetting.speakerId === userId
    ) {
      meetingSetting.isFocusFull = !meetingSetting.isFocusFull
    }
  }

  /**
   * 强行进入FocusMode
   */
  public setFocusMode() {
    meetingSetting.isFocusFull = false
    meetingSetting.foucsUserId = meInfo.userId
  }

  /**
   * 强行进入普通九宫格模式
   */
  public setNormalMode() {
    meetingSetting.isFocusFull = false
    meetingSetting.foucsUserId = ''
  }

  public switchChatDrawer() {
    meetingSetting.isChatDrawerShow = !meetingSetting.isChatDrawerShow
    meetingSetting.isChatDrawerShow && (meetingSetting.isUserDrawerShow = false)
  }

  public switchUserDrawer() {
    meetingSetting.isUserDrawerShow = !meetingSetting.isUserDrawerShow
    meetingSetting.isUserDrawerShow && (meetingSetting.isChatDrawerShow = false)
  }

  public drawerClosed() {
    meetingSetting.isUserDrawerShow = false
    meetingSetting.isChatDrawerShow = false
  }

  public clear() {
    Object.assign(meetingInfo, createMeetingInfo())
    Object.assign(meetingSetting, createMeetingSetting())
  }
}
