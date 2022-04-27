import Fingerprint from 'fingerprintjs';

const noop = $.noop;

function getDeviceId() {
    const fp = new Fingerprint({
        canvas: true,
        ie_activex: true,
        screen_resolution: true,
    });
    return fp.get();
}

// @return 'web-darwin' or 'web-win32' or 'darwin' or 'win32'
function getPlatform() {
    let platform = navigator.platform.toLowerCase();
    if (platform.indexOf('mac') === 0) {
        platform = 'darwin';
    } else if (platform.indexOf('win') === 0) {
        platform = 'win32';
    } else if (platform.indexOf('linux') === 0) {
        platform = 'linux';
    }
    return `web-${platform}`;
}

export default {
    setShowVersion: noop,
    setLanguage: noop,
    clearCache: noop,
    relaunch: noop,
    exit: window.close,
    logout: noop,
    setConnectStatus: noop,
    locale: navigator.language || navigator.systemLanguage,
    getDeviceId,
    dbPath: '',
    platform: getPlatform(),
    version: '',
    userDataPath: '',
    login: noop,
    setAutoLaunch: noop,
    getAutoLaunch() { return false; },
    openByBrowser: noop,
    appLogger: noop,
    onNotificationClicked: noop,
};
