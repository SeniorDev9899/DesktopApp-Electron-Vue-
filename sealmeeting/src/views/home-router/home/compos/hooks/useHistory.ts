import { Ref } from 'vue'
import { meetingRoomService } from '@/core/services'
import moment from 'moment'
import localeStore from '@/store/localeStore'
import routerUtil from '@/utils/routerUtil'
import { showCommonNotice } from '@/utils/noticeUtil'

export const format = (
  dateTime: number,
  format: string = 'YYYY/MM/DD HH:mm'
) => {
  return moment(dateTime).format(format)
}

const getDateInfo = (time: number, locale: any) => {
  const startDate = new Date(time)
  const todayDate = new Date()
  const yesterDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let dateAlias = ''
  switch (startDate.getDate()) {
    case todayDate.getDate():
      dateAlias = locale.today
      break
    case yesterDate.getDate():
      dateAlias = locale.yesterDay
      break
  }
  return {
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1,
    date: startDate.getDate(),
    dateAlias: dateAlias
  }
}

const formatList = (list: any[]): any[] => {
  let result: any[] = []
  const locale = localeStore('home.base')
  list.sort(function(item1: any, item2: any) {
    return item2.startDt - item1.startDt
  })
  const obj = list.reduce((prev, current) => {
    current.startDateInfo = getDateInfo(current.startDt, locale)
    current.startDateInfo.time = format(current.startDt, 'HH:mm')
    current.endDateTime = format(current.endDt, 'HH:mm')
    let dKy = format(current.startDt, 'YYYY/MM/DD')
    if (Array.isArray(prev[dKy])) {
      prev[dKy].push(current)
    } else {
      prev[dKy] = [current]
    }
    return prev
  }, {})
  for (const key in obj) {
    result.push(obj[key])
  }
  return result
}

// data
export const useHistoryList = async (historyList: Ref<any[]>) => {
  let res = await meetingRoomService.historyMeetingListService()
  if (Array.isArray(res)) {
    let finalList = formatList(res)
    historyList.value = finalList
  }
}

// events
export const useEvents = (historyList: Ref<any[]>) => {
  // 查看点击
  const handleItemViewClick = (id: string | number) => {
    routerUtil.toMeetingDetial(id)
  }

  const handleItemDeleteClick = async (id: string | number) => {
    const action = await showCommonNotice(`确认删除该会议？`)
    if (action !== 'confirm') return
    let res = await meetingRoomService.meetingDeleteOneService(id as string)
    if (res === true) {
      useHistoryList(historyList)
    }
  }

  return {
    handleItemViewClick,
    handleItemDeleteClick
  }
}
