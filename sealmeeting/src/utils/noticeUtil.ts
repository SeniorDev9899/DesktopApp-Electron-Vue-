import { noticeAction } from '@/store/notice'
import {
  Action,
  Callback,
  ElMessageBoxOptions
} from 'element-plus/lib/el-message-box/src/message-box.type'
import { IUserModel } from '../types/meeting'
import { ENoticeGroup, ENoticeType, INotice } from '../types/notice'

export const getDeivceControlNotice = (callback: Callback) => {
  const options: ElMessageBoxOptions = {
    callback: callback,
    title: '通知',
    message: '管理员请求你打开设备',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    showCancelButton: true
  }
  return {
    key: 'control-device',
    type: ENoticeType.MsgBox,
    group: ENoticeGroup.Common,
    options: options
  } as INotice
}

export const getMeetingStoppedNotice = (callback?: Callback) => {
  const options: ElMessageBoxOptions = {
    callback: callback,
    title: '通知',
    message: '会议已经结束',
    confirmButtonText: '知道了'
  }
  return {
    key: 'meeting-stopped',
    type: ENoticeType.MsgBox,
    group: ENoticeGroup.Common,
    options: options
  } as INotice
}

export const getEndMeetingNotice = (meInfo: IUserModel, callback: Callback) => {
  const options: ElMessageBoxOptions = {
    callback: callback,
    title: '结束会议',
    distinguishCancelAndClose: true,
    message: meInfo.isHost
      ? '如果您不想结束会议，请在离开会议前指定新的主持人'
      : '确定要离开会议吗',
    confirmButtonText: meInfo.isHost ? '结束会议' : '离开会议',
    showCancelButton: true,
    cancelButtonText: meInfo.isHost ? '离开会议' : '取消'
  }
  return {
    key: 'end-meeting',
    type: ENoticeType.MsgBox,
    group: ENoticeGroup.Only,
    options: options
  } as INotice
}

export const showNotice = (notice: INotice): Promise<Action> => {
  return new Promise((resolve, reject) => {
    notice!.options!.callback = (action: Action) => {
      resolve(action)
    }
    noticeAction.noticeSet(notice)
  })
}

export const showCommonNotice = (msg: string): Promise<Action> => {
  return new Promise((resolve, reject) => {
    const notice = getCommonConfirmNotice(msg, (action: Action) => {
      resolve(action)
    })
    noticeAction.noticeSet(notice)
  })
}

function getCommonConfirmNotice(msg: string, callback: Callback) {
  const options: ElMessageBoxOptions = {
    callback: callback,
    title: '提示',
    message: msg,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    showCancelButton: true
  }
  return {
    key: 'common-confirm',
    type: ENoticeType.MsgBox,
    group: ENoticeGroup.Common,
    options: options
  } as INotice
}
