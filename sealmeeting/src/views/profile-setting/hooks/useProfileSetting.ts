import router from '@/utils/routerUtil'
import { loginService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import parseErrorCode from '@/utils/errorUtil'
import validators, { regs } from '@/utils/validators'
import { loginAuth } from '@/store/login'
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'

export default () => {
  const profileData = reactive({
    userId: loginAuth.name,
    userName: loginAuth.name,
    portrait: loginAuth.portrait
  })
  const profileRules = reactive({
    userName: [
      { trigger: 'blur', message: '请输入姓名或昵称', required: true },
      {
        trigger: 'blur',
        message: '姓名/昵称最多支持20个数字、字母、汉字、空格组合',
        pattern: regs.userName
      }
    ]
  })
  const profileForm = ref(null)
  const isLoading = ref(false)
  const submit = async () => {
    isLoading.value = true
    const isValid = await validators.validateForm(profileForm)
    if (!isValid) {
      isLoading.value = false
      return
    }
    const rst = await loginService.modifyUser({
      name: profileData.userName,
      portrait: profileData.portrait
    })
    isLoading.value = false
    if (rst !== EnumErrorCode.OK) {
      const msg = parseErrorCode(rst)
      ElMessage.error(msg)
    } else {
      router.toHome()
    }
  }
  const changeAvatar = async (user: any) => {
    profileData.portrait = user.portrait
  }
  return {
    profileData,
    profileRules,
    profileForm,
    isLoading,
    submit,
    changeAvatar
  }
}
