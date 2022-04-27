// 日志，仅在Node环境有效，即仅能在主进程使用，包括所有枚举类型
import { Configuration } from 'log4js'
import log4js from 'log4js'
import { getLogPath } from '@/utils/fileUtil'

export enum EnumLogType {
  System = 'system',
  Meeting = 'meeting',
  Default = 'default'
}

export enum EnumLogLevel {
  Info = 'info',
  Debug = 'debug',
  Error = 'error'
}
const config: Configuration = {
  appenders: {
    console: { type: 'stdout' },
    meeting: {
      type: 'dateFile',
      filename: getLogPath('meeting'),
      pattern: '.yyyy-MM-dd',
      encoding: 'utf-8',
      keepFileExt: true,
      alwaysIncludePattern: true
    },
    system: {
      type: 'dateFile',
      filename: getLogPath('system'),
      pattern: '.yyyy-MM-dd',
      encoding: 'utf-8',
      keepFileExt: true,
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'DEBUG'
    },
    meeting: {
      appenders: ['console', 'meeting'],
      level: 'DEBUG'
    },
    system: {
      appenders: ['console', 'system'],
      level: 'DEBUG'
    }
  }
}
export class APPLog {
  private jslog: log4js.Log4js | undefined

  constructor() {
    this.jslog = log4js.configure(config)
  }

  public log(
    logType: EnumLogType,
    loggerLevel: EnumLogLevel,
    message: any,
    ...args: any[]
  ) {
    switch (loggerLevel) {
      case EnumLogLevel.Debug:
        this.jslog!.getLogger(logType).debug(message, ...args)
        break
      case EnumLogLevel.Info:
        this.jslog!.getLogger(logType).info(message, ...args)
        break
      case EnumLogLevel.Error:
        this.jslog!.getLogger(logType).error(message, ...args)
        break
      default:
        break
    }
  }
}
