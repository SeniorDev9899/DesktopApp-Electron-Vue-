import { computed } from 'vue'
import { loginAuth } from '@/store/login'
import { meetingInfo } from '@/store/meeting'
import { imState } from '@/modules/IMCore'
export const meId = computed(() => {
  return loginAuth.id
})

export const meName = computed(() => {
  return loginAuth.name
})

export const meetingId = computed(() => {
  return meetingInfo.id
})

export const meetingNum = computed(() => {
  return meetingInfo.number
})

export const isLogin = computed(() => {
  return !!loginAuth.id
})

export const isConnected = computed(() => {
  return imState.isConnected
})
