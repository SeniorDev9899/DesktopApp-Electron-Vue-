import { storageUtil } from '@/utils/storageUtil'
import { settingState } from '.'
export class SettingAction {
  private storageKey: string = 'settings'
  constructor() {}
  updateSettig(obj: object) {
    Object.assign(settingState, obj)
    storageUtil.setObject(this.storageKey, settingState)
  }
  loadStorage() {
    const obj = storageUtil.getObject(this.storageKey)
    Object.assign(settingState, obj)
  }
}
