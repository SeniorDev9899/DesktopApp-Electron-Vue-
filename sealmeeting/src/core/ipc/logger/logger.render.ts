import { detectElectron } from '@/utils/systemUtil'

class Logger {
  private logType: string
  private ipcRender: any | undefined
  constructor(logType: string) {
    this.logType = logType
    if (detectElectron()) {
      try {
        this.ipcRender = require('electron').ipcRender
      } catch (error) {
        console.log('获取ipcRender 错误，可能运行在 rce里面')
      }
    }
  }

  public debug(message: any, ...args: any[]): void {
    this.log('debug', message, ...args)
  }

  public info(message: any, ...args: any[]): void {
    this.log('info', message, ...args)
  }

  public error(message: any, ...args: any[]): void {
    this.log('error', message, ...args)
  }

  private log(logLevel: string, message: string, ...args: any[]) {
    // let logable = (process.env.VUE_APP_LOGGER_ON as unknown) as string
    let logable = '1'
    if (logable === '1') {
      // 日志开关
      if (detectElectron()) {
        // 当前为 electron 环境
        !!this.ipcRender &&
          this.ipcRender.send('log', this.logType, logLevel, message, ...args)
      } else {
        //当非electron环境
        console.log(logLevel, '---', message, '---', ...args)
      }
    }
  }
}

let meetingLogger = new Logger('meeting')
export { meetingLogger }
