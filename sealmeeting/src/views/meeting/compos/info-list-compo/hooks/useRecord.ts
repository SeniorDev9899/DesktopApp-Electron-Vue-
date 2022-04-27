import { meetingRoomService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { watch } from 'vue'
import { ElMessage } from 'element-plus'
import { meetingInfo, meInfo } from '@/store/meeting'
import { timeUtil } from '@/utils/timeUtil'

export default () => {
  let _timer: any = undefined
  const _totalTime: number = 1000 * 60 * 5
  const ctrlMeetingRecord = async (isRecord: boolean) => {
    const code = await meetingRoomService.ctrlMeetingRecord(isRecord)
    if (code == EnumErrorCode.RecordNoVideo) {
      ElMessage.info('没有用户打开音/视频，录制失败')
    }
  }

  watch(
    () => meInfo.isHost,
    (val, preVal) => {
      if (!val) {
        // 当自己不是主持的时候，丢掉计时
        !!_timer && clearTimeout(_timer)
        _timer = undefined
      }
    }
  )

  watch(
    () => meetingInfo.recordStatus,
    (val, preVal) => {
      !!_timer && clearTimeout(_timer)
      _timer = undefined
      if (val === 1) {
        const recordStartTime =
          meetingInfo.recordStartDt > 0
            ? meetingInfo.recordStartDt
            : timeUtil.getNowInt()
        const durReocrd = timeUtil.getNowInt() - recordStartTime
        const lastRecord = _totalTime - durReocrd
        console.log('开始倒数计时停止录制，倒数：', lastRecord)
        if (lastRecord > 0) {
          // 开始计时
          _timer = setTimeout(() => {
            // 倒计时结束，停止录制
            console.log('计时到，停止录制')
            meetingRoomService.ctrlMeetingRecord(false)
            _timer = undefined
          }, lastRecord)
        } else {
          console.log('计时异常，直接停止录制')
          meetingRoomService.ctrlMeetingRecord(false)
        }
      }
    }
  )

  return {
    ctrlMeetingRecord
  }
}
