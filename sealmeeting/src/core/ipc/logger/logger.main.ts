import { ipcMain, IpcMainEvent } from 'electron'
import { APPLog, EnumLogLevel, EnumLogType } from '@/modules/APPLog'

class Logger {
  private appLog: APPLog
  constructor() {
    this.appLog = new APPLog()
    this.startListen()
  }
  /**
   * 监听渲染进程日志记录请求
   */
  private startListen() {
    ipcMain.on(
      'log',
      (
        event: IpcMainEvent,
        loggerType: EnumLogType,
        loggerLevel: EnumLogLevel,
        message: any,
        ...args: any[]
      ) => {
        switch (loggerType) {
          case EnumLogType.Meeting:
            this.appLog.log(loggerType, loggerLevel, message, ...args)
            break
          default:
            this.appLog.log(loggerType, loggerLevel, message, ...args)
            break
        }
      }
    )
  }
  //以下为主进程直接使用
  public info(message: any, ...args: any[]) {
    this.appLog.log(EnumLogType.System, EnumLogLevel.Info, message, ...args)
  }
  public debug(message: any, ...args: any[]) {
    this.appLog.log(EnumLogType.System, EnumLogLevel.Debug, message, ...args)
  }
  public error(message: any, ...args: any[]) {
    this.appLog.log(EnumLogType.System, EnumLogLevel.Error, message, ...args)
  }
}
const logger = new Logger()
export { logger }
