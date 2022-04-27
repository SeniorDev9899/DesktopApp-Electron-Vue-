import { watch, computed } from 'vue'
import { noticeAction } from '@/store/notice'
import { ElMessageBox } from 'element-plus'
import {
  Action,
  ElMessageBoxOptions,
  MessageBoxState
} from 'element-plus/lib/el-message-box/src/message-box.type'
import { ENoticeType, INotice } from '@/types/notice'
const useELMessageBox = (notice: INotice) => {
  let _callBack = notice.options?.callback
  let _beforeClose = notice.options?.beforeClose
  const innerCallback = (value: string, action: Action) => {
    _callBack && _callBack(value as Action, action)
  }
  const interBeforeClose = (
    action: Action,
    instance: MessageBoxState,
    done: () => void
  ) => {
    noticeAction.noticeDelete(notice.key)
    _beforeClose && _beforeClose(action, instance, done)
  }
  notice.options!.callback = innerCallback
  notice.options!.beforeClose = interBeforeClose
  ElMessageBox(notice.options as ElMessageBoxOptions)
}

export default () => {
  watch(
    () => noticeAction.noticeGet(ENoticeType.MsgBox),
    (notice, preNotice) => {
      if (preNotice || !notice) {
        ElMessageBox.close()
      }
      notice && useELMessageBox(notice)
    },
    { immediate: true }
  )
  return {}
}
