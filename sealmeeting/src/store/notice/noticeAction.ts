import { ENoticeType, INotice } from '@/types/notice'
import { notices } from '.'

export class NoticeAction {
  constructor() {}
  public noticeGet(noticeType: ENoticeType) {
    return notices.value.find(notice => notice.type === noticeType)
  }
  public noticeSet(notice: INotice) {
    const index = notices.value.findIndex(item => item.group === notice.group)
    index >= 0 && notices.value.splice(index, 1)
    notices.value.push(notice)
  }
  public noticeDelete(noticeKey: string) {
    const index = notices.value.findIndex(item => item.key === noticeKey)
    index >= 0 && notices.value.splice(index, 1)
  }
  public clear() {
    notices.value.splice(0)
  }
}
