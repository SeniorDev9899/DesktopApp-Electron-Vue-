import { join } from 'path'
import { EnumPlatform } from '../types/Enums'
import { detectPlatform } from './systemUtil'
import path from 'path'
import fs from 'fs'
import { ConfigIniParser } from 'config-ini-parser'

// 所有文件存储的根目录，即userData目录
export const getBasePath = () => {
  const electron = require('electron')
  const app = process.type === 'browser' ? electron.app : electron.remote.app
  return app.getPath('userData')
}

export const getLogPath = (logName: string) => {
  const basePath = getBasePath()
  return join(basePath, 'logs', logName + '.log')
}
//最初基础配置
export function getConfFromFile(path: string, sectionName: string = 'base') {
  if (detectPlatform() === EnumPlatform.Web) {
    return {}
  }
  try {
    const content = fs.readFileSync(path, 'utf-8')
    const parser = new ConfigIniParser()
    parser.parse(content)
    const options = parser.options(sectionName)
    const conf: any = {}
    options.forEach((optionName: string) => {
      conf[optionName] = parser.get(sectionName, optionName)
    })
    return conf
  } catch (error) {
    console.log('getJenkinsConf 失败：', error)
    return {}
  }
}
