import { meetingLogger } from '@/core/ipc/logger/logger.render'
import { createUser, EnumTrackTag, IUserModel } from '@/types/meeting'
import { reactive, toRaw } from 'vue'
import { meetingSetting, meInfo, userInfoList, userMap, userMediaList } from '.'

export class UserAction {
  private joinOrder = 0
  public actUserTop(userId: string) {
    // todo 重新定位list位置
    const user = this.userGet(userId)
    if (user) {
      user.isTop = !user.isTop
    }
  }

  public actUserKick(userId: string) {
    this.userDelete(userId + '-shadow')
    this.userDelete(userId)
  }

  public userGet(userId: string): IUserModel | undefined {
    return userMap.get(userId)
  }

  public meGet(): IUserModel {
    return meInfo
  }

  public userUpdate(user: any) {
    const source = userMap.get(user.userId)
    !!source && Object.assign(source, user)
  }
  public userSet(user: any) {
    if (!userMap.has(user.userId)) {
      meetingLogger.info(`userAction.userSet:--:userId:${user.userId}`)
      let userModel: IUserModel
      if (user.isShadow) {
        userModel = user
      } else {
        userModel = user.isMe ? meInfo : reactive(createUser(user.userId))
      }
      userModel.joinOrder = this.joinOrder
      this.joinOrder++
      // 将用户加入map
      // 将用户加到多媒体列表
      Object.assign(userModel, user)
      userMap.set(user.userId, userModel)
      this.infoListUserSet(userModel)
    } else {
      let userModel = userMap.get(user.userId)!
      Object.assign(userModel, user)
    }
  }

  public shadowUserSet(userId: string, trackTag: string) {
    if (trackTag === EnumTrackTag.Normal) {
      meetingLogger.error(`普通类型的track，不创建影子用户`)
      return
    }
    const shadowId = userId + '-shadow'
    if (userMap.has(shadowId)) {
      meetingLogger.info('addShadowUser,已经有这个用户的shadow了:', shadowId)
      return
    }
    const user = userMap.get(userId)
    if (!user) {
      meetingLogger.error(`创建影子用户时，找不到真身,userId:${userId}`)
      return
    }
    let shadowUser: IUserModel = JSON.parse(JSON.stringify(toRaw(user)))
    shadowUser.userId = shadowId
    shadowUser.isShadow = true
    shadowUser.audioTrackId = ''
    shadowUser.isAudioOn = false
    shadowUser.isAudioTrackReady = false
    shadowUser.videoTrackId = ''
    shadowUser.isVideoOn = false
    shadowUser.isVideoTrackReady = false
    shadowUser.trackTag = trackTag
    const rtUser = reactive(shadowUser)
    userMap.set(shadowId, rtUser)
    this.infoListUserSet(rtUser)
  }

  public userDelete(userId: string) {
    userMap.delete(userId)
    if (meetingSetting.shareUserId === userId) {
      meetingSetting.shareTrackTag = ''
      meetingSetting.shareUserId = ''
      meetingSetting.isFocusFull = false
    }
    if (meetingSetting.foucsUserId === userId) {
      meetingSetting.foucsUserId = ''
      meetingSetting.isFocusFull = false
    }
    if (meetingSetting.speakerId === userId) {
      meetingSetting.speakerId = ''
      meetingSetting.isFocusFull = false
    }
    this.infoListUserDelete(userId)
  }

  /**
   * 将用户添加到 InfoList
   * @param user 用户
   */
  private infoListUserSet(user: IUserModel) {
    const index = this.getNextUserIndex(user, false)
    userInfoList.splice(index, 0, user)
  }

  public reorderUser(userId: string) {
    const index = userInfoList.findIndex(user => user.userId === userId)
    if (index === -1) return
    // 如果用户在列表中 && 将用户从此列表中移除
    const userInfo = userInfoList.splice(index, 1)[0]
    const nextIndex = this.getNextUserIndex(userInfo, true)
    userInfoList.splice(nextIndex, 0, userInfo)
  }

  private getNextUserIndex(user: IUserModel, byOrder: boolean) {
    let nextIndex = -1
    if (user.isShadow) {
      // 影子用户第一位
      nextIndex = 0
    } else if (user.isMe) {
      // 不是影子
      nextIndex = userInfoList.findIndex(user => !user.isShadow)
    } else if (user.isHost) {
      // 不是影子，不是我
      nextIndex = userInfoList.findIndex(user => !user.isShadow && !user.isMe)
    } else if (user.isSpeaker) {
      // 不是影子，不是我，不是主持人
      nextIndex = userInfoList.findIndex(
        user => !user.isShadow && !user.isMe && !user.isHost
      )
    } else if (user.isTop) {
      // 不是影子，不是我，不是主持人,不是主讲
      nextIndex = userInfoList.findIndex(
        user => !user.isShadow && !user.isMe && !user.isHost && !user.isSpeaker
      )
    } else if (byOrder) {
      nextIndex = userInfoList.findIndex(
        nextUser =>
          !nextUser.isShadow &&
          !nextUser.isMe &&
          !nextUser.isHost &&
          !nextUser.isSpeaker &&
          !nextUser.isTop &&
          nextUser.joinOrder > user.joinOrder
      )
    }
    return nextIndex === -1 ? userInfoList.length : nextIndex
  }

  /**
   * 将用户从 InfoList 中移除
   * @param userId 用户ID
   */
  private infoListUserDelete(userId: string) {
    const infoIndex = userInfoList.findIndex(user => user.userId === userId)
    infoIndex >= 0 && userInfoList.splice(infoIndex, 1)
  }

  public clear() {
    Object.assign(meInfo, createUser(''))
    userInfoList.splice(0)
    userMap.clear()
  }
}
