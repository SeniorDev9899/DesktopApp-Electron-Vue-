import { IMClient } from '@rongcloud/imlib-v2'
import {
  installer,
  device,
  IRCRTCInitOptions,
  IRoomEventListener,
  RCLocalVideoTrack,
  RCLocalAudioTrack,
  RCRemoteTrack,
  RCRemoteVideoTrack,
  RCRTCClient,
  RCRTCCode,
  RCRTCRoom,
  RCLocalTrack,
  IRCRTCReportListener,
  RCLocalFileTrack,
  IMicphoneAudioProfile,
  ICameraVideoProfile,
  IVideoProfile
} from '@rongcloud/plugin-rtc'
import { EnumErrorCode } from '@/types/Enums'
import { meetingLogger } from '@/core/ipc/logger/logger.render'
import { appConfig } from '@/appConfig'
import { reactive } from 'vue'
export const rtcState = reactive({
  isConnected: false
})
const rtcConfig: IRCRTCInitOptions = {
  logLevel: 1,
  timeout: 5000,
  pingGap: 10000
}
class RTCCore {
  private rtcClient: RCRTCClient | null = null
  private rcRoom: RCRTCRoom | undefined

  constructor() {}

  public init(imClient: IMClient) {
    if (!this.rtcClient) {
      // !!appConfig.mediaServer && (rtcConfig.mediaServer = appConfig.mediaServer)
      this.rtcClient = imClient.install(installer, rtcConfig)
    }
  }

  public async joinRTCRoom(
    roomId: string,
    roomEventListener: IRoomEventListener,
    roomReportListener: IRCRTCReportListener
  ): Promise<EnumErrorCode> {
    if (!this.rtcClient) {
      meetingLogger.info('加入房间时，this.rtcClient 未初始化')
      return EnumErrorCode.RTCClientError
    }
    if (this.rcRoom) {
      meetingLogger.info('加入房间时，this.rcRoom 已经存在')
      return EnumErrorCode.OK
    }
    meetingLogger.info('joinRTCRoom:', roomId)
    const { room, code } = await this.rtcClient.joinRTCRoom(roomId)
    if (code !== RCRTCCode.SUCCESS || !room) {
      meetingLogger.info('加入房间时异常,code:' + code)
      return EnumErrorCode.RTCError
    }
    meetingLogger.info('加入房间成功')
    this.rcRoom = room
    this.rcRoom.registerRoomEventListener(roomEventListener)
    this.rcRoom.registerReportListener(roomReportListener)
    rtcState.isConnected = true
    return EnumErrorCode.OK
  }

  public getRoomId(): string {
    return this.rcRoom ? this.rcRoom.getRoomId() : ''
  }

  public getSessionId(): string {
    return this.rcRoom ? this.rcRoom.getSessionId() : ''
  }

  public getUserTracks(userId: string): RCRemoteTrack[] {
    if (!this.rtcClient) {
      meetingLogger.info('离开房间时，this.rtcClient 未初始化')
      return []
    }
    if (!this.rcRoom) {
      meetingLogger.info('离开房音时，this.rcRoom 未初始化')
      return []
    }
    return this.rcRoom.getRemoteTracksByUserId(userId)
  }

  public getUsers(): object[] {
    if (!this.rtcClient) {
      meetingLogger.info('离开房间时，this.rtcClient 未初始化')
      return []
    }
    if (this.rcRoom === undefined) {
      meetingLogger.info('离开房音时，this.rcRoom 未初始化')
      return []
    }
    const users: object[] = []
    const userIds = this.rcRoom.getRemoteUserIds()
    for (const userId of userIds) {
      users.push({
        userId: userId,
        remoteTracks: this.rcRoom.getRemoteTracksByUserId(userId)
      })
    }
    return users
  }

  public getUserIds(): string[] {
    if (!this.rtcClient) {
      meetingLogger.info('离开房间时，this.rtcClient 未初始化')
      return []
    }
    if (this.rcRoom === undefined) {
      meetingLogger.info('离开房音时，this.rcRoom 未初始化')
      return []
    }
    return this.rcRoom.getRemoteUserIds()
  }

  public leaveRoom(): void {
    if (!this.rtcClient) {
      meetingLogger.info('离开房间时，this.rtcClient 未初始化')
      return
    }
    if (!this.rcRoom) {
      meetingLogger.info('离开房音时，this.rcRoom 未初始化')
      return
    }
    this.rcRoom.registerRoomEventListener(null)
    this.rtcClient.leaveRoom(this.rcRoom)
    this.rcRoom = undefined
  }

  public release(): void {
    if (this.rcRoom) {
      this.rcRoom.registerRoomEventListener(null)
      this.rcRoom = undefined
    }
  }

  public async getLocalAudioTrack(
    options: IMicphoneAudioProfile
  ): Promise<{ code: EnumErrorCode; track?: RCLocalAudioTrack }> {
    if (!this.rtcClient) {
      return { code: EnumErrorCode.RTCClientError }
    }
    const { code, track } = await this.rtcClient.createMicrophoneAudioTrack(
      'RongCloudRTC',
      options
    )
    let errCode =
      code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
    return { code: errCode, track: track }
  }

  public async getLocalVideoTrack(
    options: ICameraVideoProfile
  ): Promise<{ code: EnumErrorCode; track?: RCLocalVideoTrack }> {
    if (!this.rtcClient) {
      return { code: EnumErrorCode.RTCClientError }
    }
    // 设置参数
    if (options) {
      const { code, track } = await this.rtcClient.createCameraVideoTrack(
        'RongCloudRTC',
        options
      )
      let errCode =
        code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
      return { code: errCode, track: track }
    }
    const { code, track } = await this.rtcClient.createCameraVideoTrack()
    let errCode =
      code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
    return { code: errCode, track: track }
  }
  public async getScreenVideoTrack(
    tag: string,
    options: any
  ): Promise<{ code: EnumErrorCode; track?: RCLocalVideoTrack }> {
    if (!this.rtcClient) {
      return { code: EnumErrorCode.RTCClientError }
    }
    const { code, track } = await this.rtcClient.createScreenVideoTrack(
      tag,
      options
    )
    console.log('this.rtcClient.createScreenVideoTrack(tag):', code)
    let errCode =
      code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
    return { code: errCode, track: track }
  }
  public async publish(tracks: RCLocalTrack[]): Promise<EnumErrorCode> {
    if (!this.rcRoom) {
      return EnumErrorCode.RTCRoomError
    }
    const { code } = await this.rcRoom.publish(tracks)
    return code === RCRTCCode.SUCCESS
      ? EnumErrorCode.OK
      : EnumErrorCode.RTCRoomError
  }
  public async unPublish(tracks: RCLocalTrack[]): Promise<EnumErrorCode> {
    if (!this.rcRoom) {
      return EnumErrorCode.RTCRoomError
    }
    const { code } = await this.rcRoom.unpublish(tracks)
    return code === RCRTCCode.SUCCESS
      ? EnumErrorCode.OK
      : EnumErrorCode.RTCRoomError
  }
  public async subscribe(track: RCRemoteTrack[]): Promise<EnumErrorCode> {
    if (!this.rcRoom) {
      return EnumErrorCode.RTCRoomError
    }
    const { code } = await this.rcRoom.subscribe(track)
    return code === RCRTCCode.SUCCESS
      ? EnumErrorCode.OK
      : EnumErrorCode.RTCRoomError
  }
  public async createLocalTracks(
    tag: string,
    mediaStream: MediaStream
  ): Promise<{ code: EnumErrorCode; tracks?: RCLocalTrack[] }> {
    if (!this.rtcClient) {
      return { code: EnumErrorCode.RTCClientError }
    }
    const { code, tracks } = await this.rtcClient.createLocalTracks(
      tag,
      mediaStream
    )
    let errCode =
      code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
    return { code: errCode, tracks: tracks }
  }

  public async createLocalFileTracks(
    tag: string,
    file: File
  ): Promise<{ code: EnumErrorCode; tracks?: RCLocalFileTrack[] }> {
    if (!this.rtcClient) {
      return { code: EnumErrorCode.RTCClientError }
    }
    const { code, tracks } = await this.rtcClient.createLocalFileTracks(
      tag,
      file
    )
    let errCode =
      code == RCRTCCode.SUCCESS ? EnumErrorCode.OK : EnumErrorCode.RTCError
    return { code: errCode, tracks: tracks }
  }

  // 获取设备
  public getDevices() {
    let promies = [
      device.getCameras(),
      device.getMicrophones(),
      device.getSpeakers()
    ]
    return Promise.all(promies)
  }
}
const rtcCore = new RTCCore()
export default rtcCore
