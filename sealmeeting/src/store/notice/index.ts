import { INotice } from '@/types/notice'
import { ref, Ref } from 'vue'
import { NoticeAction } from './noticeAction'

export const notices: Ref<INotice[]> = ref([])
// export const noticeGet = (noticeType: ENoticeType) => {
//   return notices.value.find((notice) => notice.type === noticeType)
// }
export const noticeAction = new NoticeAction()
