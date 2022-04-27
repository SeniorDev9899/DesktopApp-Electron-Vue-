import { meetingControlService, meetingOperateService } from '@/core/services'
import { IUserModel } from '@/types/meeting'
import { meInfo, userAction } from '@/store/meeting'
import { computed, watch } from 'vue'
import { meId } from '@/session'
import { inputDialog } from '@/compos/dialogs'

export default (user: IUserModel) => {
  const userTag = computed(() => {
    const tags = []
    user.isHost && tags.push('主持人')
    user.isSpeaker && tags.push('主讲人')
    user.isMe && tags.push('我自己')
    if (tags.length > 0) {
      return `(${tags.toString()})`
    }
    return ''
  })
  const actUserTop = () => {
    userAction.actUserTop(user.userId)
  }
  const actUserAudio = () => {
    if (user.isMe) {
      meetingOperateService.operateAudio(!meInfo.isAudioOn)
    } else {
      meetingControlService.ctrlUserAudio(user.userId, !user.isAudioOn)
    }
  }
  const actUserVideo = () => {
    if (user.isMe) {
      meetingOperateService.operateVideo(!meInfo.isVideoOn)
    } else {
      meetingControlService.ctrlUserVideo(user.userId, !user.isVideoOn)
    }
  }
  const actMoreCommands = (cmd: string) => {
    switch (cmd) {
      case 'transferHost':
        meetingControlService.ctrlHostTransfer(user.userId)
        break
      case 'setSpeaker':
        meetingControlService.ctrlSpeakerSet(user.userId)
        break
      case 'cancelSpeaker':
        meetingControlService.ctrlSpeakerCancel(user.userId)
        break
      case 'kickUser':
        meetingControlService.ctrlUserKick(user.userId)
        break
      case 'changeName':
        _actChangeName()
        break
      default:
        break
    }
  }

  const _actChangeName = async () => {
    const { data, action } = await inputDialog.inputUserName(meInfo.userName)
    console.log(data, action)
    if (action === 'confirm' && !!data.value) {
      meetingControlService.ctrlChangeName(meId.value, data.value)
    }
  }
  const isTopVisible = computed(() => {
    return !user.isMe && !user.isSpeaker && !user.isHost
  })
  const isAudioVisible = computed(() => {
    return meInfo.isHost
  })
  const isVideoVisible = computed(() => {
    return meInfo.isHost
  })
  const isDropdownVisible = computed(() => {
    return meInfo.isHost || (user.isSpeaker && user.isMe)
  })
  const isTransferHostVisible = computed(() => {
    return !user.isHost && meInfo.isHost
  })
  const isSetSpeakerVisible = computed(() => {
    return meInfo.isHost && !user.isSpeaker
  })
  const isCancelSpeakerVisible = computed(() => {
    return (meInfo.isHost && user.isSpeaker) || user.isSpeaker
  })
  const isKickUserVisible = computed(() => {
    return meInfo.isHost && !user.isMe
  })
  const isChangeNameVisible = computed(() => {
    return user.isMe
  })
  watch(
    () => [user.isHost, user.isSpeaker, user.isTop],
    () => {
      userAction.reorderUser(user.userId)
    }
  )
  return {
    userTag,
    isTopVisible,
    isAudioVisible,
    isVideoVisible,
    isDropdownVisible,
    isTransferHostVisible,
    isSetSpeakerVisible,
    isCancelSpeakerVisible,
    isKickUserVisible,
    isChangeNameVisible,
    actUserTop,
    actUserAudio,
    actUserVideo,
    actMoreCommands
  }
}
