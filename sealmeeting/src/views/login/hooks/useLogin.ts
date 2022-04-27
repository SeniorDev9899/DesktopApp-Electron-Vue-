import { reactive, ref } from 'vue'
import { loginService } from '@/core/services'
import validators, { regs } from '@/utils/validators'
import localeStore from '@/store/localeStore'
import parseErrorCode from '@/utils/errorUtil'
import { EnumErrorCode } from '@/types/Enums'
import { ElMessage } from 'element-plus'
import router from '@/utils/routerUtil'
import { useRoute } from 'vue-router'

export default () => {
  const query = useRoute().query
  const locale = localeStore('login')

  let loginForm = ref(null)

  let isLogining = ref(false)

  const loginData = reactive({
    mobile: '',
    smsCode: ''
  })

  const loginRules = reactive({
    mobile: [
      { trigger: 'blur', message: locale.mobileRequired, required: true },
      { trigger: 'blur', message: locale.mobileInvalid, pattern: regs.mobile }
    ],
    smsCode: [
      { trigger: 'blur', message: locale.smsCodeRequired, required: true },
      { trigger: 'blur', message: locale.smsCodeInvalid, pattern: regs.smsCode }
    ]
  })

  const login = async (): Promise<void> => {
    isLogining.value = true
    const isValid = await validators.validateForm(loginForm)
    if (!isValid) {
      isLogining.value = false
      return
    }
    const code: EnumErrorCode = await loginService.login(
      loginData.mobile,
      loginData.smsCode
    )
    isLogining.value = false
    if (code === EnumErrorCode.NewUser) {
      router.toProfileSetting()
    } else if (code !== EnumErrorCode.OK) {
      const msg = parseErrorCode(code)
      ElMessage.error(msg)
    } else {
      if (Object.keys(query).length > 0) {
        router.toMeeting(query)
      } else {
        router.toHome()
      }
    }
  }

  return {
    loginData,
    loginRules,
    login,
    isLogining,
    loginForm
  }
}
