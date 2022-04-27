import { detectPlatform, stringFormat } from '@/utils/systemUtil'
import { IResponse } from './base'
import Abstract from './base/abstract'
import { appConfig } from '@/appConfig'

enum EnumMeetingUrl {
  ConfigurationAll = '/configuration/all?netEnvironment={0}',
  SendCode = '/user/sendCode',
  Login = '/user/login',
  UserModify = '/user/modify',
  UploadToken = '/user/getImageToken',
  JoinMeeting = '/meetings/join',
  BatchUserInfo = '/meetings/member/batch',
  LeaveMeeting = '/meetings/leave',
  StopMeeting = '/meetings/end',
  CreateWhiteboard = '/meetings/whiteboard/create',
  ChangeDisplayName = '/meetings/member/name',
  startRecord = '/meetings/record/start',
  stopRecord = '/meetings/record/end',
  meetingSetting = '/meetings/setting',
  meetingBasic = '/meetings/basic/info',
  meetingInfo = '/meetings/{0}',
  meetingHistory = '/meetings/history',
  meetingDetial = '/meetings/',
  meetingDeleteOne = '/meetings/',
  meetingSchedule = '/meetings/schedule'
}
export interface IJoinMeetingParams {
  meetingId?: string
  meetingNumber?: string
  userName: string
  subject?: string
  password?: string
}
class MeetingApi extends Abstract {
  constructor() {
    super('meeting')
  }

  // 获取短信验证码
  public getVerifyCode(mobile: string): Promise<IResponse> {
    let data = {
      mobile: mobile
    }
    return this.post(EnumMeetingUrl.SendCode, data)
  }

  public async login(mobile: string, smsCode: string): Promise<IResponse> {
    let data = {
      mobile: mobile,
      verifyCode: smsCode,
      agent: {
        platform: detectPlatform()
      }
    }
    return await this.post(EnumMeetingUrl.Login, data)
  }

  public async GetNavConfig(netEnv: string): Promise<IResponse> {
    const url = stringFormat(EnumMeetingUrl.ConfigurationAll, [netEnv])
    return this.get(url, {})
  }

  public async GetUploadToken(): Promise<IResponse> {
    return this.get(EnumMeetingUrl.UploadToken, {})
  }

  public async JoinMeeting(params: IJoinMeetingParams): Promise<IResponse> {
    return this.post(EnumMeetingUrl.JoinMeeting, params)
  }

  public async getUserInfo(
    meetingId: string,
    userIds: string[]
  ): Promise<IResponse> {
    const data = {
      meetingId: meetingId,
      userIds: userIds
    }
    return this.post(EnumMeetingUrl.BatchUserInfo, data)
  }

  public async leaveMeeting(meetingId: string): Promise<IResponse> {
    const data = {
      meetingId: meetingId
    }
    return this.post(EnumMeetingUrl.LeaveMeeting, data)
  }
  public async stopMeeting(meetingId: string): Promise<IResponse> {
    const data = {
      meetingId: meetingId
    }
    return this.post(EnumMeetingUrl.StopMeeting, data)
  }
  public async createWhiteboard(meetingId: string) {
    const data = {
      meetingId: meetingId
    }
    return this.post(EnumMeetingUrl.CreateWhiteboard, data)
  }
  public async changeUserDisplayName(
    meetingId: string,
    userName: string
  ): Promise<IResponse> {
    const data = {
      meetingId: meetingId,
      name: userName
    }
    return this.put(EnumMeetingUrl.ChangeDisplayName, data)
  }
  public async startRecord(
    meetingId: string,
    sessionId: string,
    userId: string,
    streamId: string
  ) {
    // {
    //     "meetingId": "xxxxxxxxx",
    //     "sessionId": "xxxxxxxxx",
    //     "hostUserId":"dddddddd"
    //     "hostStreamId":"dddddddd"
    // }
    const data = {
      meetingId: meetingId,
      sessionId: sessionId,
      hostUserId: userId,
      hostStreamId: streamId
    }
    return this.post(EnumMeetingUrl.startRecord, data)
  }
  public async stopRecord(
    meetingId: string,
    sessionId: string
  ): Promise<IResponse> {
    const data = {
      meetingId: meetingId,
      sessionId: sessionId
    }
    return this.post(EnumMeetingUrl.stopRecord, data)
  }
  public async updateMeetingSetting(
    meetingId: string,
    isVideoClose: boolean,
    isAudioCose: boolean
  ): Promise<IResponse> {
    const data = {
      meetingId: meetingId,
      joinForceCloseMic: isAudioCose,
      joinForceCloseCamera: isVideoClose
    }
    return this.post(EnumMeetingUrl.meetingSetting, data)
  }
  public async getMeetingBasicInfo(meetingId: string): Promise<IResponse> {
    const params = {
      meetingId: meetingId
    }
    return this.get(EnumMeetingUrl.meetingBasic, params)
  }
  public async getMeetingInfo(meetingId: string): Promise<IResponse> {
    const url = stringFormat(EnumMeetingUrl.meetingInfo, [meetingId])
    return this.get(url, null)
  }
  public async modifyUser(data: {
    name?: string
    portrait?: string
    joinMeetingPassword?: string
  }): Promise<IResponse> {
    return this.put(EnumMeetingUrl.UserModify, data)
  }
  public async getMeetingHistoryList(): Promise<IResponse> {
    return this.get(EnumMeetingUrl.meetingHistory, null)
  }
  public async getMeetingDetialInfo(id: string | number): Promise<IResponse> {
    return this.get(EnumMeetingUrl.meetingDetial + id, null)
  }
  public async deleteMeetingById(
    meetingId: string | number
  ): Promise<IResponse> {
    return this.delete(EnumMeetingUrl.meetingDeleteOne + meetingId, null)
  }
  public async meetingSchedule(data: any): Promise<IResponse> {
    return this.post(EnumMeetingUrl.meetingSchedule, data)
  }
}

// 单列模式返回对象
let instance
export default (() => {
  if (instance) return instance
  instance = new MeetingApi()
  return instance
})()
