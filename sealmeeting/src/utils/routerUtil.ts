import router from '@/views/router'

export default {
  toPrePage: () => {
    router.forward()
  },
  toAgreement: () => {
    router.push('/agreement')
  },
  toMeeting: (query: any) => {
    router.push({ path: '/meeting', query })
  },
  toHome: () => {
    router.push('/home')
  },
  toHomeJoin: () => {
    router.push('/home/join')
  },
  toHomeSchedule: () => {
    router.push('/home/schedule')
  },
  toProfileSetting: () => {
    router.push('/profile')
  },
  toLogin: (query?: any) => {
    router.push({ path: '/', query })
  },
  toMeetingDetial: (id: string | number) => {
    router.push(`/home/detail/${id}`)
  }
}
