import { reactive, readonly } from "vue";
import { MsgAction } from './msgAction'
export interface IMessage {
  id: string,
  isSend: boolean,
  status: number,
  content: string,
  user: any,
  sendTime: number,
}
export const msgList: IMessage[] = reactive([])
export const msgMap: Map<String, IMessage> = new Map<String, any>()
export const msgAction = new MsgAction()