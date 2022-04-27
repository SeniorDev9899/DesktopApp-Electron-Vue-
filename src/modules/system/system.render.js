const {
    ipcRenderer,
    remote,
    clipboard,
    nativeImage,
} = require('electron');

const { BrowserWindow } = remote;

const mac = require('getmac');
// const cWindow = require('../window/window.render');
const MenuHandler = require('../../handlers/menu');

const sharedLocale = remote.getGlobal('locale');
const configInfo = require('../../config.js');
const emitter = require('../../common/globalEvents');

let isShowVersion = false;

function setShowVersion(value) {
    isShowVersion = value;
}

let configAutoLanch;
setTimeout(() => {
    remote.app.minecraftAutoLauncher.isEnabled()
        .then((isEnabled) => {
            configAutoLanch = isEnabled;
        })
        .catch((/* err */) => {
        // handle error
        });
}, 0);

let notificationClickedListener = null;

ipcRenderer.on('notification-clicked', (event, { conversationType, targetId }) => {
    BrowserWindow.mainWindow.restore();
    BrowserWindow.mainWindow.show();
    if (notificationClickedListener) {
        notificationClickedListener(conversationType, targetId);
    }
});

function messageNotification({
    conversationType, targetId, title, body, permanentNot,
}) {
    ipcRenderer.send('show-notification', {
        conversationType, targetId, title, body, permanentNot,
    });
}

let macAddress = null;

const systemRender = {
    isShowVersion,
    setShowVersion,
    setLanguage,
    messageNotification,
    clearCache() {
        ipcRenderer.send('clear-cache');
    },
    relaunch() {
        ipcRenderer.send('relaunch');
    },
    exit() {
        ipcRenderer.send('exit');
    },
    logout() {
        ipcRenderer.send('logout');
        MenuHandler.enableAppMenu(false);
    },
    login() {
        ipcRenderer.send('login');
        MenuHandler.enableAppMenu(true);
    },
    locale: remote.app.getLocale(),
    deviceId: macAddress,
    dbPath: remote.app.getPath('userData'),
    platform: process.platform,
    version: configInfo.APP_VERSION,
    userDataPath: remote.app.getPath('userData'),
    setAutoLaunch(isAutoLaunch) {
        ipcRenderer.send('set-auto-launch', isAutoLaunch);
        configAutoLanch = isAutoLaunch;
    },
    getAutoLaunch() {
        return configAutoLanch;
    },
    setConnectStatus(isConnect) {
        ipcRenderer.send('set-connect', isConnect);
    },
    // imgPath 只能是本地路径
    writeImage(imgPath) {
        const img = nativeImage.createFromPath(imgPath);
        clipboard.writeImage(img);
    },
    reload() {
        ipcRenderer.send('reload');
    },
    reloadIgnoringCache() {
        ipcRenderer.send('reloadIgnoringCache');
    },
    appLogger(levels, message) {
        ipcRenderer.send('appLog', levels, message);
    },
    onNotificationClicked(listener) {
        notificationClickedListener = listener;
    },
};

function setLanguage(lang) {
    if (lang === 'zh') {
        lang = 'zh-CN';
    }
    ipcRenderer.send('set-locale', lang);
    new MenuHandler()
        .create(sharedLocale);

    BrowserWindow.tray.setLang(sharedLocale);
}

ipcRenderer.on('contextMenu', (event, params) => {
    const {
        selectionText,
        isEditable,
    } = params.props;
    if (selectionText === '' && !isEditable) {
        return;
    }
    params.isEditable = isEditable;
    params.locale = sharedLocale;
    MenuHandler.showContextMenu(params);
});

mac.getMac((err, macStr) => {
    if (err) throw err;
    macAddress = macStr;
    systemRender.deviceId = macStr;
});

ipcRenderer.on('logError', (event, msg) => {
    console.error('main process error:', msg);
});

ipcRenderer.on('onResume', (/* event */) => {
    // 唤醒时通知 web
    emitter.emit('onResume');
});

ipcRenderer.on('onSupsend', () => {
    emitter.emit('onSuspend');
});

module.exports = systemRender;
