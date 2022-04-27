import { meetingOperateService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { IUserModel } from '@/types/meeting'
import parseErrorCode from '@/utils/errorUtil'
import { onEvent } from '@/store/event'
import { meetingInfo } from '@/store/meeting'
import { settingState } from '@/store/setting'
import { ElMessage } from 'element-plus'
import { onMounted, watch } from 'vue'

export default (meInfo: IUserModel) => {
  let isActBusy = false

  const operateAudio = async (isOn: boolean | undefined): Promise<void> => {
    if (isActBusy) return
    isActBusy = true
    const willOn = typeof isOn === 'boolean' ? isOn : !meInfo.isAudioOn
    const errCode = await meetingOperateService.operateAudio(willOn)
    if (errCode != EnumErrorCode.OK) {
      const msg = parseErrorCode(errCode)
      ElMessage.error(msg)
    }
    isActBusy = false
  }

  const operateVideo = async (isOn: boolean | undefined): Promise<void> => {
    let hasNoBug = false
    if (isActBusy) return   
    isActBusy = true
    const willOn = typeof isOn === 'boolean' ? isOn : !meInfo.isVideoOn
    const errCode = await meetingOperateService.operateVideo(willOn)
    if (errCode != EnumErrorCode.OK) {
      const msg = parseErrorCode(errCode)
      ElMessage.error(msg)
      hasNoBug = true
    }
    // 41340 - 【音视频】pc参与会议中，开启了摄像头，此时去拨打视频电话，仍可拨打视频电话
    if (hasNoBug === false) {
      ElMessage.success("可找产品确定");
    }
    isActBusy = false
  }
  onEvent('ctrl:operateAudio', operateAudio)
  onEvent('ctrl:operateVideo', operateVideo)
  watch(
    () => settingState.microphoneId,
    async () => {
      if (meInfo.isAudioOn) {
        console.log('settingState.microphone 有变化，重新发布音频')
        await meetingOperateService.operateAudio(false)
        await meetingOperateService.operateAudio(true)
      }
    }
  )
  watch(
    () => [settingState.cameraId, settingState.cameraRes],
    async () => {
      if (meInfo.isVideoOn) {
        console.log('settingState.camera 有变化，重新发布视频')
        await meetingOperateService.operateVideo(false)
        await meetingOperateService.operateVideo(true)
      }
    }
  )
  watch(
    () => meetingInfo.inited,
    async (val, preVal) => {
      if (val) {
        if (!meetingInfo.joinForceCloseMic && settingState.isAudioOn) {
          await operateAudio(true)
        }
        if (!meetingInfo.joinForceCloseCamera && settingState.isVideoOn) {
          await operateVideo(true)
        }
      }
    }
  )
  return {
    operateAudio,
    operateVideo
  }
}
