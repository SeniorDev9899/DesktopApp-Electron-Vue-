import { meetingLogger } from '../ipc/logger/logger.render'
import imCore from '../../modules/IMCore'
import rtcCore from '../../modules/RTCCore'
import { EnumErrorCode } from '../../types/Enums'
import { LoginService } from './login/LoginService'
import { MeetingControlService } from './meeting/MeetingControlService'
import { MeetingNotifyService } from './meeting/MeetingNotifyService'
import { MeetingOperateService } from './meeting/MeetingOperateService'
import { MeetingRoomService } from './meeting/MeetingRoomService'
import { MsgService } from './msg/MsgService'
import { SettingService } from './setting/SettingService'
import { loginAuth } from '@/store/login'

export interface IService {
  // init(): void;
  // release(): void;
  onMeetingStart(): void
  onMeetingEnd(): void
  onLogout(): void
}

export const loginService = new LoginService()
export const meetingControlService = new MeetingControlService()
export const meetingNotifyService = new MeetingNotifyService()
export const meetingOperateService = new MeetingOperateService()
export const meetingRoomService = new MeetingRoomService()
export const msgService = new MsgService()
export const settingService = new SettingService()

const services: IService[] = []
services.push(meetingControlService)
services.push(meetingNotifyService)
services.push(meetingOperateService)
services.push(meetingRoomService)
services.push(msgService)
services.push(settingService)

export const serviceManager = {
  /**
   * 初始化SDK
   * 时机为：登陆成功后
   */
  initSDK: async (): Promise<EnumErrorCode> => {
    const imToken = loginAuth.imToken
    if (!imToken) {
      meetingLogger.error('SDK 初始化失败：', EnumErrorCode.IMTokenError)
      return EnumErrorCode.IMTokenError
    }
    imCore.init()
    const code = await imCore.connect(imToken)
    if (code !== EnumErrorCode.OK) {
      meetingLogger.error('SDK 初始化失败：', code)
      return code
    }
    rtcCore.init(imCore.getInstance())
    return EnumErrorCode.OK
  },
  /**
   * 释放SDK
   * 时机：退出会议
   */
  onLogout: () => {
    imCore.disconnect()
    for (const service of services) {
      service.onLogout()
    }
  },
  onMeetingStart: () => {
    for (const service of services) {
      service.onMeetingStart()
    }
  },
  onMeetingEnd: () => {
    for (const service of services) {
      service.onMeetingEnd()
    }
  },
  onPageLeave: () => {}
}
