import { reactive, watch, ref, Ref, onMounted } from 'vue'
import { UnwrapNestedRefs } from '@vue/reactivity'
import routerUtil from '@/utils/routerUtil'
import localeStore from '@/store/localeStore'
import { loginAuth } from '@/store/login'
import { meetingRoomService } from '@/core/services'
import { createMeetingInfo, IDetialType } from '@/types/meeting'
import validators from '@/utils/validators'

export const useCommon = () => {
  const upPage = () => routerUtil.toHome()
  const loading = ref(false)
  const durationTimes = ref([0.5, 1, 1.5, 2, 2.5, 3])
  const pickerOptions = reactive((time: Date) => {
    return (
      time.getTime() > Date.now() + 8.64e7 * 30 ||
      time.getTime() < Date.now() - 8.64e7
    )
  })

  return {
    upPage,
    loading,
    durationTimes,
    pickerOptions
  }
}

export const useForm = () => {
  const meetingInfo = reactive(createMeetingInfo())
  const formRef = ref(null)
  const locale = localeStore('home.schedule')
  const data = reactive({
    subject: `${loginAuth.name}的会议`,
    startDt: new Date(),
    duration: 1,
    meetingIdMode: '1',
    passwordMode: false,
    password: loginAuth.joinMeetingPassword,
    personalMeetingNumber: loginAuth.personalMeetingNumber,
    showShareDialog: false,
    showMsg: false
  })
  const validatorHandler = {
    subject: (rule: any, value: string, callback: (val?: any) => void) => {
      const reg = /^(?!.*\s)[\u4E00-\u9FA5 A-Za-z0-9]{1,20}$/
      if (!reg.test(value)) {
        callback(locale.subject)
        return
      }
      callback()
    },
    passwordMode: (rule: any, value: string, callback: (val?: any) => void) => {
      const reg = /^[0-9]{4,6}$/
      if (data.passwordMode) {
        if (!value) {
          callback(locale.noEmptyPassword)
        } else if (!reg.test(value)) {
          callback(locale.pstitle)
          return
        } else {
          callback()
        }
      } else {
        callback()
      }
    }
  }
  // form校验
  const rules = reactive({
    subject: [
      { required: true, message: locale.subjectTip, trigger: 'blur' },
      {
        message: locale.subjectError,
        trigger: 'blur',
        validator: validatorHandler.subject
      }
    ],
    password: [
      {
        message: locale.passwordMode,
        trigger: 'blur',
        validator: validatorHandler.passwordMode
      }
    ]
  })

  watch(
    () => data.passwordMode,
    () => {
      if (!data.passwordMode) {
        data.password = ''
        ;(formRef.value as any).clearValidate('password')
      }
    }
  )

  // 预约会议默认是下一个整点
  onMounted(() => {
    const nowDate = new Date()
    data.startDt = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      nowDate.getHours() + 1
    )
  })

  const submit = async () => {
    const isValid = await validators.validateForm(formRef)
    if (!isValid) {
      return
    }
    const params = {
      subject: data.subject,
      startDt: data.startDt.getTime(),
      endDt: data.startDt.getTime() + data.duration * 3600 * 1000,
      meetingNumber:
        data.meetingIdMode === '2' ? data.personalMeetingNumber : '',
      password: data.password
    }

    let res = await meetingRoomService.meetingScheduleService(params)
    !!res && Object.assign(meetingInfo, res)
  }

  return {
    data,
    rules,
    formRef,
    submit,
    meetingInfo
  }
}

export const useDialog = () => {
  let visible = ref(false)
  const close = () => {
    routerUtil.toHome()
  }

  const dialogInfo = reactive({
    detialInfo: {}
  })
  return {
    visible,
    close,
    dialogInfo
  }
}
