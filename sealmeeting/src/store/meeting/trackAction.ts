import { meetingLogger } from '@/core/ipc/logger/logger.render'
import { EnumTrackTag, RCTrack } from '@/types/meeting'
import { RCLocalTrack, RCRemoteTrack } from '@rongcloud/plugin-rtc'
import { meetingSetting, meInfo, trackMap, userMap } from '.'

export class TrackAction {
  public getTrack(): RCTrack | undefined {
    return trackMap.values().next().value
  }

  public trackGet(trackId: string): RCTrack | undefined {
    return trackMap.get(trackId)
  }

  public tracksSet(tracks: RCTrack[]) {
    for (const track of tracks) {
      this.trackSet(track)
    }
  }

  public trackSet(track: RCTrack) {
    meetingLogger.info(
      `trackActioin.tracSet:--: userId:${track.getUserId()},trackTag:${track.getTag()}`
    )
    const trackId = track.getTrackId()
    trackMap.set(trackId, track)
    const trackTag = track.getTag().toLowerCase()
    const userId =
      trackTag === EnumTrackTag.Normal
        ? track.getUserId()
        : track.getUserId() + '-shadow'
    const user = userMap.get(userId)
    if (!user) {
      meetingLogger.error(
        `trackSet,但userMap里找不到此用户,userId:${userId},user:${user}`
      )
      trackMap.delete(trackId)
      return
    }
    user.trackTag = trackTag
    if (track.isAudioTrack()) {
      user.audioTrackId = trackId
      user.isAudioTrackReady = false
      user.isAudioOn = !track.isOwnerMuted()
    } else {
      user.videoTrackId = trackId
      user.isVideoTrackReady = false
      user.isVideoOn = !track.isOwnerMuted()
      if (user.isShadow) {
        // 只有video才触发UI上的 focus
        meetingSetting.shareTrackTag = trackTag
        meetingSetting.shareUserId = userId
      }
    }
  }

  public tracksDelete(tracks: RCTrack[]) {
    for (const track of tracks) {
      this.trackDelete(track)
    }
  }

  public trackDelete(track: RCTrack) {
    const trackId = track.getTrackId()
    trackMap.delete(trackId)
    const trackTag = track.getTag().toLowerCase()
    const userId =
      trackTag === EnumTrackTag.Normal
        ? track.getUserId()
        : track.getUserId() + '-shadow'
    const user = userMap.get(userId)
    if (!user) {
      meetingLogger.error(
        `trackSet,但userMap里找不到此用户,userId:${userId},user:${user}`
      )
      return
    }
    if (track.isAudioTrack()) {
      user.audioTrackId = ''
      user.isAudioTrackReady = false
      user.isAudioOn = false
      if (user.isShadow && !user.videoTrackId) {
        meetingSetting.shareUserId = ''
        meetingSetting.shareTrackTag = ''
      }
    } else {
      user.videoTrackId = ''
      user.isVideoTrackReady = false
      user.isVideoOn = false
      if (user.isShadow && !user.audioTrackId) {
        meetingSetting.shareUserId = ''
        meetingSetting.shareTrackTag = ''
      }
    }
    if (track.isLocalTrack()) {
      ;(track as RCLocalTrack).destroy()
    }
  }

  public trackUpdateMute(track: RCTrack) {
    const trackTag = track.getTag().toLowerCase()
    if (trackTag === EnumTrackTag.Normal) {
      const userId = track.getUserId()
      const user = userMap.get(userId)
      if (!user) {
        return
      }
      if (track.isAudioTrack()) {
        user.isAudioOn = !track.isOwnerMuted()
      } else {
        user.isVideoOn = !track.isOwnerMuted()
      }
    } else {
      meetingLogger.error('分享流也有mute事件？')
    }
  }

  public trackUpdateReady(track: RCRemoteTrack) {
    const trackTag = track.getTag().toLowerCase()
    let userId =
      trackTag === EnumTrackTag.Normal
        ? track.getUserId()
        : track.getUserId() + '-shadow'
    const user = userMap.get(userId)
    if (!user) {
      meetingLogger.error('用户track ready 但用户不存在', track)
      return
    }
    if (track.isAudioTrack()) {
      user.isAudioTrackReady = track.isReady()
    } else {
      user.isVideoTrackReady = track.isReady()
    }
  }

  public remoteTrackGet(trackId: string): RCRemoteTrack | undefined {
    const track = this.trackGet(trackId)
    if (track && !track.isLocalTrack()) {
      return track as RCRemoteTrack
    }
    return undefined
  }

  public localTrackGet(trackId: string): RCLocalTrack | undefined {
    const track = this.trackGet(trackId)
    if (track && track.isLocalTrack()) {
      return track as RCLocalTrack
    }
    return undefined
  }

  public localVideoTrackGet(): RCLocalTrack | undefined {
    return this.localTrackGet(meInfo.videoTrackId)
  }

  public localAudioTrackGet(): RCLocalTrack | undefined {
    return this.localTrackGet(meInfo.audioTrackId)
  }

  public localVideoSharTrackGet(): RCLocalTrack | undefined {
    const user = userMap.get(meInfo.userId + '-shadow')
    if (user) {
      return this.localTrackGet(user.videoTrackId)
    }
    return undefined
  }

  public localAudioSharTrackGet(): RCLocalTrack | undefined {
    const user = userMap.get(meInfo.userId + '-shadow')
    if (user) {
      return this.localTrackGet(user.audioTrackId)
    }
    return undefined
  }

  public clear() {
    trackMap.forEach(track => {
      if (track.isLocalTrack()) {
        ;(track as RCLocalTrack).destroy()
      }
    })
    trackMap.clear()
  }
}
