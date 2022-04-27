import { meetingLogger } from '@/core/ipc/logger/logger.render'
import rtcCore from '@/modules/RTCCore'
import { EnumErrorCode } from '@/types/Enums'
import { EnumTrackTag } from '@/types/meeting'
import {
  meetingSetting,
  meInfo,
  trackAction,
  userAction,
  whiteboardAction,
  whiteboardInfo
} from '@/store/meeting'
import {
  ICameraVideoProfile,
  IMicphoneAudioProfile,
  RCFrameRate,
  RCLocalTrack,
  RCResolution
} from '@rongcloud/plugin-rtc'
import { IService } from '@/core/services'
import meetingControlApi from '@/core/api/meetingControlApi'
import { meetingId, meId } from '@/session'
import meetingApi from '@/core/api/meetingApi'
import { settingState } from '@/store/setting'
import { detectElectron } from '@/utils/systemUtil'
export class MeetingOperateService implements IService {
  constructor() {}
  onMeetingStart(): void {}
  onMeetingEnd(): void {}
  onLogout(): void {}
  public async operateAudio(isAudioOn: boolean): Promise<EnumErrorCode> {
    let audioTrack = trackAction.localAudioTrackGet()
    if (isAudioOn) {
      if (!audioTrack) {
        const opts: IMicphoneAudioProfile = {}
        !!settingState.microphoneId &&
          (opts.micphoneId = settingState.microphoneId)
        // !!settingState.microphoneSampleRate && (opts.sampleRate = settingState.microphoneSampleRate)
        const { code, track } = await rtcCore.getLocalAudioTrack(opts)
        if (code !== EnumErrorCode.OK) {
          return code
        }
        audioTrack = track
        trackAction.trackSet(audioTrack!)
      }
      if (!audioTrack) {
        return EnumErrorCode.RTCError
      }
      if (!audioTrack.isPublished()) {
        const err = await rtcCore.publish([audioTrack])
        if (err != EnumErrorCode.OK) {
          trackAction.trackDelete(audioTrack)
          return err
        }
      }
      audioTrack.unmute()
      trackAction.trackUpdateMute(audioTrack)
    } else {
      if (audioTrack) {
        audioTrack.mute()
        trackAction.trackUpdateMute(audioTrack)
        rtcCore.unPublish([audioTrack])
        trackAction.trackDelete(audioTrack)
      }
    }
    return EnumErrorCode.OK
  }

  public async operateVideo(isVideoOn: boolean): Promise<EnumErrorCode> {
    let videoTrack = trackAction.localVideoTrackGet()
    if (isVideoOn) {
      if (!videoTrack) {
        const opts: ICameraVideoProfile = {
          frameRate: RCFrameRate.FPS_15,
          resolution: settingState.cameraRes
        }
        !!settingState.cameraId && (opts.cameraId = settingState.cameraId)
        const { code, track } = await rtcCore.getLocalVideoTrack(opts)
        if (code !== EnumErrorCode.OK) {
          return code
        }
        videoTrack = track
        trackAction.trackSet(videoTrack!)
      }
      if (!videoTrack) {
        return EnumErrorCode.RTCError
      }
      if (!videoTrack.isPublished()) {
        const err = await rtcCore.publish([videoTrack])
        if (err != EnumErrorCode.OK) {
          trackAction.trackDelete(videoTrack)
          return err
        }
      }
      videoTrack.unmute()
      trackAction.trackUpdateMute(videoTrack)
    } else {
      if (videoTrack) {
        videoTrack.mute()
        trackAction.trackUpdateMute(videoTrack)
        rtcCore.unPublish([videoTrack])
        trackAction.trackDelete(videoTrack)
      }
    }
    return EnumErrorCode.OK
  }

  public async startScreen(): Promise<EnumErrorCode> {
    // 发布屏幕共享
    if (meetingSetting.shareUserId) {
      // 有人在共享，不管是谁，都不能开新的
      return EnumErrorCode.UnKnown
    }
    const opts: any = {
      frameRate: RCFrameRate.FPS_15,
      resolution: RCResolution.W1920_H1080
    }
    if (detectElectron()) {
      const { desktopCapturer } = require('electron')
      const soruces = await desktopCapturer.getSources({ types: ['screen'] })
      soruces.length > 0 && (opts.chromeMediaSourceId = soruces[0].id)
    }
    console.log('ScreenShare.options,', opts)
    const { code, track: screenTrack } = await rtcCore.getScreenVideoTrack(
      'ScreenShare',
      opts
    )
    if (code != EnumErrorCode.OK || !screenTrack) {
      return code
    }
    screenTrack.on(
      RCLocalTrack.EVENT_LOCAL_TRACK_END,
      (track: RCLocalTrack) => {
        // 取消发布屏幕共享流，room 为当前加入的房间实例
        console.log('------------------屏幕已结束')
        this.stopScreen()
      }
    )

    const err = await rtcCore.publish([screenTrack])
    if (err != EnumErrorCode.OK) {
      screenTrack.destroy()
      return err
    }
    userAction.shadowUserSet(meInfo.userId, EnumTrackTag.ScreenShare)
    trackAction.trackSet(screenTrack)
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 1,
      resourceContent: {},
      creatorId: meId.value
    }
    meetingControlApi.startShare(meetingId.value, extra)
    return EnumErrorCode.OK
  }

  public async stopScreen(): Promise<EnumErrorCode> {
    const track = trackAction.localVideoSharTrackGet()
    if (track) {
      await rtcCore.unPublish([track])
      trackAction.trackDelete(track)
      userAction.userDelete(meetingSetting.shareUserId)
    } else {
      meetingLogger.error(`取消发布分享，但又找不到这个分享track`)
    }
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 1,
      resourceContent: {},
      creatorId: meetingSetting.shareUserId.replace('-shadow', '')
    }
    meetingControlApi.stopShare(meetingId.value, extra)
    return EnumErrorCode.OK
  }

  public async startFile(file: File): Promise<EnumErrorCode> {
    const { code, tracks } = await rtcCore.createLocalFileTracks(
      'MediaFileVideo',
      file
    )
    if (code != EnumErrorCode.OK || !tracks) {
      return EnumErrorCode.UnKnown
    }

    const err = await rtcCore.publish(tracks)
    if (err != EnumErrorCode.OK) {
      trackAction.tracksDelete(tracks)
      return err
    }
    userAction.shadowUserSet(meInfo.userId, EnumTrackTag.MediaFileVideo)
    trackAction.tracksSet(tracks)
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 2,
      resourceContent: {},
      creatorId: meId.value
    }
    meetingControlApi.startShare(meetingId.value, extra)
    return EnumErrorCode.OK
  }

  public async stopFile() {
    // 需要记录远端或本地 音频分享ID
    const tracks = []
    const videoTrack = trackAction.localVideoSharTrackGet()
    !!videoTrack && tracks.push(videoTrack)
    const audioTrack = trackAction.localAudioSharTrackGet()
    !!audioTrack && tracks.push(audioTrack)
    if (tracks) {
      await rtcCore.unPublish(tracks)
      trackAction.tracksDelete(tracks)
      userAction.userDelete(meetingSetting.shareUserId)
    }
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 2,
      resourceContent: {},
      creatorId: meetingSetting.shareUserId.replace('-shadow', '')
    }
    meetingControlApi.stopShare(meetingId.value, extra)
  }

  public async startWhiteboard() {
    const rst = await meetingApi.createWhiteboard(meetingId.value)
    if (rst.code !== EnumErrorCode.OK) {
      return rst.code
    }
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 0,
      resourceContent: rst.data,
      creatorId: meInfo.userId
    }
    const controlRst = await meetingControlApi.startShare(
      meetingId.value,
      extra
    )
    if (controlRst.code != EnumErrorCode.OK) {
      return controlRst.code
    }
    userAction.shadowUserSet(meId.value, EnumTrackTag.WhiteBoard)
    whiteboardAction.shareStarted(meId.value, rst.data)
    return EnumErrorCode.OK
  }

  public async stopWhiteboard() {
    const extra = {
      // 0:白板，1:屏幕共享，2：媒体文件
      resourceType: 0,
      resourceContent: whiteboardInfo,
      creatorId: meetingSetting.shareUserId.replace('-shadow', '')
    }
    meetingControlApi.stopShare(meetingId.value, whiteboardInfo)
    whiteboardAction.shareStoped()
    userAction.userDelete(meetingSetting.shareUserId)
  }
}
