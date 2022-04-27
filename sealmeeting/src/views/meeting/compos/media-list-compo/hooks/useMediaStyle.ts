import { IUserModel, EnumTrackTag } from '@/types/meeting'
import { computed } from 'vue'
import {
  meetingAction,
  userAction,
  meetingSetting,
  userMediaList
} from '@/store/meeting'
import localeStore from '@/store/localeStore'
import { ElMessage } from 'element-plus'

export default (user: IUserModel) => {
  const locale = localeStore('meeting')
  const isUserFocused = computed(() => {
    if (meetingSetting.shareUserId) {
      return user.userId === meetingSetting.shareUserId
    } else if (meetingSetting.speakerId) {
      return user.userId === meetingSetting.speakerId
    } else if (meetingSetting.foucsUserId) {
      return user.userId === meetingSetting.foucsUserId
    }
    return false
  })
  const viewModeStyle = computed((): string => {
    return !!meetingSetting.foucsUserId ||
      !!meetingSetting.speakerId ||
      !!meetingSetting.shareUserId
      ? 'focus-mode '
      : 'normal-mode '
  })
  const normalModeStyle = computed((): string => {
    if (
      !!meetingSetting.foucsUserId ||
      !!meetingSetting.speakerId ||
      !!meetingSetting.shareUserId
    )
      return ''
    const userCount = userMediaList.value.length
    return userCount <= 6 ? 'normal-users' + userCount : ''
  })
  const focusModeStyle = computed((): string => {
    if (meetingSetting.shareUserId) {
      if (user.userId === meetingSetting.shareUserId) {
        return meetingSetting.isFocusFull ? 'focus-full' : 'focus-big'
      }
      return ''
    }
    if (meetingSetting.speakerId) {
      if (user.userId === meetingSetting.speakerId) {
        return meetingSetting.isFocusFull ? 'focus-full' : 'focus-big'
      }
      return ''
    }
    if (meetingSetting.foucsUserId) {
      if (user.userId === meetingSetting.foucsUserId) {
        return meetingSetting.isFocusFull ? 'focus-full' : 'focus-big'
      }
      return ''
    }
    return ''
  })
  const isTopVisible = computed((): boolean => {
    return !user.isShadow && user.isTop && !user.isMe && !user.isSpeaker
  })
  const videoType = computed((): string => {
    if (user.isShadow) {
      switch (user.trackTag) {
        case EnumTrackTag.ScreenShare:
          return locale.screenShare
        case EnumTrackTag.MediaFileVideo:
          return locale.videoFile
        default:
          return ''
      }
    }
    return ''
  })
  const isMenuVisible = computed((): boolean => {
    return !user.isShadow && !user.isMe && !user.isSpeaker
  })
  const isWhiteboardVisible = computed(() => {
    return user.isShadow && user.trackTag === EnumTrackTag.WhiteBoard
  })
  const isAvatarVisible = computed(() => {
    if (!user.isShadow) {
      return !user.isVideoOn
    }
    return false
  })
  // 操作我的焦点大屏
  const actMeFocusBig = () => {
    if (meetingSetting.shareUserId) {
      if (meetingSetting.shareUserId !== user.userId + '-shadow') {
        ElMessage.info('当前有人在主讲，无法将该画面显示在大屏')
      }
    } else if (meetingSetting.speakerId) {
      if (meetingSetting.speakerId !== user.userId) {
        ElMessage.info('当前有人在主讲，无法将该画面显示在大屏')
      }
    } else {
      meetingAction.focusUser(user.userId)
    }
  }
  // 操作我的焦点全屏
  const actMeFocusFull = () => {
    meetingAction.fullUser(user.userId)
  }

  const meneComman = (command: string) => {
    switch (command) {
      case 'top':
        userAction.actUserTop(user.userId)
        break
      case 'unTop':
        userAction.actUserTop(user.userId)
        break
    }
  }
  return {
    viewModeStyle,
    normalModeStyle,
    focusModeStyle,
    actMeFocusBig,
    actMeFocusFull,
    isUserFocused,
    isTopVisible,
    videoType,
    isMenuVisible,
    isWhiteboardVisible,
    isAvatarVisible,
    meneComman
  }
}
