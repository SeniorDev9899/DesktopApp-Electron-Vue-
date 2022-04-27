export interface IDialogResult {
  action: 'cancel' | 'confirm'
  data: any
}

export interface IDialogAttrs {
  title?: string
  width?: String
  top: string
  modal: boolean
}

export interface IDialogCompoProps {
  [key: string]: any
}

export interface IInputDialogProps extends IDialogCompoProps {
  tip?: string
  placeholder?: string
  value?: string
  inputRules?: Object
}
