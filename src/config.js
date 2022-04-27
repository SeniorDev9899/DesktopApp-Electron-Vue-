const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { ConfigIniParser } = require('config-ini-parser');

const delimiter = '\n'; // or "\n" for *nux
// If don't assign the parameter delimiter then the default value \n will be used
const parser = new ConfigIniParser(delimiter);
const localConfig = path.join(__dirname, 'app.conf');
const iniContent = fs.readFileSync(localConfig, 'utf-8');
parser.parse(iniContent);
const version = parser.get('base', 'version');
const versionCode = parser.get('base', 'versioncode');
const appId = parser.get('base', 'appid');
const appName = parser.get('base', 'appname');
const protocal = parser.get('base', 'protocol');
// const productName = parser.get('base', 'productname');
const productNameEn = parser.get('base', 'productnameen');
const productNameZh = parser.get('base', 'productnamezh');
// const description = parser.get('base', 'description');
// const copyright = parser.get('base', 'copyright');
const home = parser.get('base', 'home');
const author = parser.get('base', 'author');
const ignoreCertificateErrors = parser.get('base', 'ignorecertificateerrors');
const noProxy = parser.get('base', 'noproxy');
const reportUrl = parser.get('base', 'reporturl');
const appServer = parser.get('base', 'appserver');
const build = parser.get('base', 'build');
const netEnvironment = parser.get('base', 'netEnvironment');
// const { platform } = require('./utils');
const imConfig = {
    IM_SUB_MODULE: 'webapp',
    SEALMEETING_SUB_MODULE: 'sealmeeting',
    IM_COMMIT_ID: '485fb009',
    SUPPORT_SCREENSHOT: true,
    REPORT_URL: reportUrl,
    DEFAULT_PORT: 33003,
    APP_ID: appId,
    HOME: home,
    PROTOCAL: protocal,
    // WINICON: 'app.ico',
    ALWAYS_SHOW_IN_PRIMARY: false,
    // 忽略CA证书验证错误
    IGNORE_CERTIFICATE_ERRORS: ignoreCertificateErrors === 'true',
    APP_NAME: appName,
    APP_SERVER: appServer.trim(),
    APP_VERSION: version,
    APP_VERSION_CODE: versionCode,
    PRODUCT_NAME_EN: productNameEn,
    PRODUCT_NAME_ZH: productNameZh,
    AUTHOR: author,
    // 忽略代理
    NO_PROXY: noProxy,
    // 当前环境是内网还是外网
    NET_ENVIRONMENT: netEnvironment,
    WIN: {
        //  WINDOWS ONLY,TRAY BLINK ON
        //  new Tray,tray.setImage
        TRAY: 'Windows_icon@32.png',
        //  WINDOWS ONLY,TRAY BLINK OFF
        //  tray.setImage
        TRAY_OFF: 'Windows_Remind_icon.png',
        TRAY_DROP: 'Windows_offline_icon.png',
        //  tray.displayBalloon
        BALLOON_ICON: 'app.png',
        INIT_WIDTH: 1000, // new add
        INIT_HEIGHT: 640, // new add
    },
    MAC: {
        // HELPER_BUNDLE_ID: 'SealTalk_Ent_Test',
        //  new Tray
        TRAY: 'Mac_Template.png',
        //  tray.setPressedImage
        PRESSEDIMAGE: 'Mac_TemplateWhite.png',
    },
    LINUX: {
        APPICON: 'app.png',
    },
    VOIP: {
        INDEX: '/voip.html',
        MINWIDTH: 100,
        MINHEIGHT: 100,
        BOUNDS: {
            X: 0,
            Y: 0,
            WIDTH: 338,
            HEIGHT: 260,
        },
    },
    IMAGE_VIEWER: {
        TITLE: '图片查看',
        INDEX: '/image-viewer.html',
        MINWIDTH: 400,
        MINHEIGHT: 400,
        BOUNDS: {
            X: 0,
            Y: 0,
            WIDTH: 350,
            HEIGHT: 300,
        },
    },
    ABOUT: {
        INDEX: '/views/about.html',
        SIZE: {
            WIDTH: 440,
            HEIGHT: 290,
        },
        TITLE: `${appName} for Mac`,
        VERSION: `v${version} (Build:${versionCode})`,
        URL_HOMEPAGE: home,
        URL_INTRODUCTION: '/versions.html?browser=0',
    },
    DEBUG: build.toLowerCase() !== 'release',
};

imConfig.webInfo = {
    APP_KEY: '',
    USER_ID: '',
    USER_NAME: '',
    PORTRAIT: '',
    IM_TOKEN: '',
    RCESESSIONID: '',
    NETENV: imConfig.NET_ENVIRONMENT,
    MEETING_SERVER: appServer,
    LAUNCH_FROM: 'rce',
    IS_VIDEO_ON: false,
    IS_AUDIO_ON: false,
};

imConfig.getAppHost = (moduleName) => {
    let subPath = '';
    if (moduleName === imConfig.SEALMEETING_SUB_MODULE) {
        subPath = '/meeting';
    }
    return app.isPackaged
        ? `http://localhost:${imConfig.DEFAULT_PORT}${subPath}`
        : `http://localhost:${imConfig.devPort[moduleName]}`;
};

imConfig.getElectronVersion = (electronVersion) => {
    const reg = /[\^=~]?([0-9]+\.[0-9]+)\.[0-9]+/;
    if (!electronVersion) {
        electronVersion = process.versions.electron;
    }
    return electronVersion.replace(reg, '$1');
};

module.exports = imConfig;
