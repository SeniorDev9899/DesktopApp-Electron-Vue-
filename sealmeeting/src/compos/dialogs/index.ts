import RongDialog from '@/plugins/rong-dialog'
import { regs } from '@/utils/validators'
import {
  IDialogCompoProps,
  IDialogAttrs,
  IDialogResult,
  IInputDialogProps
} from '@/plugins/rong-dialog/types'

export const showTestDialog = async (): Promise<IDialogResult> => {
  const dialogAttrs: IDialogAttrs = {
    title: '我是测试的标题',
    top: '15vh',
    modal: true
  }
  const compoProps: IDialogCompoProps = {
    a: 3333
  }
  return await RongDialog.show('TestDialog', dialogAttrs, compoProps)
}

export const inputDialog = {
  inputPassword: async (): Promise<IDialogResult> => {
    const dialogAttrs: IDialogAttrs = {
      title: '提示',
      width: '350px',
      top: '30vh',
      modal: true
    }
    const props: IInputDialogProps = {
      tip: '请输入会议密码',
      placeholder: '请输入会议密码',
      value: '',
      maxlength: '6',
      inputRules: [
        { trigger: 'blur', message: '请输入正确密码', required: true },
        {
          message: '请输入有效的4-6位密码',
          pattern: regs.meetingJoinPwd
        }
      ]
    }
    return await RongDialog.show('InputDialog', dialogAttrs, props)
  },
  inputUserName: async (name: string): Promise<IDialogResult> => {
    const dialogAttrs: IDialogAttrs = {
      title: '提示',
      width: '350px',
      top: '30vh',
      modal: true
    }
    const props: IInputDialogProps = {
      tip: '修改会议中显示名称',
      placeholder: '修改会议中显示名称',
      value: name,
      maxlength: '20',
      inputRules: [
        { trigger: 'blur', message: '请输入正确显示名称', required: true },
        {
          message: '1-20个字符，可使用字母、数字',
          pattern: regs.userName
        }
      ]
    }
    return await RongDialog.show('InputDialog', dialogAttrs, props)
  }
}
