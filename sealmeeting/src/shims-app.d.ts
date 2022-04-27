import { IpcRenderer } from 'electron'
declare global {
  interface Window {
    ipcRenderer: IpcRenderer
    RongIMLib: any
    RongDesktop: any
    commonServer: string
    netEnv: string
  }
}
