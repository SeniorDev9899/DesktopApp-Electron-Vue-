import moment from 'moment'

export const durationFormat = (startTime: number, endTime: number) => {
  const convert = (num: string) => (/^\d$/.test(num) ? '0' + num : num)
  const diffM = moment.duration(
    (moment(startTime) as any) - (moment(endTime) as any),
    'ms'
  )
  const hours = convert(diffM.get('hours').toString())
  const mins = convert(diffM.get('minutes').toString())
  const secs = convert(diffM.get('seconds').toString())
  return `${hours}:${mins}:${secs}`
}

export const timeUtil = {
  sleep(time: number) {
    return new Promise(resolve => setTimeout(resolve, time))
  },

  calIsEndofMonth(date: number) {
    // 判断是不是月末
    const secondDay = date + 24 * 60 * 60 * 1000
    const oldM = new Date(date).getMonth()
    const newM = new Date(secondDay).getMonth()
    return oldM !== newM
  },
  computeChatTime(chatTime: string) {
    const thatTime = new Date(parseInt(chatTime))
    const thatYear = thatTime.getFullYear()
    let thatMonth = thatTime.getMonth()
    thatMonth = thatMonth + 1
    const thatDate = thatTime.getDate()
    const thatHour = thatTime.getHours()
    const thatMinu = thatTime.getMinutes()
    // const now = new Date()
    const nowYear = thatTime.getFullYear()
    let nowMonth = thatTime.getMonth()
    nowMonth = nowMonth + 1
    const nowDate = thatTime.getDate()
    if (thatYear !== nowYear) {
      return (
        thatYear +
        '年' +
        thatMonth +
        '月' +
        thatDate +
        '日' +
        thatHour +
        ':' +
        (thatMinu > 10 ? thatMinu : '0' + String(thatMinu))
      )
    } else {
      if (thatMonth !== nowMonth || thatDate !== nowDate) {
        return (
          thatMonth +
          '月' +
          thatDate +
          '日' +
          thatHour +
          ':' +
          (thatMinu > 10 ? thatMinu : '0' + String(thatMinu))
        )
      } else {
        // 此处，直接返回即可
        return (
          thatHour + ':' + (thatMinu >= 10 ? thatMinu : '0' + String(thatMinu))
        )
        // if (now.getTime() - chatTime > 120000) {
        //   return thatHour + ':' + (thatMinu > 10 ? thatMinu : '0' + String(thatMinu))
        // }
      }
    }
  },
  formatTime(val: number, showData: boolean = true) {
    var now = new Date(val)
    var year: number | string = now.getFullYear() // 得到年份
    var month: number | string = now.getMonth() // 得到月份
    var date: number | string = now.getDate() // 得到日期
    // var day = now.getDay();// 得到周几
    var hour: number | string = now.getHours() // 得到小时
    var minu: number | string = now.getMinutes() // 得到分钟
    // var sec: number | string = now.getSeconds();// 得到秒
    month = month + 1
    if (month < 10) month = '0' + month
    if (date < 10) date = '0' + date
    if (hour < 10) hour = '0' + hour
    if (minu < 10) minu = '0' + minu
    // if (sec < 10) sec = '0' + sec;
    if (showData) {
      return year + '.' + month + '.' + date + ' ' + hour + ':' + minu
    } else {
      return hour + ':' + minu
    }
  },
  getNowStr(paramDate: string, showSecond = true) {
    var now = new Date(parseInt(paramDate))
    var year: number | string = now.getFullYear() // 得到年份
    var month: number | string = now.getMonth() // 得到月份
    var date: number | string = now.getDate() // 得到日期
    // var day = now.getDay();// 得到周几
    var hour: number | string = now.getHours() // 得到小时
    var minu: number | string = now.getMinutes() // 得到分钟
    var sec: number | string = now.getSeconds() // 得到秒
    month = month + 1
    if (month < 10) month = '0' + month
    if (date < 10) date = '0' + date
    if (hour < 10) hour = '0' + hour
    if (minu < 10) minu = '0' + minu
    if (sec < 10) sec = '0' + sec
    if (!showSecond) {
      return year + '年' + month + '月' + date + '日'
    } else {
      return (
        year + '-' + month + '-' + date + ' ' + hour + ':' + minu + ':' + sec
      )
    }
  },
  getNow(showSecond = true) {
    const now = new Date()
    var year: number | string = now.getFullYear() // 得到年份
    var month: number | string = now.getMonth() // 得到月份
    var date: number | string = now.getDate() // 得到日期
    // var day = now.getDay();// 得到周几
    var hour: number | string = now.getHours() // 得到小时
    var minu: number | string = now.getMinutes() // 得到分钟
    var sec: number | string = now.getSeconds() // 得到秒
    month = month + 1
    if (month < 10) month = '0' + month
    if (date < 10) date = '0' + date
    if (hour < 10) hour = '0' + hour
    if (minu < 10) minu = '0' + minu
    if (sec < 10) sec = '0' + sec
    if (!showSecond) {
      return year + '年' + month + '月' + date + '日'
    } else {
      return (
        year + '-' + month + '-' + date + ' ' + hour + ':' + minu + ':' + sec
      )
    }
  },
  getNowInt() {
    return new Date().getTime()
  },
  isLessThan(time: number, seconds = 2) {
    // 当前时间是否小于
    if (time === 0) return true
    return this.getNowInt() - time <= seconds * 1000
  },
  calTime(start: number) {
    const end = this.getNowInt()
    let lastSeconds: number | string = (end - start) / 1000
    let hours: number | string = Math.floor(lastSeconds / 3600)
    if (hours < 10) hours = '0' + hours
    lastSeconds = lastSeconds % 3600
    let minutes: number | string = Math.floor(lastSeconds / 60)
    if (minutes < 10) minutes = '0' + minutes
    lastSeconds = Math.floor(lastSeconds % 60)
    if (lastSeconds < 10) lastSeconds = '0' + lastSeconds
    return `${hours}:${minutes}:${lastSeconds}`
  },
  calSpan(start: string, end: string) {
    // 计算时间间隔：09:10-10:09
    return this.calDisplay(start) + '-' + this.calDisplay(end)
  },
  calDuration(start: number, end: number) {
    // 计算时间持续  ：小于1分钟，3分40秒
    let lastSeconds = (end - start) / 1000
    const hours = Math.floor(lastSeconds / 3600)
    lastSeconds = lastSeconds % 3600
    let minutes = Math.floor(lastSeconds / 60)
    lastSeconds = lastSeconds % 60
    if (hours > 0) {
      // 3小时8分
      return `${hours}小时${minutes}分钟`
    }
    if (minutes > 0) {
      if (lastSeconds > 30) minutes += 1
      return `${minutes}分钟`
    }
    return '小于1分钟'
  },
  calDisplay(longTime: string) {
    // 计算时间显示
    if (longTime === '0') return ''
    const dateTime = new Date(parseInt(longTime))
    let hours: number | string = dateTime.getHours()
    let minutes: number | string = dateTime.getMinutes()
    if (hours < 10) hours = '0' + hours
    if (minutes < 10) minutes = '0' + minutes
    return hours + ':' + minutes
  },
  calWeekMany(date: string) {
    let t = null
    if (date) {
      t = new Date(parseInt(date)).getDay()
    }
    console.log('计算出来的day', t)
    switch (t) {
      case 1:
        return '周一'
      case 2:
        return '周二'
      case 3:
        return '周三'
      case 4:
        return '周四'
      case 5:
        return '周五'
      case 6:
        return '周六'
      case 0:
        return '周日'
      default:
        return ''
    }
  }
}
