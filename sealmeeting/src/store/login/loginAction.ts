import { storageUtil } from '@/utils/storageUtil'
import { loginAuth, creatLoginInfo } from '.'

export class LoginAction {
  private storageKey: string = 'login'
  public updateLoginAuth(info: any) {
    Object.assign(loginAuth, info)
    storageUtil.setObject(this.storageKey, loginAuth)
  }
  loadStorage() {
    const obj = storageUtil.getObject(this.storageKey)
    Object.assign(loginAuth, obj)
  }
  public clear() {
    Object.assign(loginAuth, creatLoginInfo())
    storageUtil.setObject(this.storageKey, {})
  }
}
