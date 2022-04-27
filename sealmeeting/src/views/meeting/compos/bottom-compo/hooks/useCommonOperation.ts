import { IUserModel } from '@/types/meeting'
import { meetingAction, meetingSetting } from '@/store/meeting'
import { computed } from 'vue'

export default (meInfo: IUserModel) => {
  const actDrawer = (drawerType: string) => {
    if (drawerType === 'member') {
      meetingAction.switchUserDrawer()
    } else if (drawerType === 'chat') {
      meetingAction.switchChatDrawer()
    }
  }
  const actMoreCommands = (cmd: string) => {
    switch (cmd) {
      case 'startRecord':
        break
      case 'stopRecord':
        break
      case 'setting':
        meetingAction.settingUpdate({ isSettingShow: true })
        break
      case 'invite':
        meetingAction.settingUpdate({ isInviteShow: true })
        break
      default:
        break
    }
  }

  const isStartRecordEnable = computed(() => {})
  const isStopRecordEnable = computed(() => {})
  const hasNewMessage = computed(() => {
    return meetingSetting.hasNewMessage
  })

  return {
    actDrawer,
    actMoreCommands,
    isStartRecordEnable,
    isStopRecordEnable,
    hasNewMessage
  }
}
