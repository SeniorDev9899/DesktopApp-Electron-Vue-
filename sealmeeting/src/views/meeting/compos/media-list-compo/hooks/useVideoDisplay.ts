import { meetingLogger } from '@/core/ipc/logger/logger.render'
import { meetingRoomService } from '@/core/services'
import { IUserModel } from '@/types/meeting'
import { computed, nextTick, onMounted, watch } from 'vue'

export default (user: IUserModel) => {
  /**
   * 监听视频ID
   */
  watch(
    () => user.videoTrackId,
    (value: any) => {
      if (value) {
        if (user.isMe) {
          console.log('user.videoTrackId,------play------', user.userId)
          nextTick(() => {
            meetingRoomService.playVideo(value, user.userId)
          })
        } else {
          console.log('user.videoTrackId,------subscribe------', user.userId)
          meetingRoomService.subscribeVideo(value)
        }
      }
    },
    {
      immediate: true
    }
  )

  onMounted(() => {
    // 用户未初始化时执行初始化 todo: 可能是影子
    if (!user.isInited) {
      meetingRoomService.initUser(user.userId)
    }

    /**
     * 监听远端、真身视频流是已subscribe可播放
     */
    watch(
      () => user.isVideoTrackReady,
      value => {
        if (user.isMe) {
          return // 非远端
        }
        if (value) {
          console.log('user.isVideoTrackReady,-------play-----', user.userId)
          nextTick(() => {
            meetingRoomService.playVideo(user.videoTrackId, user.userId)
          })
        }
      },
      {
        immediate: true
      }
    )
  })
  return {}
}
