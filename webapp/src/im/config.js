import locale from './locale';
import { Accessor, addServerConfSuffix } from './components/server-conf/utils';

const { RongDesktop, config: setting } = window;
const recallMessageTimeout = 3;// 消息撤回设置，单位分钟
const recallEditTimeout = 5;// 消息撤回可编辑，单位分钟

const support = IS_DESKTOP ? {
    screenshot: RongDesktop.configInfo.SUPPORT_SCREENSHOT,
    downloadProgress: true,
    openFile: true,
    openFolder: true,
    balloonClick: true,
    search: true,
    voip: true,
    autoReconnect: true,
} : {
    screenshot: false,
    downloadProgress: false,
    openFile: false,
    openFolder: false,
    balloonClick: false,
    search: false,
    voip: false,
    autoReconnect: false,
};

const cacheServerConf = Accessor.getCheckedItem();
const getServerRes = () => (cacheServerConf ? cacheServerConf.name : (setting.server || APP_SERVER));
const config = {
    debug: true,
    IM_SUB_MODULE: 'webapp',
    SEALMEETING_SUB_MODULE: 'sealmeeting',
    locale: setting.locale,
    dataModel: {
        server: addServerConfSuffix(getServerRes()), // 需要加上/api后缀
    },
    sdk: {
        protobuf: 'lib/protobuf-2.3.1.min.js',
    },
    sdkVersion: '2.6.0', // pc不影响 做数据统计用
    emoji: {
        sizePX: 16,
        url: 'lib/emoji/emoji-48.png',
    },
    voice: {
        swfobject: 'lib/swfobject-2.0.0.min.js',
        player: 'lib/player-2.0.2.swf',
    },
    upload: {
        file: {
            imageSize: 5 * 1024 * 1024, // 图片上限，到达上限后且小于文件上限转文件发送
            chunkSize: 1 * 1024 * 1024,
        },
        base64: {
            size: 5 * 1024 * 1024, // base64大小, 私有云服务器需设置,默认5M
        },
        timeout: 60000,
    },
    download: {
    },
    recallMessageTimeout: recallMessageTimeout * 60 * 1000, // 单位毫秒
    recallEditTimeout: recallEditTimeout * 60 * 1000, // 单位毫秒
    product: setting.product,
    layout: {
        rongList: {
            width: {
                max: 280,
                min: 230,
            },
        },
        main: {
            margin: {
                left: 300,
            },
        },
        messageInput: {
            height: {
                max: 246,
                min: 120,
            },
        },
        navBar: {
            width: {
                min: 70,
                max: 70,
            },
        },
    },
    conversationList: {
        pageNum: 30, // 会话列表每页显示数量
    },
    search: {
        pageNum: 50, // 搜索每页显示数量
    },
    profile: {
        pageNum: 50, // 通讯录每页显示数量
    },
    groupSetting: {
        pageNum: 50, // 群成员每页显示数量,一行5个
    },
    ack: {
        pageNum: 63, // 已读状态每页显示数量，一行9个
    },
    maxGroupMemberNum: 3000, // 群组人数上限，若 server 不下发，则生效
    syncDelayTime: 1000, // 延时 1000 ms 防止大量接受离线消息重复更新
    modules: {
        // qrcodeLogin friend 使用的 server 返回结果 /configuration/all
        forgetPwd: setting.forgetPwd,

        star: true, // 星标联系人入口，若要关闭，需设置 false
        collect: true, // 收藏功能入口
        upgrade: true, // 设置中是否显示版本说明
    },
    zip: '+86',
    support,
    // 获取当前语言环境下的语言配置包
    currentLocale() {
        return locale[this.locale];
    },
    screenLockTime: 10 * 60 * 60 * 1000, // 默认锁屏时间 10分钟
    // 是否启用配置服务地址
    useServerConfFlag: setting.useServerConfFlag,
    netEnvironment: '',
};

const getRongDesktopServerRes = () => {
    if (cacheServerConf) {
        if (cacheServerConf.name) {
            return cacheServerConf.name;
        }
        return RongDesktop.configInfo.APP_SERVER;
    }
    return RongDesktop.configInfo.APP_SERVER;
};
// 桌面端通过 RongDesktop 定义 version、versionCode、应用名和 server 地址
if (RongDesktop) {
    if (RongDesktop.configInfo) {
        // config.dataModel.server = RongDesktop.configInfo.APP_SERVER;
        config.dataModel.server = addServerConfSuffix(getRongDesktopServerRes()); // 需要加上/api后缀
        config.dataModel.meetingServer = `${config.dataModel.server}/meeting`;
        config.product.name = {
            zh: RongDesktop.configInfo.PRODUCT_NAME_ZH,
            en: RongDesktop.configInfo.PRODUCT_NAME_EN,
        };
        config.product.version = RongDesktop.configInfo.APP_VERSION;
        config.product.versionCode = RongDesktop.configInfo.APP_VERSION_CODE;
        config.netEnvironment = RongDesktop.configInfo.NET_ENVIRONMENT;
    }
    // 多个窗口引用此文件，但 builder 中的 preload 未必对所有内容进行了挂载，故需要添加判断
    if (RongDesktop.system) {
        config.locale = RongDesktop.system.locale.split('-')[0];
    }
}

export default config;
