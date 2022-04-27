import { watch } from 'vue'
import { meetingSetting, meetingInfo, userAction } from '@/store/meeting'
/**
 * 管理因用户角色发生变化时的页面变化
 */
export default () => {
  /**
   * 当分享者发生变化时，将影子移除
   */
  watch(
    () => meetingSetting.shareUserId,
    (val, preVal) => {
      !!preVal && userAction.userDelete(preVal)
    },
    { immediate: true }
  )

  /**
   * 当主讲发生变化时，重新对相关用户进行排序
   */
  watch(
    () => meetingInfo.speakerId,
    (val, preVale) => {
      !!preVale && userAction.reorderUser(preVale)
      !!val && userAction.reorderUser(val)
    },
    { immediate: true }
  )

  /**
   * 当主持发生变化时，重新对相关用户进行排序
   */
  watch(
    () => meetingInfo.hostId,
    (val, preVale) => {
      !!preVale && userAction.reorderUser(preVale)
      !!val && userAction.reorderUser(val)
    },
    { immediate: true }
  )
  return {}
}
