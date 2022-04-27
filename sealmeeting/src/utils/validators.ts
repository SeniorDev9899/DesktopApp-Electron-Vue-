import { Ref } from 'vue'
import { i18n } from '@/store/localeStore'

export const regs = {
  mobile: /^(13[0-9]|14[5-9]|15[0-3,5-9]|16[2,5,6,7]|17[0-8]|18[0-9]|19[0-3,5-9])[0-9]{8}$/,
  meetingNumber: /^[0-9]{1,12}$/,
  smsCode: /^\d{1,10}$/,
  meetingPwd: /^\d{1,4}$/,
  meetingJoinPwd: /^[0-9]{4,6}$/,
  userName: /^[\u4E00-\u9FA5 A-Za-z0-9]{1,20}$/
}

export default {
  validateForm: (ref: Ref<null>): Promise<boolean> => {
    return new Promise<boolean>(reslove => {
      ;(ref as any).value.validate(
        (ok: boolean) => {
          reslove(ok)
        },
        (err: any) => {
          console.log('valid form error:', err)
          reslove(false)
        }
      )
    })
  },
  validateField: (ref: Ref<null>, props: string): Promise<boolean> => {
    return new Promise<boolean>(reslove => {
      ;(ref as any).value.validateField(
        props,
        (error: string) => {
          reslove(!error)
        },
        (err: any) => {
          console.log('valid form error:', err)
          reslove(false)
        }
      )
    })
  },
  validateRegTest: (rule: any, value: string, callback: Function) => {
    const reg = /^(13[0-9]|14[5-9]|15[0-3,5-9]|16[2,5,6,7]|17[0-8]|18[0-9]|19[0-3,5-9])[0-9]{8}$/
    if (!reg.test(value)) {
      callback(new Error())
      return
    }
    callback()
  }
}

// 必填项验证
export const validateRequired = (
  message: string,
  trigger = 'blur',
  type = 'string'
) => ({
  required: true,
  message,
  trigger,
  type
})

export const validatePassword = () => ({
  validator(_: any, value: string, callback: Function) {
    if (
      // 密码不为空
      !value ||
      // 6 到 16 位
      value.length > 16 ||
      value.length < 6 ||
      // 同时包含数字、字母
      !(/\d/.test(value) && /[a-zA-Z]/.test(value))
      // 密码不可包含如下非法字符
      // || value.match(/[^\w~`@#$%^&*-=+|?/()<>[\]{}",.;'!]/)
    ) {
      callback(new Error('密码应为 6 - 16 位，必须同时包含数字、字母'))
      return
    }
    callback()
  },
  required: true,
  trigger: 'blur'
})

export const validateNoSpaces = (
  message: string = '内容不可包含空格',
  trigger = 'blur'
) => ({
  validator(rule: any, value: string, callback: Function) {
    if (/\s/.test(value)) {
      callback(message)
      return
    }
    callback()
  },
  trigger
})

// 字符串长度验证
export const validateLength = (min: number, max: number, trigger = 'blur') => ({
  min,
  max,
  message: `长度在 ${min} 到 ${max} 个字符`,
  trigger
})

// 有效的用户昵称
export const validateName = (
  message = i18n.global.t('common.name'),
  trigger = 'blur'
) => {
  const reg = /^[\u4E00-\u9FA5 A-Za-z0-9]{1,40}$/
  return {
    validator(rule: any, value: string, callback: Function) {
      if (!reg.test(value)) {
        callback(message)
        return
      }
      callback()
    },
    trigger,
    validateRequired
  }
}

// 有效的会议号
export const validateMeetingId = (
  message = i18n.global.t('common.number'),
  trigger = 'blur'
) => {
  const reg = /^[0-9]{1,12}$/
  return {
    validator(rule: any, value: string, callback: Function) {
      if (!reg.test(value)) {
        callback(message)
        return
      }
      callback()
    },
    trigger,
    validateRequired
  }
}

// 有效的会议主题
export const validateMeetingSubject = (
  message = i18n.global.t('common.subject'),
  trigger = 'blur'
) => {
  const reg = /^(?!\\s)[\u4E00-\u9FA5 A-Za-z0-9]{1,20}$/
  return {
    validator(rule: any, value: string, callback: Function) {
      if (!reg.test(value)) {
        callback(message)
        return
      }
      callback()
    },
    trigger,
    validateRequired
  }
}

// 有效的会议密码
export const validateMeetingPassword = (
  isPassword = true,
  message = i18n.global.t('common.pstitle'),
  trigger = 'blur'
) => {
  const reg = /^[0-9]{4,6}$/
  return {
    validator(rule: any, value: string, callback: Function) {
      if (!isPassword || !value) {
        callback()
        return
      }

      if (!reg.test(value)) {
        callback(message)
        return
      }
      callback()
    },
    trigger
  }
}

/**
 * 验证表单
 * @param ref 待验证的表单 Ref 定义
 * @param callback
 */
export const validate = (
  ref: Ref<null>,
  callback: (valid: boolean) => void
) => {
  ;(ref as any).value.validate(callback)
}
