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
      // 我自己结束的
      return
    }
    meetingLogger.info('收到通知：会议结束 ,operatorId:', content.operatorId)
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
        console.log('收到我自己的分享开始，忽略')
        return
      }
      const resourceContent = extraObj.resourceContent
      const resourceType = extraObj.resourceType // 0:白板，1:屏幕共享，2：媒体文件
      if (resourceType === 0) {
        // 白板
        const type = resourceContent.type
        const rcUrl = resourceContent.rcUrl
        const hwRoomToken = resourceContent.hwRoomToken
        const hwUuid = resourceContent.hwUuid
        // if (type === 2) { // rcx 的白板
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
      console.log('收到我自己的分享结束，忽略')
      return
    }
    const extra = content?.data?.extra
    if (extra) {
      const extraObj: any = JSON.parse(extra)
      const creatorId = extraObj.creatorId
      if (creatorId == meId.value) {
        // 主持人要结束我
        emitEvent('ctrl:stopShare', null)
        console.log('收到主持人要结束我')
        return
      } else {
        //别人结束了
        const resourceContent = extraObj.resourceContent
        const resourceType = extraObj.resourceType // 0:白板，1:屏幕共享，2：媒体文件
        if (resourceType === 0) {
          // 白板
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
      // 此时是我自己发出的会控
      return
    }
    const targetIds = content.targetIds as string[]
    if (targetIds.length === 0) {
      // 当对全员控制时，视为对我控制
      targetIds.push(meId)
    }
    if (!targetIds.includes(meId)) {
      // 当前不是对我控制
      return
    }
    const device = content.deviceType === 'mic' ? '麦克风' : '摄像头'
    const event =
      content.deviceType === 'mic' ? 'ctrl:operateAudio' : 'ctrl:operateVideo'
    if (content.status === 'open') {
      const msg = `管理员邀请你打开${device}`
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
      // 此时是我自己发出的会控
      return
    }
    const targetIds = content.targetIds as string[]
    if (targetIds.includes(meId.value)) {
      ElMessage.info('用户同意控制设备')
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
      // 此时是我自己发出的会控
      return
    }
    ElMessage.info('用户拒绝控制设备')
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
      // 此时是我自己发出的会控
      return
    }
    if (content.targetId === meId) {
      emitEvent('ctrl:meetingEnded', {})
      await showCommonNotice(`您已被移出会议`)
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
      '收到通知：主持人移交',
      `原主持人：${content.operatorId}`,
      `新主持人：${content.targetId}`
    )
    const meId = loginAuth.id
    if (content.operatorId === meId) {
      // 此时是我自己发出的会控
      return
    }
    if (content.targetId === meId) {
      ElMessage.info('您已成为主持人')
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
      ElMessage.info('您已成为主讲')
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
      // 此时是我自己发出的会控
      return
    }
    meetingLogger.info('收到通知：取消主讲人', `主讲人：${content.targetId}`)
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
    ElMessage.info('会议录制已结束')
    meetingAction.meetingUpdate({ recordStatus: 0, recordStartDt: 0 })
  }

  private onUnknownNotify(content: any) {
    //RCMT:MeetingNtfy-1
    console.log(content)
  }
}
