import { timeUtil } from '@/utils/timeUtil'
import { reactive } from 'vue'
import { msgMap, msgList, IMessage } from '.'
export class MsgAction {
  private _lastSendTime: number = timeUtil.getNowInt() - 1000000
  msgAdd(msg: IMessage) {
    if (!timeUtil.isLessThan(this._lastSendTime, 300)) {
      this._lastSendTime = timeUtil.getNowInt()
      msg.sendTime = this._lastSendTime
    }
    if (msg.isSend) {
      const msgId = msg.id
      const rstIMsg = reactive(msg)
      msgMap.set(msgId, rstIMsg)
      msgList.push(rstIMsg)
    } else {
      msgList.push(msg)
    }
  }
  msgStatusUpdate(msgId: string, status: number) {
    const msg = msgMap.get(msgId)
    if (msg) {
      msg.status = status
      msgMap.delete(msgId)
    }
  }
}
