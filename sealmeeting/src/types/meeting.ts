import { RCLocalTrack, RCRemoteTrack } from '@rongcloud/plugin-rtc'

export type RCTrack = RCLocalTrack | RCRemoteTrack

export interface IMeetingState {
  /**
   * 当前会议信息
   */
  meetingInfo: IMeetingInfo
  /**
   * 用户多媒体列表，用来展示视频列表
   */
  userMediaList: IUserModel[]
  /**
   * 用户信息列表，用来展示成员列表
   */
  userInfoList: IUserModel[]
  /**
   * 会议设置
   */
  meetingSetting: IMeetingSetting
  meInfo: IUserModel
  whiteboardInfo: IWhiteboardInfo
  getMeetingId: () => string
  getMeetingNumber: () => string
  getMeId: () => string
}
export interface IMeetingInfo {
  inited: boolean // 会议是否初始化成功，包括加入会议，初始化sdk
  loginUserId: string
  creatorId: string
  creatorName: string
  id: string
  joinForceCloseCamera: boolean
  joinForceCloseMic: boolean
  number: string
  recordStartDt: number
  recordStatus: number // 0 未开始，1开始
  startDt: number //1618556767598
  endDt: number
  status: number
  subject: string // '二狼的会议'

  meetingId: string
  hostId: string
  speakerId: string
  lockStatus: number // 1锁定状态
  resourceShareExtra: any
}
export interface IMeetingSetting {
  /**
   * 焦点用户，只有普通用户才有的能力
   */
  foucsUserId: string
  /**
   * 主讲人
   */
  speakerId: string
  /**
   * 分享用户，只有影子用户才有的能力
   * 分享、主讲、焦点用户，显示优先级由高到低，互相独立显示
   */
  shareUserId: string

  shareTrackTag: string // 分享用户的tag
  isFocusFull: boolean // 当前大屏用户是否是最大化

  hasNewMessage: boolean
  isUserDrawerShow: boolean
  isChatDrawerShow: boolean

  isSettingShow: boolean

  speakingUsers: string

  userMediaPage: number // 用户视频显示页码

  isInviteShow: boolean
}
export interface IUserModel {
  userId: string
  userName: string
  portrait: string

  /**
   * 是否为影子用户
   * 当用户在进行分享时会复制一个影子出来，加入到Medialist进行页面播放
   * 影子用户的ID为 userId-shadow
   */
  isShadow: boolean //

  trackTag: string
  audioTrackId: string
  isAudioTrackReady: boolean
  videoTrackId: string
  isVideoTrackReady: boolean

  isHost: boolean
  isTop: boolean
  isSpeaker: boolean
  isAudioOn: boolean
  isVideoOn: boolean

  isInited: boolean
  isMe: boolean

  joinOrder: number // 加入时间，用来排序
}
export interface IWhiteboardInfo {
  type: number
  hwUuid: string
  hwRoomToken: string
  rcUrl: string
}
export const createWhiteboardInfo = () => {
  return {
    type: 0,
    hwUuid: '',
    hwRoomToken: '',
    rcUrl: ''
  }
}
export const createUser = (userId: string) => {
  return {
    userId: userId,
    userName: '',
    portrait: '',

    isShadow: false, //

    isAudioOn: false,
    audioTrackId: '',
    isAudioTrackReady: false,

    isVideoOn: false,
    videoTrackId: '',
    isVideoTrackReady: false,

    trackTag: '',

    isHost: false,
    isTop: false,
    isSpeaker: false,

    isInited: false,
    isMe: false,

    joinOrder: 0
  }
}

export const createMeetingInfo = () => {
  return {
    inited: false,
    loginUserId: '',
    creatorId: '',
    creatorName: '',
    id: '',
    joinForceCloseCamera: false,
    joinForceCloseMic: false,
    number: '',
    recordStartDt: 0,
    recordStatus: 0,
    startDt: 0, //1618556767598
    endDt: 0,
    status: 0,
    subject: '', // '二狼的会议'

    meetingId: '',
    hostId: '',
    speakerId: '',
    lockStatus: 0,
    resourceShareExtra: null
  }
}

export const createMeetingSetting = () => {
  return {
    foucsUserId: '', // 焦点用户ID
    isFocusFull: false, // 是否是焦点全屏
    speakerId: '',

    shareUserId: '',
    shareTrackTag: '',

    hasNewMessage: false,
    isUserDrawerShow: false,
    isChatDrawerShow: false,

    isSettingShow: false,
    speakingUsers: '',
    userMediaPage: 1,

    isInviteShow: false
  }
}

export enum EnumTrackTag {
  Normal = 'rongcloudrtc',
  ScreenShare = 'screenshare',
  MediaFileVideo = 'mediafilevideo',
  WhiteBoard = 'whiteboard'
}

export type IDetialType = {
  subject: string
  date: string
  number: string | number
  roomId: string | number
  id: string | number
  password?: string | number | null
  [key: string]: any
}
