import { meetingRoomService } from '@/core/services'
import { createMeetingInfo } from '@/types/meeting'
import { timeUtil } from '@/utils/timeUtil'
import { onMounted, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
export default () => {
  const meetingInfo = reactive(createMeetingInfo())
  const route = useRoute()
  const meetingId = route.query.meetingId as string
  const lib = getLib()

  const startTime = computed(() => {
    return timeUtil.formatTime(meetingInfo.startDt, true)
  })

  const meetingUrl = computed(() => {
    const u = new URL(window.location.href)
    return `${u.origin}${u.pathname}#/meeting?meetingId=${meetingId}&from=share`
  })

  const joinMeeting = () => {
    var system = {
      win: false,
      mac: false
    }
    var p = navigator.platform
    system.win = p.indexOf('Win') === 0
    system.mac = p.indexOf('Mac') === 0
    if (system.win || system.mac) {
      window.open(meetingUrl.value)
    } else {
      lib.open({
        param: { meetingId: meetingId },
        path: 'joinmeeting'
      })
    }
  }

  onMounted(async () => {
    const data = await meetingRoomService.getMeetingBasicInfo(meetingId)
    !!data && Object.assign(meetingInfo, data)

    // 因为业务需要，我们需要添加 outChain 属性
    // 但是这样生成出来的 scheme 稍显复杂，所以下面的 log 其实是移除了 outChain 属性的
    // outChain 很少有同学会使用到，所以更方便大家理解
    // ykshortvideo://profile
    console.log(lib.generateScheme({ path: 'profile' }))
    // intent://profile#Intent;package=com.youku.shortvideo;scheme=ykshortvideo;S.browser_fallback_url=https%3A%2F%2Fdianliu.youku.com%2Fservice%2Fdownload;end;
    console.log(lib.generateIntent({ path: 'profile' }))
    // https://flash-link.youku.com?action=profile
    console.log(lib.generateUniversalLink({ path: 'profile' }))
  })

  return {
    meetingInfo,
    startTime,
    meetingUrl,
    isWeChat: is_weixin(),
    joinMeeting
  }
}

function is_weixin() {
  var ua = navigator.userAgent.toLowerCase()
  return ua.indexOf('micromessenger') !== -1
}

function getLib() {
  const option = {
    scheme: {
      protocol: 'sealmeeting'
    },
    intent: {
      package: 'cn.rongcloud.sealmeeting',
      scheme: 'sealmeeting'
    },
    appstore: '',
    yingyongbao: '',
    fallback: 'https://www.rongcloud.cn/downloads/demo',
    timeout: 2000
  }
  return new window.CallApp(option)
}
