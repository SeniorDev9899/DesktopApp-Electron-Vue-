export const appConfig = {
  appKey: 'lmxuhwag153md',
  appNav: '', // IM的导航地址
  commonServer: 'https://120.92.13.89/sealmeeting/api',
  controlServer: '',
  netEnv: '',
  mediaType: 0, // 1：七牛  2：RCX文件服务
  mediaUpServer: '',
  mediaDownServer: '',
  recordDownServer: '',
  whiteboardServer: '',
  meetingShareUrl: '',
  switchWhiteboard: 'on', // 44166 - 【rce-在线会议】会议没有白板功能选项
  launchFrom: 'meeting', // rce   meeting
  productName: '',
  version: ''
}

// 加载 jenkins配置
const jenkinsConfig = require('./jenkinsConfig')
console.log('-----', jenkinsConfig)
Object.assign(appConfig, jenkinsConfig)
console.log('appConfig: jenkins', jenkinsConfig)

// 加载 内存配置
const rceConfig = getRCEConf()
Object.assign(appConfig, rceConfig)
console.log('appConfig: rce', rceConfig)

!!window.commonServer && (appConfig.commonServer = window.commonServer)
!!window.netEnv && (appConfig.netEnv = window.netEnv)

// 内存配置
function getRCEConf() {
  const rceConf = window.RongDesktop?.configInfo?.webInfo || {}
  const conf: any = {}
  !!rceConf.MEETING_SERVER && (conf.commonServer = rceConf.MEETING_SERVER)
  !!rceConf.NETENV && (conf.netEnv = rceConf.NETENV)
  !!rceConf.LAUNCH_FROM && (conf.launchFrom = rceConf.LAUNCH_FROM)
  return conf
}

export function updateNavConf(navConfig: any) {
  if (appConfig.launchFrom === 'rce') {
    navConfig = navConfig?.features || {}
    // im
    !!navConfig.im?.app_key && (appConfig.appKey = navConfig.im.app_key)
    const appNav = getStrFromArray(navConfig.im?.navi_urls)
    !!appNav && (appConfig.appNav = appNav)
    // media
    !!navConfig.media?.type && (appConfig.mediaType = navConfig.media.type)
    const mediaDownServer = getStrFromArray(navConfig.media?.download_urls)
    !!mediaDownServer && (appConfig.mediaDownServer = mediaDownServer)
    const uploadUrl = getStrFromArray(navConfig.media?.upload_urls)
    !!uploadUrl && (appConfig.mediaUpServer = uploadUrl)
    // record
    const recordDownServer = getStrFromArray(navConfig.rtc?.record_file_urls)
    !!recordDownServer && (appConfig.recordDownServer = recordDownServer)
    // whiteboard
    const whiteboardServer = getStrFromArray(navConfig.whiteboard?.server_urls)
    !!whiteboardServer && (appConfig.whiteboardServer = whiteboardServer)
    // meeting
    appConfig.controlServer = appConfig.commonServer

    // whiteboard
    const shareUrl = getStrFromArray(navConfig.share?.url)
    !!shareUrl && (appConfig.meetingShareUrl = shareUrl)
  } else {
    navConfig = navConfig || {}
    // im
    !!navConfig.im?.appKey && (appConfig.appKey = navConfig.im.appKey)
    !!navConfig.im?.naviUrl && (appConfig.appNav = navConfig.im.naviUrl)
    // media
    !!navConfig.media?.type && (appConfig.mediaType = navConfig.media.type)
    !!navConfig.media?.downloadUrl &&
      (appConfig.mediaDownServer = navConfig.media.downloadUrl)
    !!navConfig.media?.uploadUrl &&
      (appConfig.mediaUpServer = navConfig.media.uploadUrl)
    // record
    !!navConfig.record?.downloadUrl &&
      (appConfig.recordDownServer = navConfig.record.downloadUrl)
    // whiteboard
    !!navConfig.whiteboard?.url &&
      (appConfig.whiteboardServer = navConfig.whiteboard.url)
    // meeting
    !!navConfig.meetinglib_server?.url &&
      (appConfig.controlServer = navConfig.meetinglib_server.url)

    !!navConfig.meetingShareUrl &&
      (appConfig.meetingShareUrl = navConfig.meetingShareUrl)
  }

  // whiteboard 谁再动导航格式打死打丫的！！！！
  const shareUrl = getStrFromArray(navConfig.share?.url)
  !!shareUrl && (appConfig.meetingShareUrl = shareUrl)

  console.log('appConfig', appConfig)
}

function getStrFromArray(arrVal: any) {
  if (!arrVal) return undefined
  if (Array.isArray(arrVal)) {
    return arrVal.length > 0 ? arrVal[0] : undefined
  }
  if (typeof arrVal === 'string') {
    return arrVal
  }
  return undefined
}
