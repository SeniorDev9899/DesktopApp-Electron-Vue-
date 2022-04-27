import { EnumTrackTag } from '@/types/meeting'
import { meetingSetting, whiteboardInfo } from '.'

export class WhiteboardAction {
  public shareStarted(userId: string, info: any) {
    Object.assign(whiteboardInfo, info)
    meetingSetting.shareTrackTag = EnumTrackTag.WhiteBoard
    meetingSetting.shareUserId = userId + '-shadow'
  }
  public shareStoped() {
    this.clear()
  }
  public clear() {
    meetingSetting.shareTrackTag = ''
    meetingSetting.shareUserId = ''
    whiteboardInfo.type = 0
    whiteboardInfo.rcUrl = ''
    whiteboardInfo.hwUuid = ''
    whiteboardInfo.hwRoomToken = ''
  }
}
