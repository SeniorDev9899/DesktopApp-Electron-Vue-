import { meetingAction, meInfo, meetingSetting } from '@/store/meeting'
import { meId, meetingId } from '@/session'
import imCore from '@/modules/IMCore'
import { msgAction } from '@/store/msg'
import { IMessage } from '@/store/msg'
import { IService } from '@/core/services'
const { getRongEmoji } = require('@/assets/js/RongEmoji')

export const imEmoji = getRongEmoji()
export class MsgService implements IService {
  constructor() {}
  onMeetingStart(): void {
    // 收到他人消息
    imCore.onMsg('RC:TxtMsg', this.onMsgReceived)
    // 收到自己消息的发送状态
    imCore.onMsg('RC:TxtMsg-Sended', this.onMsgSended)
  }
  onMeetingEnd(): void {
    imCore.offMsg('RC:TxtMsg', this.onMsgReceived)
    imCore.offMsg('RC:TxtMsg-Sended', this.onMsgSended)
  }
  onLogout(): void {}

  private onMsgReceived(msg: any) {
    if (msg.user.id !== meId.value) {
      const iMsg = {
        id: '',
        isSend: false,
        status: 1,
        ...msg
      } as IMessage
      msgAction.msgAdd(iMsg)
      if (!meetingSetting.isChatDrawerShow) {
        meetingAction.settingUpdate({ hasNewMessage: true })
      }
    } else {
      console.log('我自己发的消息也收到了！！！！！！！！！！！！', msg)
    }
  }

  private onMsgSended(result: any) {
    msgAction.msgStatusUpdate(result.msgId, result.status)
  }

  public sendMessage(txt: string) {
    const msgContent = {
      content: txt,
      user: {
        id: meInfo.userId,
        name: meInfo.userName,
        portrait: meInfo.portrait
      }
    }
    const iMsg = {
      id: this.genMsgId(),
      isSend: true,
      status: 0,
      ...msgContent
    } as IMessage
    msgAction.msgAdd(iMsg)
    imCore.sendMessage(meetingId.value, iMsg.id, msgContent)
  }

  private genMsgId(min: number = 100000, max: number = 900000): string {
    return Math.floor(Math.random() * (max - min)) + min + ''
  }
}
