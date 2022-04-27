function setLanguage(lang) {
    if (typeof RongDesktop === 'object' && typeof RongDesktop.system === 'object' && typeof RongDesktop.system.setLanguage === 'function') {
        RongDesktop.system.setLanguage(lang);
    }
}

function clearCache() {
    RongDesktop.system.clearCache();
}

function relaunch() {
    RongDesktop.system.relaunch();
}

function exit() {
    RongDesktop.system.exit();
}

function logout() {
    RongDesktop.system.logout();
}

function login() {
    RongDesktop.system.login();
}

function reload() {
    RongDesktop.system.reload();
}

function reloadIgnoringCache() {
    RongDesktop.system.reloadIgnoringCache();
}

function setShowVersion(value) {
    RongDesktop.system.setShowVersion(value);
}

function appLogger(levels, log) {
    RongDesktop.system.appLogger(levels, log);
}

export default {
    setLanguage,
    clearCache,
    relaunch,
    exit,
    logout,
    locale: RongDesktop.system.locale,
    getDeviceId() {
        // PC 初始化时值为 null 改为使用方法获取
        return RongDesktop.system.deviceId;
    },
    messageNotification: RongDesktop.system.messageNotification,
    onNotificationClicked: RongDesktop.system.onNotificationClicked,
    dbPath: RongDesktop.system.dbPath,
    platform: RongDesktop.system.platform,
    version: RongDesktop.system.version,
    userDataPath: RongDesktop.system.userDataPath,
    setConnectStatus: RongDesktop.system.setConnectStatus,
    login,
    setAutoLaunch: RongDesktop.system.setAutoLaunch,
    getAutoLaunch: RongDesktop.system.getAutoLaunch,
    reload,
    reloadIgnoringCache,
    setShowVersion,
    openByBrowser(url) {
        return RongDesktop.shell.openExternal(url);
    },
    appLogger,
};
