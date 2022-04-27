import { watch, computed, reactive } from 'vue'
import { meetingSetting, meetingAction } from '@/store/meeting'

/**
 * 管理会议页面各种弹出层和窗体，如聊天，成员，设置
 */
export default () => {
  let isSettingShow = computed(() => {
    return meetingSetting.isSettingShow
  })

  // 邀请
  let isInviteShow = computed({
    get() {
      return meetingSetting.isInviteShow
    },
    set() {
      meetingAction.settingUpdate({ isInviteShow: false })
    }
  })

  /**
   * 当聊天窗体打开时，新消息提醒消失
   */
  watch(
    () => meetingSetting.isChatDrawerShow,
    (val, preVal) => {
      val && meetingAction.settingUpdate({ hasNewMessage: false })
    }
  )
  /**
   * 弹层组件名称
   */
  const drawerCompoName = computed(() => {
    if (meetingSetting.isUserDrawerShow) {
      return 'InfoListCompo'
    }
    if (meetingSetting.isChatDrawerShow) {
      return 'ChatCompo'
    }
    return ''
  })
  return {
    drawerCompoName,
    isSettingShow,
    isInviteShow
  }
}
