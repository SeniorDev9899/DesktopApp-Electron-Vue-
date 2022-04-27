import { durationFormat, timeUtil } from '@/utils/timeUtil'
import { meetingAction, meetingInfo, meetingSetting } from '@/store/meeting'
import { ElMessage } from 'element-plus'
import { onUnmounted, ref, computed } from 'vue'

export default () => {
  let meetingDuration = ref('')
  let meetingMonitor = ref('') // -600 中，-900 差
  const _startTime = timeUtil.getNowInt()
  const _durationInterval = setInterval(() => {
    meetingDuration.value = durationFormat(Date.now(), _startTime)
  }, 1000)

  const isFocusMode = computed(() => {
    return (
      !!meetingSetting.foucsUserId ||
      !!meetingSetting.speakerId ||
      !!meetingSetting.shareUserId
    )
  })

  const changeViewMode = (isFocusMode: boolean) => {
    if (isFocusMode) {
      meetingAction.setFocusMode()
    } else {
      if (!!meetingSetting.speakerId) {
        ElMessage.info('当有为主讲模式，无法切换会议视图')
      } else {
        meetingAction.setNormalMode()
      }
    }
  }

  onUnmounted(() => {
    _durationInterval && clearInterval(_durationInterval)
  })

  return {
    meetingDuration,
    meetingMonitor,
    isFocusMode,
    changeViewMode
  }
}
