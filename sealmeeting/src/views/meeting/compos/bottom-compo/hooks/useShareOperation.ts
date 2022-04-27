import { appConfig } from '@/appConfig'
import { meetingOperateService } from '@/core/services'
import { EnumTrackTag, IUserModel } from '@/types/meeting'
import { meId } from '@/session'
import { onEvent } from '@/store/event'
import localeStore from '@/store/localeStore'
import { meetingSetting } from '@/store/meeting'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'

export default (meInfo: IUserModel) => {
  const locale = localeStore('meeting')
  // 共享按钮显示名称：共享、停止共享
  const shareBtnName = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当有共享者
      if (
        meetingSetting.shareUserId === meInfo.userId + '-shadow' ||
        meInfo.isHost
      ) {
        // 当我是共享者 或者 我是主持人
        return locale.shareStop
      }
    }
    return locale.share
  })
  // 当前共享功能是否可用（当不可用时，开始共享及停止共享都将不显示）
  const isShareFuncEnable = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当前有分享者
      if (meetingSetting.shareUserId != meInfo.userId + '-shadow') {
        // 我不是分享者
        if (!meInfo.isHost) {
          // 我不是主持人
          return false
        }
      }
    }
    return true
  })
  // 当前开始共享是否可用
  const isStartShareEnable = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当前有共享者
      return false
    }
    return true
  })
  // 当前停止共享是否可用
  const isStopScreenEnable = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当前有共享者
      if (meetingSetting.shareTrackTag === EnumTrackTag.ScreenShare) {
        // 当前共享类型为检查类型
        return true
      }
    }
    return false
  })
  const isStopWhiteBoardEnable = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当前有共享者
      if (meetingSetting.shareTrackTag === EnumTrackTag.WhiteBoard) {
        // 当前共享类型为检查类型
        return true
      }
    }
    return false
  })
  const isStartWhiteBoardEnable = computed(() => {
    return appConfig.switchWhiteboard === 'on'
  })
  const isStopMediaFileEnable = computed(() => {
    if (meetingSetting.shareUserId) {
      // 当前有共享者
      if (meetingSetting.shareTrackTag === EnumTrackTag.MediaFileVideo) {
        // 当前共享类型为检查类型
        return true
      }
    }
    return false
  })

  // 分享按钮所有命令操作
  const actShareCommands = (cmd: string) => {
    switch (cmd) {
      case 'startScreen':
        _actShareScreen(true)
        break
      case 'startWhiteBoard':
        _startShareWhiteBoard()
        break
      case 'startMediaFile':
        break
      case 'stopScreen':
        _actShareScreen(false)
        break
      case 'stopWhiteBoard':
        _stopShareWhiteBoard()
        break
      case 'stopMediaFile':
        _stopShareMediaFile()
        break
      default:
        break
    }
  }
  // 分享按钮点击行为
  const actShareBtn = () => {}
  const _actShareScreen = (isShare: boolean) => {
    if (isShare) {
      if (!checkStartShareable()) return
      meetingOperateService.startScreen()
    } else {
      meetingOperateService.stopScreen()
    }
  }
  const _startShareWhiteBoard = () => {
    if (!checkStartShareable()) return
    meetingOperateService.startWhiteboard()
  }
  const _stopShareWhiteBoard = () => {
    meetingOperateService.stopWhiteboard()
  }
  const startShareMediaFile = (event: MouseEvent) => {
    const ele = event.target as any
    const file = ele.files[0]
    if (!file) {
      return
    }
    if (!checkStartShareable()) return
    const url = window.URL.createObjectURL(file)
    meetingOperateService.startFile(file)
  }
  const _stopShareMediaFile = () => {
    meetingOperateService.stopFile()
  }
  const checkStartShareable = () => {
    if (meetingSetting.shareUserId) {
      ElMessage.info('当前已有用户在分享，无法共享')
      return false
    }
    if (meetingSetting.speakerId) {
      if (meInfo.userId !== meetingSetting.speakerId) {
        if (meInfo.isHost) {
          ElMessage.info('当前已有主讲人，请先取消主讲后再试')
        } else {
          ElMessage.info('当前已有主讲人，无法开启共享')
        }
        return false
      }
    }
    return true
  }
  const stopShare = () => {
    if (meetingSetting.shareUserId === meId.value + '-shadow') {
      if (meetingSetting.shareTrackTag === EnumTrackTag.ScreenShare) {
        _actShareScreen(false)
      } else if (meetingSetting.shareTrackTag === EnumTrackTag.WhiteBoard) {
        _stopShareWhiteBoard()
      } else if (meetingSetting.shareTrackTag === EnumTrackTag.MediaFileVideo) {
        _stopShareMediaFile()
      }
    }
  }
  onEvent('ctrl:stopShare', stopShare)
  return {
    shareBtnName,
    isShareFuncEnable,
    isStartShareEnable,
    isStopScreenEnable,
    isStopWhiteBoardEnable,
    isStopMediaFileEnable,
    isStartWhiteBoardEnable,
    actShareCommands,
    actShareBtn,
    startShareMediaFile
  }
}
