import { loginService } from '@/core/services'
import { onUnmounted, reactive } from 'vue'
import validators from '@/utils/validators'
import { EnumErrorCode } from '@/types/Enums'
export default (loginForm: any) => {
  const smsData: any = reactive({
    timeBackCount: 60,
    smsSendable: true
  })

  let _backCountTimer: any | undefined

  // 倒计时
  const sendSmsCode = async (mobile: string): Promise<void> => {
    const ok = await validators.validateField(loginForm, 'mobile')
    if (!ok) {
      return
    }
    const code: EnumErrorCode = await loginService.getVerifyCode(mobile)
    if (code === EnumErrorCode.OK) {
      startTimer()
    }
  }

  const startTimer = () => {
    smsData.timeBackCount = 60
    smsData.smsSendable = false
    _backCountTimer = setInterval(() => {
      if (smsData.timeBackCount === 0) {
        clearTimer()
        smsData.smsSendable = true
      } else {
        smsData.timeBackCount--
      }
    }, 1000)
  }

  const clearTimer = () => {
    !!_backCountTimer && clearInterval(_backCountTimer)
    _backCountTimer = undefined
  }

  onUnmounted(() => {
    clearTimer()
  })

  return {
    sendSmsCode,
    smsData
  }
}
