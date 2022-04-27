const electron = require('electron');

const {
    app,
    BrowserWindow,
    ipcMain,
    session,
} = electron;
const path = require('path');

const AutoLaunch = require('auto-launch');
const Utils = require('../../utils');
const Config = require('../../config');
const { appLogger } = require('../../common/logger');

const levelsArr = ['debug', 'info', 'warn', 'error'];

// 配置是否需要清除缓存; windows 需要在窗体都关闭后做清除,否则出错
let needDelCache = false;

const getLauncher = () => {
    let exePath = process.execPath;
    if (Utils.platform.darwin) {
        exePath = `${exePath.split('.app/Content')[0]}.app`;
    }
    const launcher = new AutoLaunch({
        name: Config.APP_NAME,
        path: exePath,
    });
    return launcher;
};

//* ******自启动开始*******
const minecraftAutoLauncher = getLauncher();
app.minecraftAutoLauncher = minecraftAutoLauncher;
//* ******自启动结束*******

ipcMain.on('clear-cache', () => {
    needDelCache = true;
});

ipcMain.on('relaunch', () => {
    app.exit();
    app.relaunch();
});

ipcMain.on('exit', () => {
    app.exit();
});

ipcMain.on('purge-cache', () => {
    clearCache();
});

ipcMain.on('logout', () => {
    BrowserWindow.tray.reset();
    if (Utils.platform.darwin) {
        setBadge(0, '');
    }
});

ipcMain.on('set-connect', (event, isConnect) => {
    setConnectStatus(isConnect);
});

ipcMain.on('set-auto-launch', (event, isAutoLaunch) => {
    setAutoLaunch(isAutoLaunch);
    // config 保存
});

ipcMain.on('reload', () => {
    app.relaunch();
    app.exit(0);
    // if ( BrowserWindow.mainWindow) BrowserWindow.mainWindow.reload();
});

ipcMain.on('reloadIgnoringCache', () => {
    if (BrowserWindow.mainWindow) BrowserWindow.mainWindow.reloadIgnoringCache();
});

ipcMain.on('appLog', (event, levels, log) => {
    let tempLevel;
    if (levels && levelsArr.indexOf(levels.toLowerCase()) > -1) {
        tempLevel = levels.toLowerCase() || 'info';
    } else {
        tempLevel = 'info';
    }
    appLogger[tempLevel](log);
});

app.on('window-all-closed', () => {
    if (needDelCache) {
        clearCache();
    }
});

function setAutoLaunch(isAutoLaunch) {
    if (isAutoLaunch) {
        minecraftAutoLauncher.enable();
        return;
    }
    minecraftAutoLauncher.disable();
}

function loadHome() {
    if (BrowserWindow.mainWindow) BrowserWindow.mainWindow.reload();
}

function clearCache() {
    if (!BrowserWindow.mainWindow) return;
    const ses = session.defaultSession;
    new Promise(rslv => ses.clearCache(() => rslv()))
        .then(() => new Promise(rslv => ses.clearStorageData(() => rslv())))
        .then(() => loadHome());
}

function setBadge(unreadCount, showCount) {
    app.dock.setBadge(`${showCount}`);
    BrowserWindow.tray.setTitle(showCount);
}

function setConnectStatus(isConnect) {
    if (Utils.platform.win32) {
        const icon = isConnect ? Config.WIN.TRAY : Config.WIN.TRAY_DROP;
        const iconPath = path.join(__dirname, '../../../res', icon);
        BrowserWindow.tray.setImage(iconPath);
    }
}

electron.powerMonitor
    .on('suspend', () => {
        appLogger.info('electron.powerMonitor on suspend ==>');
        BrowserWindow.mainWindow.suspend();
    }).on('resume', () => {
        appLogger.info('electron.powerMonitor on resume ==>');
        BrowserWindow.mainWindow.resume();
    });
