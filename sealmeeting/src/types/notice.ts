import { ElMessageBoxOptions } from 'element-plus/lib/el-message-box/src/message-box.type'
export enum ENoticeType {
  MsgBox = 'MsgBox',
  Dialog = 'Dialog'
}
export enum ENoticeGroup {
  Only = 'Only', // 仅有一个
  Common = 'Common' // 通用
}
export interface INotice {
  type: ENoticeType
  key: string
  group: ENoticeGroup
  options: ElMessageBoxOptions | undefined
}
export interface IMsgBoxOptions {
  title: string
  message: string
  confirmButtonText: string
  showCancelButton: boolean
  cancelButtonText: string
}
