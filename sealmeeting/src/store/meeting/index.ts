import {
  IUserModel,
  IMeetingSetting,
  IMeetingInfo,
  createUser,
  createMeetingInfo,
  createMeetingSetting,
  EnumTrackTag,
  RCTrack,
  IWhiteboardInfo,
  createWhiteboardInfo
} from '@/types/meeting'
import { reactive, computed } from 'vue'
import { UserAction } from './userAction'
import { MeetingAction } from './meetingAction'
import { TrackAction } from './trackAction'
import { WhiteboardAction } from './whiteboardAction'
export const meInfo: IUserModel = reactive(createUser(''))
export const trackMap: Map<string, RCTrack> = new Map()
export const userMap: Map<string, IUserModel> = new Map()
// export const userMediaList: IUserModel[] = reactive([])
export const userInfoList: IUserModel[] = reactive([])
export const meetingInfo: IMeetingInfo = reactive(createMeetingInfo())
export const meetingSetting: IMeetingSetting = reactive(createMeetingSetting())
export const whiteboardInfo: IWhiteboardInfo = reactive(createWhiteboardInfo())
export const userMediaList = computed(() => {
  return userInfoList.slice(0, meetingSetting.shareUserId ? 10 : 9)
})
export const userAction = new UserAction()
export const meetingAction = new MeetingAction()
export const trackAction = new TrackAction()
export const whiteboardAction = new WhiteboardAction()
