import {
  IMClient,
  RongIMClient,
  TextMessage,
  ConnectionStatus,
  ConversationType,
  MessageTag
} from '@rongcloud/imlib-v2'
import { EnumErrorCode } from '@/types/Enums'
import mitt, { Emitter, Handler } from './EventEmitt'
import { appConfig } from '@/appConfig'
import { reactive } from 'vue'
const msgEmitter: Emitter = mitt()
export const imState = reactive({
  isConnected: false
})
var imConnStatusListener = {
  onChanged: function(status: ConnectionStatus) {
    // status 标识当前连接状态
    imState.isConnected = status == ConnectionStatus.CONNECTED
    switch (status) {
      case ConnectionStatus.CONNECTED:
        console.log('链接成功')
        break
      case ConnectionStatus.CONNECTING:
        console.log('正在链接')
        break
      case ConnectionStatus.DISCONNECTED:
        console.log('断开连接')
        break
      case ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
        console.log('其他设备登录, 本端被踢')
        break
      case ConnectionStatus.DOMAIN_INCORRECT:
        console.log('域名不正确, 请至开发者后台查看安全域名配置')
        break
      case ConnectionStatus.NETWORK_UNAVAILABLE:
        console.log('网络不可用, 此时可调用 reconnect 进行重连')
        break
      default:
        console.log('链接状态为', status)
        break
    }
  }
}

var imMessageListener = {
  onReceived: function(message: any) {
    const objectName = message.objectName as string
    if (objectName === 'Meeting:Ping') {
      return
    }
    console.log(`msg:received:${objectName},`, message)
    if (objectName !== 'RC:TxtMsg') {
      let key = 'MT:Unknown'
      const msg = message.content.message
      if (objectName.startsWith('SealMT:')) {
        key = `${msg.objectName}-${msg.content.action}`
      } else if (objectName.startsWith('RCMT:')) {
        key = `${msg.objectName}-${msg.content.action}`
      } else {
        console.log('忽略未知消息：', objectName)
        return
      }
      msgEmitter.emit(key, msg.content)
      if (!msgEmitter.all.has(key)) {
        console.log('发现未知消息，', key, msg)
      }
    } else {
      msgEmitter.emit('RC:TxtMsg', message.content)
    }
  }
}

class IMCore {
  private options: any = {}

  constructor() {}
  public init() {
    if (!RongIMClient.getInstance()) {
      !!appConfig.appNav && (this.options['navi'] = appConfig.appNav)
      console.log('im init options,', this.options)
      RongIMClient.init(appConfig.appKey, undefined, this.options)
      RongIMClient.setConnectionStatusListener(imConnStatusListener)
      RongIMClient.setOnReceiveMessageListener(imMessageListener)
      // 注册心跳
      // 聊天室保活消息
      // 消息名称：MeetingPingMessage
      // ObjectName:Meeting:Ping
      // Content:{"meetingId":XXXX}
      // 消息类型：MessagePersistent_NONE
      RongIMClient.registerMessageType(
        'MeetingPingMessage',
        'Meeting:Ping',
        new MessageTag(false, false),
        []
      )
    }
  }

  public onMsg(type: string, handler: Handler) {
    msgEmitter.on(type, handler)
  }
  public offMsg(type: string, handler: Handler) {
    msgEmitter.off(type, handler)
  }
  public clear() {
    msgEmitter.all.clear()
  }
  public connect(imToken: string) {
    const status: ConnectionStatus = RongIMClient.getInstance()?.getCurrentConnectionStatus()
    if (status === ConnectionStatus.CONNECTED) {
      return EnumErrorCode.OK
    }
    return new Promise<EnumErrorCode>((resolve, reject) => {
      RongIMClient.connect(imToken, {
        onSuccess: (userId: string) => {
          imState.isConnected = true
          console.log('IM连接成功，userId:', userId)
          resolve(EnumErrorCode.OK)
        },
        onError: (code: number) => {
          imState.isConnected = false
          console.log('IM连接失败，错误码:', code)
          reject(code)
        },
        onTokenIncorrect: () => {
          imState.isConnected = false
          console.log('token失败')
          resolve(EnumErrorCode.IMTokenError)
        }
      })
    })
  }

  public disconnect() {
    RongIMClient.getInstance()?.disconnect()
  }

  public joinChatRoom(roomId: string): Promise<EnumErrorCode> {
    return new Promise<EnumErrorCode>((resolve, reject) => {
      RongIMClient.getInstance().joinChatRoom(roomId, -1, {
        onSuccess: () => {
          resolve(EnumErrorCode.OK)
        },
        onError: err => {
          resolve(EnumErrorCode.IMError)
        }
      })
    })
  }

  public leaveChatRoom(roomId: string): Promise<EnumErrorCode> {
    return new Promise<EnumErrorCode>((resolve, reject) => {
      RongIMClient.getInstance().quitChatRoom(roomId, {
        onSuccess: () => {
          resolve(EnumErrorCode.OK)
        },
        onError: err => {
          resolve(EnumErrorCode.IMError)
        }
      })
    })
  }

  public getInstance(): IMClient {
    return RongIMClient.getInstance()
  }

  public sendMessage(roomId: string, msgId: string, msgContent: any) {
    RongIMClient.getInstance().sendMessage(
      ConversationType.CHATROOM,
      roomId,
      new TextMessage(msgContent),
      {
        onSuccess: () => {
          msgEmitter.emit('RC:TxtMsg-Sended', { msgId: msgId, status: 1 })
        },
        onError: () => {
          msgEmitter.emit('RC:TxtMsg-Sended', { msgId: msgId, status: 2 })
        }
      }
    )
  }

  public sendKeepAlive(roomId: string) {
    var msg = new (RongIMClient.RegisterMessage.MeetingPingMessage as any)({
      meetingId: roomId
    })
    RongIMClient.getInstance().sendMessage(
      ConversationType.PRIVATE,
      roomId,
      msg,
      {
        onSuccess: function() {
          console.log('发送心跳消息成功')
        },
        onError: function() {
          console.log('发送心跳消息失败')
        }
      }
    )
  }
}
const imCore = new IMCore()
export default imCore

// import Vue from 'vue';
// Vue.use(CompositionApi);

// // 已连接用户 Id
// const userId = ref('');
// const appkey = ref('');

// // 连接状态
// const connectionState = ref(ConnectionStatus.DISCONNECTED);
// // 连接中
// const connecting = computed(() => connectionState.value === ConnectionStatus.CONNECTING);
// // 已连接
// const connected = computed(() => connectionState.value === ConnectionStatus.CONNECTED);
// // 未连接
// const disconnected = computed(() => !(connecting.value || connected.value));

// // im 初始化
// let imClient: IMClient;
// let rtcClient;
// const initIM = (APP_KEY: string, NAVI_URL: string, MS_URL: string) => {
//   appkey.value = APP_KEY;

//   // im 初始化
//   imClient = init({
//     appkey: APP_KEY,
//     navigators: NAVI_URL ? [NAVI_URL] : undefined,
//     logLevel: 1,
//   });

//   imClient.watch({
//     message(message) {
//       console.log('receive message =>', message);
//     },
//     status(evt) {
//       console.log('connection status change:', evt.status);
//       connectionState.value = evt.status;
//     },
//   });
// };
// const connect = (TOKEN: string) => {
//   return imClient.connect({ token: TOKEN }).then(user => {
//     userId.value = user.id;
//     console.log('connect success', user.id);
//     return true;
//   }).catch(error => {
//     console.error(error);
//   });
// };

// const disconnect = () => {
//   return imClient.disconnect();
// };

// export {
//   initIM,
//   connect,
//   disconnect,
//   connected,
//   connecting,
//   disconnected,
//   connectionState,
//   userId,
//   appkey,
//   imClient,
// };
