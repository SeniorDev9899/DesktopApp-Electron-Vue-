import meetingApi from '@/core/api/meetingApi'
import { loginAction, ILoginAuth, loginAuth } from '@/store/login'
import { meetingLogger } from '@/core/ipc/logger/logger.render'
import { EnumErrorCode } from '@/types/Enums'
import { IService } from '@/core/services'
import { appConfig, updateNavConf } from '@/appConfig'
export class LoginService implements IService {
  constructor() {
    loginAction.loadStorage()
  }
  onMeetingStart(): void {}
  onMeetingEnd(): void {}
  onLogout(): void {}

  public async getNavConfig() {
    const rst = await meetingApi.GetNavConfig(appConfig.netEnv)
    if (rst.code !== EnumErrorCode.OK) {
      meetingLogger.error('获取导航失败，', rst)
    } else {
      meetingLogger.info('获取导航:', rst.data)
      updateNavConf(rst.data)
    }
    return rst.code
  }

  public async getVerifyCode(mobile: string): Promise<EnumErrorCode> {
    const rsp = await meetingApi.getVerifyCode(mobile)
    return rsp.code
  }
  public async login(mobile: string, smsCode: string): Promise<EnumErrorCode> {
    meetingLogger.info('开始登录')
    // 登录 SealMeeting
    const mRsp = await meetingApi.login(mobile, smsCode)
    meetingLogger.info('登录 sealmeeting ：', mRsp)
    if (mRsp.code !== EnumErrorCode.OK) {
      return mRsp.code
    }
    const info = mRsp.data as ILoginAuth

    // 更析登录信息
    loginAction.updateLoginAuth(mRsp.data)
    return info.name ? EnumErrorCode.OK : EnumErrorCode.NewUser
  }

  public logout() {
    loginAction.clear()
  }

  public async GetUploadToken(): Promise<string> {
    const rsp = await meetingApi.GetUploadToken()
    if (rsp.code === EnumErrorCode.OK && rsp.data.uploadToken) {
      return rsp.data.uploadToken
    }
    meetingLogger.error('获取上传token失败，', rsp)
    return ''
  }

  public async modifyUser(data: {
    name?: string
    portrait?: string
    joinMeetingPassword?: string
  }): Promise<EnumErrorCode> {
    if (data) {
      const rst = await meetingApi.modifyUser(data)
      if (rst.code === EnumErrorCode.OK) {
        loginAction.updateLoginAuth(data)
      }
      return rst.code
    }
    return EnumErrorCode.ParamsError
  }
}
