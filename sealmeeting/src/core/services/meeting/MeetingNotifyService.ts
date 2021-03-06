import meetingControlApi from '@/core/api/meetingControlApi'
import { meId, meetingId } from '@/session'
import {
  meetingAction,
  meetingSetting,
  userAction,
  whiteboardAction
} from '@/store/meeting'
import { ElMessage } from 'element-plus'
import {
  showCommonNotice,
  getMeetingStoppedNotice,
  showNotice
} from '@/utils/noticeUtil'
import imCore from '@/modules/IMCore'
import { emitEvent } from '@/store/event'
import { meetingLogger } from '@/core/ipc/logger/logger.render'
import routerUtil from '@/utils/routerUtil'
import { loginAuth } from '@/store/login'
import { IService } from '@/core/services'
import { EnumTrackTag } from '@/types/meeting'
import meetingApi from '@/core/api/meetingApi'
import { EnumErrorCode } from '@/types/Enums'
export class MeetingNotifyService implements IService {
  constructor() {}
  onMeetingEnd(): void {
    imCore.offMsg('MT:Unknown', this.onUnknownNotify)
    imCore.offMsg('RCMT:MeetingNtfy-1', this.onMeetingStoped)
    imCore.offMsg('RCMT:MeetingNtfy-2', this.onShareStarted)
    imCore.offMsg('RCMT:MeetingNtfy-3', this.onShareStopped)
    imCore.offMsg('RCMT:MeetingNtfy-4', this.onMeetingLockChanged)
    imCore.offMsg('SealMT:MeetingRecordNtfy-1', this.onRecordStopped)
    imCore.offMsg('RCMT:DeviceControlNtfy-1', this.onDeviceControled)
    imCore.offMsg('RCMT:DeviceControlNtfy-2', this.onDeviceControlAccepted)
    imCore.offMsg('RCMT:DeviceControlNtfy-3', this.onDeviceControlRejected)
    imCore.offMsg('RCMT:MemberControlNtfy-1', this.onUserKicked)
    imCore.offMsg('RCMT:MemberControlNtfy-2', this.onHostTransfered)
    imCore.offMsg('RCMT:MemberControlNtfy-3', this.onSpeakerSeted)
    imCore.offMsg('RCMT:MemberControlNtfy-4', this.onSpeakerCanceled)
    imCore.offMsg('SealMT:MeetingMemberNtfy-1', this.onNameChanged)
  }

  public onMeetingStart() {
    imCore.onMsg('MT:Unknown', this.onUnknownNotify)
    imCore.onMsg('RCMT:MeetingNtfy-1', this.onMeetingStoped)
    imCore.onMsg('RCMT:MeetingNtfy-2', this.onShareStarted)
    imCore.onMsg('RCMT:MeetingNtfy-3', this.onShareStopped)
    imCore.onMsg('RCMT:MeetingNtfy-4', this.onMeetingLockChanged)
    imCore.onMsg('SealMT:MeetingRecordNtfy-1', this.onRecordStopped)
    imCore.onMsg('RCMT:DeviceControlNtfy-1', this.onDeviceControled)
    imCore.onMsg('RCMT:DeviceControlNtfy-2', this.onDeviceControlAccepted)
    imCore.onMsg('RCMT:DeviceControlNtfy-3', this.onDeviceControlRejected)
    imCore.onMsg('RCMT:MemberControlNtfy-1', this.onUserKicked)
    imCore.onMsg('RCMT:MemberControlNtfy-2', this.onHostTransfered)
    imCore.onMsg('RCMT:MemberControlNtfy-3', this.onSpeakerSeted)
    imCore.onMsg('RCMT:MemberControlNtfy-4', this.onSpeakerCanceled)
    imCore.onMsg('SealMT:MeetingMemberNtfy-1', this.onNameChanged)
  }
  onLogout(): void {}

  private async onMeetingStoped(content: any) {
    //RCMT:MeetingNtfy-1
    console.log(content)
    if (content.operatorId === loginAuth.id) {
      // ??????????????????
      return
    }
    meetingLogger.info('??????????????????????????? ,operatorId:', content.operatorId)
    emitEvent('ctrl:meetingEnded', {})
    const notice = getMeetingStoppedNotice()
    await showNotice(notice)
    routerUtil.toHome()
  }

  private onShareStarted(content: any) {
    //RCMT:MeetingNtfy-2
    console.log(content)
    const extra = content?.data?.extra
    if (extra) {
      const extraObj: any = JSON.parse(extra)
      const creatorId = extraObj.creatorId
      if (creatorId == meId.value) {
        console.log('???????????????????????????????????????')
        return
      }
      const resourceContent = extraObj.resourceContent
      const resourceType = extraObj.resourceType // 0:?????????1:???????????????2???????????????
      if (resourceType === 0) {
        // ??????
        const type = resourceContent.type
        const rcUrl = resourceContent.rcUrl
        const hwRoomToken = resourceContent.hwRoomToken
        const hwUuid = resourceContent.hwUuid
        // if (type === 2) { // rcx ?????????
        userAction.shadowUserSet(creatorId, EnumTrackTag.WhiteBoard)
        whiteboardAction.shareStarted(creatorId, resourceContent)
        // }
      }
    }
  }

  private onShareStopped(content: any) {
    //RCMT:MeetingNtfy-3
    console.log(content)
    if (content.operatorId === meId.value) {
      console.log('???????????????????????????????????????')
      return
    }
    const extra = content?.data?.extra
    if (extra) {
      const extraObj: any = JSON.parse(extra)
      const creatorId = extraObj.creatorId
      if (creatorId == meId.value) {
        // ?????????????????????
        emitEvent('ctrl:stopShare', null)
        console.log('???????????????????????????')
        return
      } else {
        //???????????????
        const resourceContent = extraObj.resourceContent
        const resourceType = extraObj.resourceType // 0:?????????1:???????????????2???????????????
        if (resourceType === 0) {
          // ??????
          const type = resourceContent.type
          const rcUrl = resourceContent.rcUrl
          const hwRoomToken = resourceContent.hwRoomToken
          const hwUuid = resourceContent.hwUuid
          whiteboardAction.shareStoped()
          userAction.userDelete(creatorId + '-shadow')
        }
      }
    }
  }

  private async onDeviceControled(content: any) {
    console.log(content)
    //RCMT:DeviceControlNtfy-1
    // {
    //   "action" : 1,
    //   "operatorId" : "xxxxxxx",
    //    "deviceType": "mic",
    //    "targetIds": ["8898834"],
    //    "status": "close"
    //  }
    const meId = loginAuth.id
    if (content.operatorId === meId) {
      // ?????????????????????????????????
      return
    }
    const targetIds = content.targetIds as string[]
    if (targetIds.length === 0) {
      // ??????????????????????????????????????????
      targetIds.push(meId)
    }
    if (!targetIds.includes(meId)) {
      // ????????????????????????
      return
    }
    const device = content.deviceType === 'mic' ? '?????????' : '?????????'
    const event =
      content.deviceType === 'mic' ? 'ctrl:operateAudio' : 'ctrl:operateVideo'
    if (content.status === 'open') {
      const msg = `????????????????????????${device}`
      const action = await showCommonNotice(msg)
      if (action === 'confirm') {
        emitEvent(event, true)
        meetingControlApi.deviceControlAccept(
          meetingId.value,
          content.deviceType,
          content.status
        )
      } else {
        meetingControlApi.deviceControlReject(
          meetingId.value,
          content.deviceType,
          content.status
        )
      }
    } else {
      emitEvent(event, false)
    }
  }

  private onDeviceControlAccepted(content: any) {
    //RCMT:DeviceControlNtfy-2
    // {
    //   "action" : 2,
    //   "operatorId" : "xxxxxxx",
    //   "targetIds": ["8898834"],
    //    "deviceType": "mic",
    //    "status": "close"
    //  }
    if (content.operatorId === meId.value) {
      // ?????????????????????????????????
      return
    }
    const targetIds = content.targetIds as string[]
    if (targetIds.includes(meId.value)) {
      ElMessage.info('????????????????????????')
      console.log(content)
    }
  }

  private onDeviceControlRejected(content: any) {
    //RCMT:DeviceControlNtfy-3
    // {
    //   "action" : 3,
    //   "operatorId" : "xxxxxxx",
    //   "targetIds": ["8898834"],
    //    "deviceType": "mic",
    //    "status": "close"
    //  }
    if (content.operatorId === loginAuth.id) {
      // ?????????????????????????????????
      return
    }
    ElMessage.info('????????????????????????')
    console.log(content)
  }

  private async onUserKicked(content: any) {
    //RCMT:MemberControlNtfy-1
    // {
    //   "action": 1
    //   "operatorId": "operatorId",
    //   "targetId": "target_user_id"
    // }
    console.log(content)
    const meId = loginAuth.id
    if (content.operatorId === meId) {
      // ?????????????????????????????????
      return
    }
    if (content.targetId === meId) {
      emitEvent('ctrl:meetingEnded', {})
      await showCommonNotice(`?????????????????????`)
      routerUtil.toHome()
    } else {
      userAction.actUserKick(content.targetId)
    }
  }

  private async onHostTransfered(content: any) {
    //RCMT:MemberControlNtfy-2
    //   {
    //     "action": 2,
    //     "operatorId": "operatorId",
    //     "targetId": "target_user_id"
    // }
    meetingLogger.info(
      '??????????????????????????????',
      `???????????????${content.operatorId}`,
      `???????????????${content.targetId}`
    )
    const meId = loginAuth.id
    if (content.operatorId === meId) {
      // ?????????????????????????????????
      return
    }
    if (content.targetId === meId) {
      ElMessage.info('?????????????????????')
      const meetingRst = await meetingApi.getMeetingInfo(meetingId.value)
      if (meetingRst.code === EnumErrorCode.OK) {
        meetingAction.meetingUpdate(meetingRst.data)
      }

      const controlRst = await meetingControlApi.getMeetingInfo(meetingId.value)
      if (controlRst.code === EnumErrorCode.OK) {
        meetingAction.meetingUpdate(controlRst.data)
      }
    }
    meetingAction.actHostChanged(content.operatorId, content.targetId)
  }

  private onSpeakerSeted(content: any) {
    //RCMT:MemberControlNtfy-3
    //   {
    //     "action": 3,
    //     "operatorId": "operatorId",
    //     "targetId": "target_user_id"
    // }
    if (meetingSetting.speakerId !== content.targetId) {
      !!meetingSetting.speakerId &&
        meetingAction.actSpeakerChanged(meetingSetting.speakerId, false)
      meetingAction.actSpeakerChanged(content.targetId, true)
    }
    if (content.targetId === meId) {
      ElMessage.info('??????????????????')
    }
  }

  private onSpeakerCanceled(content: any) {
    //RCMT:MemberControlNtfy-4
    //   {
    //     "action": 4,
    //     "operatorId": "operatorId",
    //     "targetId": ""
    // }
    if (content.operatorId === meId.value) {
      // ?????????????????????????????????
      return
    }
    meetingLogger.info('??????????????????????????????', `????????????${content.targetId}`)
    meetingAction.actSpeakerChanged(content.targetId, false)
  }

  private onNameChanged(content: any) {
    // ObjectName: SealMT:MeetingMemberNtfy
    // {
    //      "type": 1,
    //      "targetId": "xxxxxx",
    //      "targetName": "xxxxx"
    // }
    userAction.userUpdate({
      userId: content.targetId,
      userName: content.targetName
    })
  }

  private onMeetingLockChanged(content: any) {
    //     {
    //       "action": 4,
    //       "operatorId": "916b9d59-054e-4b8e-8e52-b1197bc0b628",
    //       "data": {
    //            "lockStatus": 0
    //       }
    //  }
    meetingAction.meetingUpdate({ locakStatus: content.data.lockStatus })
  }

  private onRecordStopped(content: any) {
    ElMessage.info('?????????????????????')
    meetingAction.meetingUpdate({ recordStatus: 0, recordStartDt: 0 })
  }

  private onUnknownNotify(content: any) {
    //RCMT:MeetingNtfy-1
    console.log(content)
  }
}
