const electron = require('electron');

const {
    app, BrowserWindow, ipcMain, protocol, powerSaveBlocker,
} = electron;

const i18n = require('i18n');
const Config = require('./config');
const Utils = require('./utils');

const { platform } = Utils;
const AppConfig = require('./configuration');
const createLocalServer = require('./modules/proxy');

const { appLogger } = require('./common/logger');
const dialog = require('./common/dialog');

const RCEWindow = require('./windows/rce');
const AppTray = require('./windows/app_tray');
const ImageViewerModule = require('./modules/image_viewer/image_viewer.main');
// Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
const MiniTray = require('./windows/mini_tray');

const id = powerSaveBlocker.start('prevent-app-suspension');
appLogger.info(`阻止系统挂起，保持系统活跃:  ${powerSaveBlocker.isStarted(id)}`);

const initSize = {
    width: Config.WIN.INIT_WIDTH,
    height: Config.WIN.INIT_HEIGHT,
};

const argvs = process.argv;
[global.processENV] = argvs.slice(2, 3);
Config.devPort = Utils.getDevPorts(argvs, Config);
let rceWindow = null;
let tray = null;
let alertTray = null;

let workAreaSize = 0;
let badgeCnt = 0;
const winState = [];

const loadWindowBounds = () => {
    const x = AppConfig.readSettings('x');
    const y = AppConfig.readSettings('y');
    const width = AppConfig.readSettings('width');
    const height = AppConfig.readSettings('height');
    if (!x || !y || !width || !height) {
        return null;
    }
    return {
        x,
        y,
        width,
        height,
    };
};

const checkScreenInner = (position) => {
    if (!position) {
        return false;
    }
    const { screen } = electron;
    const screenList = screen.getAllDisplays();
    const { x } = position;
    const { y } = position;
    for (let i = 0, { length } = screenList; i < length; i += 1) {
        const { bounds } = screenList[i];
        const xInner = x > bounds.x && x < bounds.x + bounds.width;
        const yInner = y > bounds.y && y < bounds.y + bounds.height;
        if (xInner && yInner) {
            return true;
        }
    }
    return false;
};

// Load window bounds info from setting file. create an empty file when not exist
const saveWindowBounds = (bounds) => {
    AppConfig.saveSettings('x', bounds.x);
    AppConfig.saveSettings('y', bounds.y);
    AppConfig.saveSettings('width', bounds.width);
    AppConfig.saveSettings('height', bounds.height);
};

const getWindowBounds = () => {
    const lastWindowBounds = loadWindowBounds();
    let bounds = {
        x: (workAreaSize.width - initSize.width) / 2,
        y: (workAreaSize.height - initSize.height) / 2,
        width: initSize.width,
        height: initSize.height,
    };
    const useLastBounds = !Config.ALWAYS_SHOW_IN_PRIMARY
        && lastWindowBounds !== null
        && checkScreenInner(lastWindowBounds);
    if (useLastBounds) {
        bounds = lastWindowBounds;
    }
    saveWindowBounds(bounds);
    return bounds;
};

const intScreen = () => {
    const { screen } = electron;
    workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    screen.on('display-metrics-changed', (event, display) => {
        workAreaSize = display.workAreaSize;
    });
};
const createRCEWindow = () => {
    const winBounds = getWindowBounds();
    rceWindow = new RCEWindow(winBounds, winBounds);
    BrowserWindow.mainWindow = rceWindow;
    require('./modules/notification')();
};
const createTray = () => {
    tray = new AppTray(rceWindow, global.locale);
    BrowserWindow.tray = tray;
};
const initIpcEvents = () => {
    require('./modules/system/system.main');
    require('./modules/window/window.main');
    ipcMain.on('notification-click', () => {
        if (rceWindow) {
            rceWindow.show();
        }
    });
    ipcMain.on('reload', () => {
        // if (rceWindow) {
        //     rceWindow.reload();
        // }
    });
    ipcMain.on('open-settings', () => {
        if (rceWindow) {
            rceWindow.show();
            rceWindow.setting();
        }
    });
    // Focus on search input element.
    ipcMain.on('search', () => {
        if (rceWindow) {
            rceWindow.search();
        }
    });
    ipcMain.on('bring-front', (event, isFront) => {
        if (rceWindow) {
            rceWindow.setAlwaysOnTop(isFront);
        }
    });
    ipcMain.on('set-locale', (event, lang) => {
        i18n.setLocale(lang);
    });
    ipcMain.on('openConversation', (event, params) => {
        BrowserWindow.mainWindow.sendCommand('openConversation', params);
    });
    ipcMain.on('start_main', () => {
        rceWindow.start();
    });
    ipcMain.on('quit', () => {
        app.quit();
    });

    // Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
    ipcMain.on('open-conversation-tray', (event, item) => {
        if (!rceWindow.isVisible()) {
            rceWindow.show();
            winState.length = 0;
            return;
        }
        let isWinHide = false;
        if (winState[0] === 'focus' && winState[1] === 'blur') {
            isWinHide = true;
            winState.unshift('focus');
            winState.length = 2;
        }
        if (isWinHide) {
            rceWindow.show();
        } else {
            rceWindow.dockClick();
        }

        rceWindow.sendConversationData(item);
    });
    // Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
    ipcMain.on('updated-list-data-main', (event, items) => {
        let unReadCnt = 0;
        let iItems = 0;

        for (let i = 0; i < items.length; i += 1) {
            unReadCnt += items[i].unreadMessageCount;

            if (items[i].unreadMessageCount > 0) iItems += 1;
        }

        if (badgeCnt !== unReadCnt) {
            console.log("unread Count Total => ", unReadCnt);
            if (unReadCnt > 0) {
                if (alertTray === null) {
                    alertTray = new MiniTray();
                    alertTray.createTray(iItems);
                    alertTray.sendData(items, iItems);
                } else {
                    alertTray.sendData(items, iItems);
                }
                badgeCnt = unReadCnt;
            } else {
                if (alertTray) alertTray.desotryTroy();
                alertTray = null;
                badgeCnt = 0;
            }
        }
    });

    // Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
    ipcMain.on('destory-tray-icon', () => {
        alertTray.desotryTroy();
        alertTray = null;
    });
};

const appReady = () => {
    if (Config.SUPPORT_SCREENSHOT) {
        require('./modules/screenshot/screenshot.main');
    }
    require('./modules/browser_window/browser.main');
    require('./modules/database/sqlite.main');
    intScreen();
    createRCEWindow();
    // 图片查看器初始化
    ImageViewerModule.init();
    createTray();
    initIpcEvents();

    protocol.interceptFileProtocol('file', (req, callback) => {
        const url = req.url.substr(8);
        callback(decodeURI(url));
    }, (error) => {
        if (error) {
            console.error('Failed to register protocol');
        }
    });

    const voipMain = require('./modules/voip/voip.main');
    if (typeof voipMain !== 'undefined' && voipMain) {
        voipMain.init(rceWindow);
    }

    protocol.registerFileProtocol('file', (request, callback) => {
        const pathname = decodeURI(request.url.replace('file:///', ''));
        callback(pathname);
    });
};

const initApp = () => {
    let rcService;
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
    if (Config.IGNORE_CERTIFICATE_ERRORS) {
        app.commandLine.appendSwitch('ignore-certificate-errors');
    }
    if (Config.NO_PROXY) {
        app.commandLine.appendSwitch('no-proxy-server');
    }
    // 禁用本地缓存
    app.commandLine.appendSwitch('--disable-http-cache');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    require('./modules/crash_report/crashreport.main.js');
    if (platform.win32) {
        app.setAppUserModelId(Config.APP_ID);
    }
    app.on('ready', () => {
        const options = {
            debug: true,
        };
        if (Utils.platform.win32) {
            options.dbpath = Buffer.from(app.getPath('userData')).toString('utf-8');
        }
        rcService = require('@rongcloud/electron-solution')(options);
        appReady();
        app.on('activate', () => {
            if (!rceWindow.isVisible()) {
                rceWindow.show();
                winState.length = 0;
                return;
            }
            let isWinHide = false;
            if (winState[0] === 'focus' && winState[1] === 'blur') {
                isWinHide = true;
                winState.unshift('focus');
                winState.length = 2;
            }
            if (isWinHide) {
                rceWindow.show();
            } else {
                rceWindow.dockClick();
            }
        });
    });
    app.on('before-quit', () => {
        if (rcService) {
            const cppProto = rcService.getCppProto();
            if (cppProto.deInit) cppProto.destroy();
        }
        if (rceWindow) {
            rceWindow.enableForceQuit();
        }
        tray.reset();
    });
    app.on('window-all-closed', () => {
        app.quit();
    });
    app.on('menu.view.bringFront', (checked) => {
        if (rceWindow) {
            rceWindow.setAlwaysOnTop(checked);
        }
    });
    app.on('browser-window-blur', () => {
        winState.unshift('blur');
    });

    app.on('browser-window-focus', () => {
        winState.unshift('focus');
    });
};

(async () => {
    const isPrimary = app.requestSingleInstanceLock();
    if (!isPrimary) {
        app.exit();
        return;
    }
    appLogger.info('------------------ 应用已启动 ------------------');
    appLogger.info(`userDataPath => ${Config.appBasePath}`);
    appLogger.info({
        electronVersion: process.versions.electron,
        appVersion: Config.APP_VERSION,
        versionCode: Config.APP_VERSION_CODE,
    });
    app.setAsDefaultProtocolClient(Config.PROTOCAL);
    app.on('second-instance', (/* event, argv, workingDirectory */) => {
        if (rceWindow) {
            rceWindow.show();
        }
    });
    global.locale = {};
    i18n.configure({
        locales: ['en', 'zh-CN'],
        directory: `${__dirname}/locales`,
        objectNotation: true,
        register: global.locale,
    });
    const userData = app.getPath('userData');
    let port = parseInt(Config.DEFAULT_PORT, 10);
    try {
        appLogger.info('开始启动代理服务！');
        // 启动 Web 代理服务
        port = await createLocalServer(port, userData);
    } catch (error) {
        appLogger.error(`启动失败，应用退出 => ${error.stack}`);
        app.exit();
        return;
    }
    appLogger.info(`代理服务已启动，监听端口：${port}`);
    Config.DEFAULT_PORT = port;
    initApp();
})();

process.on('error', (err) => {
    appLogger.error(err.toString());
});

process.on('uncaughtException', (error) => {
    appLogger.error(error);
    if (rceWindow) {
        rceWindow.sendCommand('logError', error.stack);
    } else {
        dialog.showError(error);
    }
});
