import { IResponse } from './base'
import Abstract from './base/abstract'
import { stringFormat } from '@/utils/systemUtil'
import { appConfig } from '@/appConfig'

export enum EnumMeetingControlUrl {
  Login = '/user/login',
  meetingInfo = '/meetings/{0}',
  stopMeeting = '/meetings/{0}/end',
  lockMeeting = '/meetings/{0}/lockStatus',
  deviceControl = '/meetings/{0}/deviceControl',
  deviceControlAccept = '/meetings/{0}/deviceControl/accept',
  deviceControlReject = '/meetings/{0}/deviceControl/reject',
  kickUser = '/meetings/{0}/kick',
  transferHost = '/meetings/{0}/transferHost',
  setSpeaker = '/meetings/{0}/setSpeaker',
  cancelSpeaker = '/meetings/{0}/unSetSpeaker',
  startShare = '/meetings/{0}/shareResource/start',
  stopShare = '/meetings/{0}/shareResource/end'
}

class MeetingControlApi extends Abstract {
  constructor() {
    super('control')
  }
  public login(userId: string, token: string): Promise<IResponse> {
    const data = {
      userId: userId,
      token: token
    }
    return this.post(EnumMeetingControlUrl.Login, data)
  }

  public getMeetingInfo(meetingId: string): Promise<IResponse> {
    const url = stringFormat(EnumMeetingControlUrl.meetingInfo, [meetingId])
    return this.get(url, null)
    // {
    //     "code": 10000,
    //     "msg": "success",
    //     "data": {
    //         "meetingId": "11111111",
    //         "hostId": "123456789",
    //         "speakerId": "",
    //         "lockStatus": 0,
    //         "resourceShareExtra": ""
    //     }
    // }
  }

  public stopMeeting(meetingId: string): Promise<IResponse> {
    const url = stringFormat(EnumMeetingControlUrl.stopMeeting, [meetingId])
    return this.post(url, null)
  }

  public lockMeeting(meetingId: string, isLock: number): Promise<IResponse> {
    const data = {
      lockStatus: isLock
    }
    const url = stringFormat(EnumMeetingControlUrl.lockMeeting, [meetingId])
    return this.put(url, data)
  }
  /**
   *
   * @param meetingId 会议ID
   * @param deviceType 设备类型  mic
   * @param status 控制状态  open,close
   * @param userIds 被控制用户数组
   * @returns
   */
  public deviceControl(
    meetingId: string,
    deviceType: string,
    status: string,
    userIds: string[]
  ): Promise<IResponse> {
    const data = {
      userIds: userIds,
      deviceType: deviceType,
      status: status
    }
    const url = stringFormat(EnumMeetingControlUrl.deviceControl, [meetingId])
    return this.post(url, data)
  }
  public deviceControlAccept(
    meetingId: string,
    deviceType: string,
    status: string
  ): Promise<IResponse> {
    const data = {
      deviceType: deviceType,
      status: status
    }
    const url = stringFormat(EnumMeetingControlUrl.deviceControlAccept, [
      meetingId
    ])
    return this.post(url, data)
  }
  public deviceControlReject(
    meetingId: string,
    deviceType: string,
    status: string
  ): Promise<IResponse> {
    const data = {
      deviceType: deviceType,
      status: status
    }
    const url = stringFormat(EnumMeetingControlUrl.deviceControlReject, [
      meetingId
    ])
    return this.post(url, data)
  }
  public kickUser(meetingId: string, userId: string): Promise<IResponse> {
    const data = {
      userId: userId
    }
    const url = stringFormat(EnumMeetingControlUrl.kickUser, [meetingId])
    return this.post(url, data)
  }
  public transferHost(meetingId: string, userId: string): Promise<IResponse> {
    const data = {
      userId: userId
    }
    const url = stringFormat(EnumMeetingControlUrl.transferHost, [meetingId])
    return this.post(url, data)
  }
  public setSpeaker(meetingId: string, userId: string): Promise<IResponse> {
    const data = {
      userId: userId
    }
    const url = stringFormat(EnumMeetingControlUrl.setSpeaker, [meetingId])
    return this.post(url, data)
  }
  public cancelSpeaker(meetingId: string, userId: string): Promise<IResponse> {
    const data = {
      userId: userId
    }
    const url = stringFormat(EnumMeetingControlUrl.cancelSpeaker, [meetingId])
    return this.post(url, data)
  }
  public startShare(meetingId: string, extra: object): Promise<IResponse> {
    const data = {
      extra: JSON.stringify(extra)
    }
    const url = stringFormat(EnumMeetingControlUrl.startShare, [meetingId])
    return this.post(url, data)
  }

  public stopShare(meetingId: string, extra: object): Promise<IResponse> {
    const url = stringFormat(EnumMeetingControlUrl.stopShare, [meetingId])
    return this.post(url, { extra: JSON.stringify(extra) })
  }
}

// 单列模式返回对象
let instance
export default (() => {
  if (instance) return instance
  instance = new MeetingControlApi()
  return instance
})()
