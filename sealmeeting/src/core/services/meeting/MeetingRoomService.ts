import meetingApi, { IJoinMeetingParams } from '@/core/api/meetingApi'
import rtcCore, { rtcState } from '@/modules/RTCCore'
import {
  meetingAction,
  trackAction,
  userAction,
  meetingInfo,
  meetingSetting,
  whiteboardAction
} from '@/store/meeting'
import { loginAction, loginAuth } from '@/store/login'
import { meId, meetingId } from '@/session'
import { EnumErrorCode } from '@/types/Enums'
import { meetingLogger } from '@/core/ipc/logger/logger.render'
import {
  IRCRTCReportListener,
  IRCRTCStateReport,
  IRCTrackStat,
  IRoomEventListener,
  RCRemoteAudioTrack,
  RCRemoteTrack,
  RCRemoteVideoTrack
} from '@rongcloud/plugin-rtc'
import { EnumTrackTag, IMeetingInfo } from '@/types/meeting'
import meetingControlApi from '@/core/api/meetingControlApi'
import imCore from '@/modules/IMCore'
import { noticeAction } from '@/store/notice'
import { IService } from '@/core/services'
import { appConfig } from '@/appConfig'
import { ElMessage } from 'element-plus'
import { timeUtil } from '@/utils/timeUtil'
import { stringUtil } from '@/utils/stringUtil'
import { inputDialog } from '@/compos/dialogs'
const rtcRoomEventListener: IRoomEventListener = {
  /**
   * 当本端被剔出房间
   * @description 被踢出房间可能是由于服务端超出一定时间未能收到 rtcPing 消息，所以认为己方离线。
   * 另一种可能是己方 rtcPing 失败次数超出上限，故而主动断线
   * @param byServer
   * 当值为 false 时，说明本端 rtcPing 超时
   * 当值为 true 时，说明本端收到被踢出房间通知
   */
  onKickOff(byServer: boolean) {
    meetingLogger.info('onKickOff')
    console.log('=================我被kickoff===================', byServer)
    rtcState.isConnected = false
    // instance?.leaveMeeting()
  },
  /**
   * 接收到房间信令时回调，用户可通过房间实例的 sendMessage 接口发送信令
   * @param message
   */
  onMessageReceive(name: string, content: any) {},
  /**
   * 房间属性变更回调
   * @param name
   * @param content
   */
  onRoomAttributeChange(name: string, content?: string) {},
  /**
   * 房间用户禁用/启用音频
   * @param audioTrack RCRemoteAudioTrack 类实例
   */
  onAudioMuteChange(audioTrack: RCRemoteAudioTrack) {
    trackAction.trackUpdateMute(audioTrack)
    meetingLogger.info(`收到用户操作音频，track:${audioTrack}`)
  },
  /**
   * 房间用户禁用/启用视频
   * @param videoTrack RCRemoteVideoTrack 类实例对象
   */
  onVideoMuteChange(videoTrack: RCRemoteVideoTrack) {
    trackAction.trackUpdateMute(videoTrack)
    meetingLogger.info(`收到用户操作视频，track:${videoTrack}`)
  },
  /**
   * 房间内用户发布资源
   * @param tracks 新发布的音轨与视轨数据列表，包含新发布的 RCRemoteAudioTrack 与 RCRemoteVideoTrack 实例
   */
  onTrackPublish(tracks: RCRemoteTrack[]) {
    meetingLogger.info(`收到用户发布资源，tracks:${tracks}`)
    for (const track of tracks) {
      if (track.getTag().toLowerCase() !== EnumTrackTag.Normal) {
        userAction.shadowUserSet(track.getUserId(), track.getTag())
      }
      trackAction.trackSet(track)
      if (track.isAudioTrack()) {
        rtcCore.subscribe([track])
      }
    }
  },
  /**
   * 订阅的音视频流通道已建立, track 已可以进行播放
   * @param track RCRemoteTrack 类实例
   */
  onTrackReady(track: RCRemoteTrack): void {
    trackAction.trackUpdateReady(track)
    if (track.isAudioTrack()) {
      track.play()
    }
    meetingLogger.info('onTrackReady:', track)
  },
  /**
   * 房间用户取消发布资源
   * @param tracks 被取消发布的音轨与视轨数据列表
   * @description 当资源被取消发布时，SDK 内部会取消对相关资源的订阅，业务层仅需处理 UI 业务
   */
  onTrackUnpublish(tracks: RCRemoteTrack[]) {
    trackAction.tracksDelete(tracks)
    meetingLogger.info('onTrackUnpublish:', tracks)
  },
  /**
   * 人员加入
   * @param userIds 加入的人员 id 列表
   */
  onUserJoin(userIds: string[]) {
    userIds.forEach(userId => {
      meetingLogger.info('onUserJoin', userId)
      const user: any = { userId }
      user.isHost = userId === meetingInfo.hostId
      user.isSpeaker = userId === meetingInfo.speakerId
      userAction.userSet(user)
    })
  },
  /**
   * 人员退出
   * @param userIds
   */
  onUserLeave(userIds: string[]) {
    userIds.forEach(userId => {
      meetingLogger.info('onUserLeave', userId)
      userAction.userDelete(userId + '-shadow')
      userAction.userDelete(userId)
    })
  }
}
const rtcRoomReportListener: IRCRTCReportListener = {
  /**
   * ICE 连接状态变更通知
   * @param state 当前连接状态
   */
  onICEConnectionStateChange(state: RTCIceConnectionState) {},
  /**
   * RTCPeerConnection 连接状态
   * @param state 当前连接状态
   */
  onConnectionStateChange(state: RTCPeerConnectionState) {},
  /**
   * RTCPeerConnection 的详细状态数据
   * @param report
   */
  onStateReport(report: IRCRTCStateReport) {
    const userNames = []
    // 本地
    let audioTrackStats: IRCTrackStat[] = report.senders.filter(item => {
      return item.kind === 'audio' && item.audioLevel! > 0
    })
    for (const audioTrackState of audioTrackStats) {
      const track = trackAction.trackGet(audioTrackState.trackId)
      if (track?.getTag().toLowerCase() === EnumTrackTag.Normal) {
        const user = userAction.userGet(track.getUserId())
        !!user && userNames.push(stringUtil.subString(user.userName, 10))
      }
    }

    // 远端
    audioTrackStats = report.receivers.filter(item => {
      return item.kind === 'audio' && item.audioLevel! > 0.1
    })
    for (const audioTrackState of audioTrackStats) {
      const track = trackAction.trackGet(audioTrackState.trackId)
      if (track?.getTag().toLowerCase() === EnumTrackTag.Normal) {
        console.log('! track.isOwerMuted', !track.isOwnerMuted())
        if (!track.isOwnerMuted()) {
          const user = userAction.userGet(track.getUserId())
          !!user && userNames.push(stringUtil.subString(user.userName, 10))
        }
      }
      if (userNames.length >= 3) {
        break
      }
    }
    meetingSetting.speakingUsers = userNames.toString()
  }
}
export class MeetingRoomService implements IService {
  constructor() {}
  onMeetingStart(): void {
    meetingSetting.userMediaPage = 1
    meetingInfo.inited = true
  }
  onMeetingEnd(): void {
    this.release()
  }
  onLogout(): void {
    this.release()
  }
  public release() {
    trackAction.clear()
    userAction.clear()
    meetingAction.clear()
    noticeAction.clear()
    whiteboardAction.clear()
    rtcCore.release()
  }

  public async joinMeeting(
    params: IJoinMeetingParams
  ): Promise<{ errorCode: EnumErrorCode; meetingId: string }> {
    while (true) {
      const response = await meetingApi.JoinMeeting(params)
      if (response.code === EnumErrorCode.OK) {
        return { errorCode: response.code, meetingId: response.data?.id }
      } else if (response.code === 30006) {
        ElMessage.error('请输入会议密码')
        const { data, action } = await inputDialog.inputPassword()
        console.log(data.value, action)
        if (action === 'confirm') {
          params.password = data.value
          continue
        } else {
          return { errorCode: EnumErrorCode.MeetingJoinCanceled, meetingId: '' }
        }
      } else if (response.code === 30005) {
        ElMessage.error('密码错误，请重新输入')
        const { data, action } = await inputDialog.inputPassword()
        if (action === 'confirm') {
          params.password = data.value
          continue
        } else {
          return { errorCode: EnumErrorCode.MeetingJoinCanceled, meetingId: '' }
        }
      } else {
        return { errorCode: response.code, meetingId: '' }
      }
    }
  }

  public async initMeeting(roomId: string): Promise<EnumErrorCode> {
    if (appConfig.launchFrom !== 'rce') {
      // rce 集成，不需要登录
      // 登录 会控服务器
      const mcRsp = await meetingControlApi.login(
        loginAuth.id,
        loginAuth.authorization
      )
      if (mcRsp.code !== EnumErrorCode.OK) {
        return mcRsp.code
      }
      loginAction.updateLoginAuth({ rcmtToken: mcRsp.data.rcmtToken })
    }
    // 获取会议基本信息
    const meetingRst = await meetingApi.getMeetingInfo(roomId)
    if (meetingRst.code !== EnumErrorCode.OK) {
      return meetingRst.code
    }
    meetingAction.meetingUpdate(meetingRst.data)

    // 会议状态信息
    const controlRst = await meetingControlApi.getMeetingInfo(roomId)
    if (controlRst.code != EnumErrorCode.OK) {
      return controlRst.code
    }
    meetingLogger.info('meetingControlApi.getMeetingInfo rst:', controlRst.data)
    meetingAction.meetingUpdate(controlRst.data)

    // 加入RTC
    const rtcRst = await rtcCore.joinRTCRoom(
      roomId,
      rtcRoomEventListener,
      rtcRoomReportListener
    )
    if (rtcRst !== EnumErrorCode.OK) {
      return rtcRst
    }

    const userIds = rtcCore.getUserIds()
    meetingLogger.info('会议内人员id,', userIds)
    userAction.userSet({
      userId: loginAuth.id,
      userName: loginAuth.name,
      portrait: loginAuth.portrait,
      isHost: controlRst.data.hostId === loginAuth.id,
      isMe: true
    })
    // userAction.userSet({
    //   userId: 'aa',
    //   userName: 'aa'
    // })
    // userAction.userSet({
    //   userId: 'bb',
    //   userName: 'bb'
    // })
    // userAction.userSet({
    //   userId: 'cc',
    //   userName: 'cc'
    // })
    // userAction.userSet({
    //   userId: 'dd',
    //   userName: 'dd'
    // })
    const allAudioTracks = []
    for (const userId of userIds) {
      // 添加已在会议的用户
      const user = {
        userId: userId
      }
      userAction.userSet(user)
      // 获得已经发布的资源
      const tracks = rtcCore.getUserTracks(userId)
      for (const track of tracks) {
        // 生成影子用户
        if (track.getTag().toLowerCase() !== EnumTrackTag.Normal) {
          userAction.shadowUserSet(track.getUserId(), track.getTag())
        }
        // 添加track
        trackAction.trackSet(track)
        // 集合音频track
        if (track.isAudioTrack()) {
          allAudioTracks.push(track)
        }
      }
    }
    // 程现Speaker
    if (meetingInfo.speakerId) {
      meetingAction.actSpeakerChanged(meetingInfo.speakerId, true)
    }
    // 处理host
    if (meetingInfo.hostId) {
      meetingAction.actHostChanged('', meetingInfo.hostId)
    }
    if (controlRst?.data?.resourceShareExtra) {
      const extraObj = JSON.parse(controlRst.data.resourceShareExtra)
      const creatorId = extraObj.creatorId
      const resourceContent = extraObj.resourceContent
      const resourceType = extraObj.resourceType // 0:白板，1:屏幕共享，2：媒体文件
      if (resourceType === 0) {
        // 白板
        const type = resourceContent.type
        const rcUrl = resourceContent.rcUrl
        const hwRoomToken = resourceContent.hwRoomToken
        const hwUuid = resourceContent.hwUuid
        if (type === 2) {
          // rcx 的白板
          userAction.shadowUserSet(creatorId, EnumTrackTag.WhiteBoard)
          whiteboardAction.shareStarted(creatorId, resourceContent)
        }
      }
    }
    // 统一订阅音频
    this.subscribeAudio(allAudioTracks)

    // 加入IM
    const imRst = await imCore.joinChatRoom(roomId)
    if (imRst !== EnumErrorCode.OK) {
      return imRst
    }
    return EnumErrorCode.OK
  }

  public leaveMeeting(isStop: boolean = false) {
    const meetingId = meetingInfo.id
    if (!meetingId) {
      return
    }
    if (isStop) {
      meetingControlApi.stopMeeting(meetingId)
      meetingApi.stopMeeting(meetingId)
    } else {
      meetingApi.leaveMeeting(meetingId)
    }
    rtcCore.leaveRoom()
    imCore.leaveChatRoom(meetingId)
  }

  public async initUser(userId: string): Promise<EnumErrorCode> {
    return await this.initUsers([userId])
  }

  private async initUsers(userIds: string[]): Promise<EnumErrorCode> {
    if (userIds.length > 20) {
      return EnumErrorCode.ParamsError
    }
    const rst = await meetingApi.getUserInfo(meetingInfo.id, userIds)
    if (rst.code !== EnumErrorCode.OK) {
      return rst.code
    }
    // 将用户是否初始化置为true,以后不再获取
    ;(rst.data as Array<any>).forEach(user => {
      user.inited = true
      userAction.userSet(user)
    })
    return EnumErrorCode.OK
  }

  public async subscribeAudio(tracks: RCRemoteTrack[]): Promise<EnumErrorCode> {
    const audioTracks: RCRemoteTrack[] = []
    tracks.forEach(track => {
      track.isAudioTrack() && audioTracks.push(track)
    })
    if (audioTracks.length > 0) {
      meetingLogger.info(
        `meetingRoomService.subscribeAudio :--: tacks:`,
        audioTracks
      )
      const code = await rtcCore.subscribe(audioTracks)
      if (code != EnumErrorCode.OK) {
        meetingLogger.error(`tracks tracks:${tracks}`)
        return code
      }
    }
    return EnumErrorCode.OK
  }

  public async subscribeVideo(trackId: string): Promise<EnumErrorCode> {
    const track = trackAction.remoteTrackGet(trackId)
    if (!track) {
      return EnumErrorCode.RTCError
    }
    if (track.isAudioTrack()) {
      meetingLogger.error(`UI层仅支持订阅video，audio由底层托管`)
      return EnumErrorCode.ParamsError
    }
    meetingLogger.info(
      'meetingRoomService.subscribeVideo',
      `userId:${track.getUserId()}`,
      `trackTag:${track.getTag()}`
    )
    const code = await rtcCore.subscribe([track])
    if (code != EnumErrorCode.OK) {
      meetingLogger.error(
        `track 订阅失败，userId:${track.getUserId()}, trackId:${
          track.getTrackId
        }, trackTag:${track.getTag}`
      )
      return code
    }
    return EnumErrorCode.OK
  }

  public playVideo(trackId: string, eleId: string): EnumErrorCode {
    const track = trackAction.trackGet(trackId)
    if (!track) {
      return EnumErrorCode.RTCError
    }
    if (track.isAudioTrack()) {
      meetingLogger.error(`UI层仅支持播放video，audio由底层托管`)
      return EnumErrorCode.ParamsError
    }
    const ele = document.getElementById(eleId) as HTMLVideoElement
    if (!ele) {
      return EnumErrorCode.UnKnown
    }
    track.play(ele)
    return EnumErrorCode.OK
  }

  public playAudio(trackId: string) {
    const track = trackAction.trackGet(trackId)
    if (track) {
      if (track.isVideoTrack()) {
        meetingLogger.error(`playAudio仅支持播放audio`)
        return EnumErrorCode.ParamsError
      }
      track.play()
    }
  }

  public async ctrlMeetingLock(isLock: boolean) {
    const lockStatus = isLock ? 1 : 0
    const rst = await meetingControlApi.lockMeeting(meetingId.value, lockStatus)
    if (rst.code === EnumErrorCode.OK) {
      meetingAction.meetingUpdate({ lockStatus: lockStatus })
    }
  }

  public async ctrlMeetingRecord(isRecord: boolean): Promise<EnumErrorCode> {
    const sessionId = rtcCore.getSessionId()
    if (isRecord) {
      const videoTrack = trackAction.getTrack()
      if (videoTrack) {
        const rst = await meetingApi.startRecord(
          meetingId.value,
          sessionId,
          videoTrack.getUserId(),
          videoTrack.getStreamId()
        )
        if (rst.code === EnumErrorCode.OK) {
          meetingAction.meetingUpdate({
            recordStatus: 1,
            recordStartDt: timeUtil.getNowInt()
          })
        }
        return rst.code
      } else {
        return EnumErrorCode.RecordNoVideo
      }
    } else {
      const rst = await meetingApi.stopRecord(meetingId.value, sessionId)
      if (rst.code === EnumErrorCode.OK) {
        meetingAction.meetingUpdate({ recordStatus: 0, recordStartDt: 0 })
      }
      return rst.code
    }
  }

  public async ctrlMeetingSetting(
    isAudioClose: boolean,
    isVideoClose: boolean
  ) {
    await meetingApi.updateMeetingSetting(
      meetingId.value,
      isVideoClose,
      isAudioClose
    )
  }

  public async syncMeetingBasic(): Promise<EnumErrorCode> {
    const rst = await meetingApi.getMeetingBasicInfo(meetingId.value)
    if (rst.code === EnumErrorCode.OK) {
      meetingAction.meetingUpdate(rst.data)
    }
    return rst.code
  }

  public async historyMeetingListService(): Promise<any> {
    const rst = await meetingApi.getMeetingHistoryList()
    if (rst.code === EnumErrorCode.OK) {
      return rst.data
    }
    return null
  }

  public async getMeetingInfo(meetingId: string): Promise<IMeetingInfo | null> {
    const rst = await meetingApi.getMeetingInfo(meetingId)
    if (rst.code === EnumErrorCode.OK) {
      return rst.data
    }
    return null
  }

  public async getMeetingBasicInfo(meetingId: string) {
    const rst = await meetingApi.getMeetingBasicInfo(meetingId)
    if (rst.code === EnumErrorCode.OK) {
      return rst.data
    }
    return null
  }

  public async meetingDeleteOneService(
    meetingId: string | number
  ): Promise<any> {
    const rst = await meetingApi.deleteMeetingById(meetingId)
    if (rst.code === EnumErrorCode.OK) {
      return true
    }
    return rst.code
  }

  public async meetingScheduleService(data: {
    [key: string]: any
  }): Promise<any> {
    const rst = await meetingApi.meetingSchedule(data)
    if (rst.code === EnumErrorCode.OK) {
      return rst.data
    }
    return null
  }
}
