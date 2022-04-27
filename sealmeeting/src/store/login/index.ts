import { reactive } from "vue"
import { LoginAction } from "./loginAction"

export interface ILoginAuth {
  id: string,
  name: string,
  portrait: string,
  mobile: string,
  personalMeetingNumber: string,
  imToken: string,
  authorization: string,
  joinMeetingPassword: string,
  rcmtToken: string,
  meetingShareUrl: string,
}

export interface INavConfig {
  im: {
    appKey: string,
    naviUrl: string,
  },
  media: {
    type: number,
    uploadUrl: string,
    downloadUrl: string,
  },
  record: {
    downloadUrl: string
  },
  whiteboard: {
    url: string //#白板地址
  },
  meetinglib_server: {
    url: string
  }
}
export const creatLoginInfo = () => {
  return {
    id: '',
    name: '',
    portrait: '',
    mobile: '',
    personalMeetingNumber: '',
    imToken: '',
    authorization: '',
    joinMeetingPassword: '',
    rcmtToken: '',
    meetingShareUrl: '',
  }
}
export const loginAuth: ILoginAuth = reactive(creatLoginInfo())

export const loginAction = new LoginAction()